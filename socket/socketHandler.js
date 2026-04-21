const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Bus = require('../models/Bus');

module.exports = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.name} (${socket.user.role})`);

    // Join role-based rooms
    socket.join(socket.user.role);
    socket.join(`user:${socket.user._id}`);

    // If driver, join bus-specific room
    if (socket.user.assignedBus) {
      socket.join(`bus:${socket.user.assignedBus}`);
    }

    // ============ DRIVER EVENTS ============

    // Driver starts sharing location
    socket.on('driver:start-sharing', async (data) => {
      try {
        const { busId } = data;
        console.log(`📍 Driver ${socket.user.name} started sharing location for bus ${busId}`);

        await User.findByIdAndUpdate(socket.user._id, { isOnline: true });
        await Bus.findByIdAndUpdate(busId, { status: 'active' });

        socket.join(`bus:${busId}`);
        io.emit('driver:status-changed', {
          driverId: socket.user._id,
          busId,
          isOnline: true
        });
      } catch (error) {
        console.error('Error starting location sharing:', error);
      }
    });

    // Driver location update
    socket.on('driver:location-update', async (data) => {
      try {
        const { lat, lng, busId } = data;
        const now = new Date();

        // Update in database
        await Promise.all([
          User.findByIdAndUpdate(socket.user._id, {
            currentLocation: { lat, lng, updatedAt: now }
          }),
          Bus.findByIdAndUpdate(busId, {
            currentLocation: { lat, lng, updatedAt: now },
            status: 'moving'
          })
        ]);

        // Broadcast to all connected clients
        io.emit('bus:location-updated', {
          busId,
          driverId: socket.user._id,
          lat,
          lng,
          timestamp: now
        });
      } catch (error) {
        console.error('Error updating location:', error);
      }
    });

    // Driver stops sharing
    socket.on('driver:stop-sharing', async (data) => {
      try {
        const { busId } = data;
        console.log(`⏹️ Driver ${socket.user.name} stopped sharing for bus ${busId}`);

        await User.findByIdAndUpdate(socket.user._id, { isOnline: false });
        await Bus.findByIdAndUpdate(busId, { status: 'stopped' });

        io.emit('bus:went-offline', { busId });
        io.emit('driver:status-changed', {
          driverId: socket.user._id,
          busId,
          isOnline: false
        });
      } catch (error) {
        console.error('Error stopping location sharing:', error);
      }
    });

    // Emergency alert
    socket.on('driver:emergency', (data) => {
      console.log(`🚨 EMERGENCY from driver ${socket.user.name}`);
      io.emit('emergency:alert', {
        driverId: socket.user._id,
        driverName: socket.user.name,
        busId: data.busId,
        message: data.message || 'Emergency! Driver needs assistance.',
        timestamp: new Date()
      });
    });

    // ============ DISCONNECT ============

    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${socket.user.name}`);

      if (socket.user.role === 'driver') {
        await User.findByIdAndUpdate(socket.user._id, { isOnline: false });
        if (socket.user.assignedBus) {
          await Bus.findByIdAndUpdate(socket.user.assignedBus, { status: 'inactive' });
          io.emit('bus:went-offline', { busId: socket.user.assignedBus });
        }
      }
    });
  });
};
