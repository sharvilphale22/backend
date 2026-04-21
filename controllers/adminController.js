const User = require('../models/User');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Notification = require('../models/Notification');

// ===================== DASHBOARD =====================

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const [totalStudents, totalDrivers, totalBuses, activeBuses, totalRoutes] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'driver' }),
      Bus.countDocuments(),
      Bus.countDocuments({ status: { $in: ['active', 'moving'] } }),
      Route.countDocuments()
    ]);

    const onlineDrivers = await User.countDocuments({ role: 'driver', isOnline: true });

    res.json({
      totalStudents,
      totalDrivers,
      totalBuses,
      activeBuses,
      totalRoutes,
      onlineDrivers
    });
  } catch (error) {
    next(error);
  }
};

// ===================== STUDENTS =====================

// @desc    Get all students
// @route   GET /api/admin/students
exports.getStudents = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = { role: 'student' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { erpId: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(query).populate('assignedBus').sort({ createdAt: -1 });
    res.json({ students });
  } catch (error) {
    next(error);
  }
};

// @desc    Create student
// @route   POST /api/admin/students
exports.createStudent = async (req, res, next) => {
  try {
    const { name, email, password, erpId, phone, assignedBus, pickupPoint, dropPoint } = req.body;

    const student = await User.create({
      name,
      email,
      password: password || 'student123',
      role: 'student',
      erpId,
      phone,
      assignedBus: assignedBus || null,
      pickupPoint,
      dropPoint
    });

    res.status(201).json({ student });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student
// @route   PUT /api/admin/students/:id
exports.updateStudent = async (req, res, next) => {
  try {
    const { name, email, phone, erpId, assignedBus, pickupPoint, dropPoint } = req.body;
    const updateData = { name, email, phone, erpId, pickupPoint, dropPoint };

    if (assignedBus !== undefined) {
      updateData.assignedBus = assignedBus || null;
    }

    const student = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).populate('assignedBus');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ student });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete student
// @route   DELETE /api/admin/students/:id
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await User.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ===================== DRIVERS =====================

// @desc    Get all drivers
// @route   GET /api/admin/drivers
exports.getDrivers = async (req, res, next) => {
  try {
    const drivers = await User.find({ role: 'driver' }).populate('assignedBus').sort({ createdAt: -1 });
    res.json({ drivers });
  } catch (error) {
    next(error);
  }
};

// @desc    Create driver
// @route   POST /api/admin/drivers
exports.createDriver = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const driver = await User.create({
      name,
      email,
      password: password || 'driver123',
      role: 'driver',
      phone
    });

    res.status(201).json({ driver });
  } catch (error) {
    next(error);
  }
};

// @desc    Update driver
// @route   PUT /api/admin/drivers/:id
exports.updateDriver = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    const driver = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone },
      { new: true, runValidators: true }
    ).populate('assignedBus');

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json({ driver });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete driver
// @route   DELETE /api/admin/drivers/:id
exports.deleteDriver = async (req, res, next) => {
  try {
    // Unassign from any bus first
    await Bus.updateMany({ driver: req.params.id }, { driver: null });

    const driver = await User.findByIdAndDelete(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ===================== BUSES =====================

// @desc    Get all buses
// @route   GET /api/admin/buses
exports.getBuses = async (req, res, next) => {
  try {
    const buses = await Bus.find().populate('route').populate('driver', 'name email phone').sort({ createdAt: -1 });
    res.json({ buses });
  } catch (error) {
    next(error);
  }
};

// @desc    Create bus
// @route   POST /api/admin/buses
exports.createBus = async (req, res, next) => {
  try {
    const { busNumber, licensePlate, capacity, route, driver } = req.body;

    const bus = await Bus.create({
      busNumber,
      licensePlate,
      capacity,
      route: route || null,
      driver: driver || null
    });

    // If driver assigned, update their assignedBus
    if (driver) {
      await User.findByIdAndUpdate(driver, { assignedBus: bus._id });
    }

    const populated = await Bus.findById(bus._id).populate('route').populate('driver', 'name email phone');
    res.status(201).json({ bus: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update bus
// @route   PUT /api/admin/buses/:id
exports.updateBus = async (req, res, next) => {
  try {
    const { busNumber, licensePlate, capacity, route, driver, status } = req.body;

    const oldBus = await Bus.findById(req.params.id);
    if (!oldBus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    // If driver changed, update old and new driver's assignedBus
    if (driver !== undefined && String(oldBus.driver) !== String(driver)) {
      if (oldBus.driver) {
        await User.findByIdAndUpdate(oldBus.driver, { assignedBus: null });
      }
      if (driver) {
        await User.findByIdAndUpdate(driver, { assignedBus: req.params.id });
      }
    }

    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      { busNumber, licensePlate, capacity, route: route || null, driver: driver || null, status },
      { new: true, runValidators: true }
    ).populate('route').populate('driver', 'name email phone');

    res.json({ bus });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete bus
// @route   DELETE /api/admin/buses/:id
exports.deleteBus = async (req, res, next) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    // Unassign driver and students
    if (bus.driver) {
      await User.findByIdAndUpdate(bus.driver, { assignedBus: null });
    }
    await User.updateMany({ assignedBus: req.params.id }, { assignedBus: null });

    await Bus.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bus deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ===================== ROUTES =====================

// @desc    Get all routes
// @route   GET /api/admin/routes
exports.getRoutes = async (req, res, next) => {
  try {
    const routes = await Route.find().sort({ createdAt: -1 });
    res.json({ routes });
  } catch (error) {
    next(error);
  }
};

// @desc    Create route
// @route   POST /api/admin/routes
exports.createRoute = async (req, res, next) => {
  try {
    const { name, stops, startPoint, endPoint } = req.body;
    const route = await Route.create({ name, stops, startPoint, endPoint });
    res.status(201).json({ route });
  } catch (error) {
    next(error);
  }
};

// @desc    Update route
// @route   PUT /api/admin/routes/:id
exports.updateRoute = async (req, res, next) => {
  try {
    const { name, stops, startPoint, endPoint } = req.body;
    const route = await Route.findByIdAndUpdate(
      req.params.id,
      { name, stops, startPoint, endPoint },
      { new: true, runValidators: true }
    );

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    res.json({ route });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete route
// @route   DELETE /api/admin/routes/:id
exports.deleteRoute = async (req, res, next) => {
  try {
    // Unassign from buses
    await Bus.updateMany({ route: req.params.id }, { route: null });

    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ===================== NOTIFICATIONS =====================

// @desc    Send notification
// @route   POST /api/admin/notifications
exports.sendNotification = async (req, res, next) => {
  try {
    const { title, message, targetRole } = req.body;

    const notification = await Notification.create({
      title,
      message,
      targetRole: targetRole || 'all',
      createdBy: req.user._id
    });

    // Emit via socket.io (attached to req by server)
    const io = req.app.get('io');
    if (io) {
      io.emit('notification:new', {
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        targetRole: notification.targetRole,
        createdAt: notification.createdAt
      });
    }

    res.status(201).json({ notification });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all notifications
// @route   GET /api/admin/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ notifications });
  } catch (error) {
    next(error);
  }
};
