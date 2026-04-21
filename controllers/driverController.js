const User = require('../models/User');
const Bus = require('../models/Bus');

// @desc    Get driver profile with bus info
// @route   GET /api/driver/profile
exports.getProfile = async (req, res, next) => {
  try {
    const driver = await User.findById(req.user._id)
      .populate({
        path: 'assignedBus',
        populate: { path: 'route' }
      });

    res.json({ driver });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle driver online/offline status
// @route   PUT /api/driver/status
exports.toggleStatus = async (req, res, next) => {
  try {
    const { isOnline } = req.body;

    await User.findByIdAndUpdate(req.user._id, { isOnline });

    // Update bus status
    if (req.user.assignedBus) {
      await Bus.findByIdAndUpdate(req.user.assignedBus, {
        status: isOnline ? 'active' : 'inactive'
      });
    }

    // Notify via socket
    const io = req.app.get('io');
    if (io && req.user.assignedBus) {
      io.emit('driver:status-changed', {
        driverId: req.user._id,
        busId: req.user.assignedBus,
        isOnline
      });
    }

    res.json({ message: `Driver is now ${isOnline ? 'online' : 'offline'}`, isOnline });
  } catch (error) {
    next(error);
  }
};

// @desc    Update driver location (REST fallback)
// @route   PUT /api/driver/location
exports.updateLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;

    if (lat == null || lng == null) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const now = new Date();

    await User.findByIdAndUpdate(req.user._id, {
      currentLocation: { lat, lng, updatedAt: now }
    });

    // Update bus location too
    if (req.user.assignedBus) {
      await Bus.findByIdAndUpdate(req.user.assignedBus, {
        currentLocation: { lat, lng, updatedAt: now },
        status: 'moving'
      });
    }

    res.json({ message: 'Location updated', location: { lat, lng } });
  } catch (error) {
    next(error);
  }
};

// @desc    Send emergency alert
// @route   POST /api/driver/emergency
exports.sendEmergency = async (req, res, next) => {
  try {
    const { message } = req.body;

    const io = req.app.get('io');
    if (io) {
      io.emit('emergency:alert', {
        driverId: req.user._id,
        driverName: req.user.name,
        busId: req.user.assignedBus,
        message: message || 'Emergency! Driver needs assistance.',
        timestamp: new Date()
      });
    }

    res.json({ message: 'Emergency alert sent' });
  } catch (error) {
    next(error);
  }
};
