const User = require('../models/User');
const Bus = require('../models/Bus');
const Notification = require('../models/Notification');

// @desc    Get student profile with bus info
// @route   GET /api/student/profile
exports.getProfile = async (req, res, next) => {
  try {
    const student = await User.findById(req.user._id)
      .populate({
        path: 'assignedBus',
        populate: [
          { path: 'route' },
          { path: 'driver', select: 'name phone email isOnline currentLocation' }
        ]
      });

    res.json({ student });
  } catch (error) {
    next(error);
  }
};

// @desc    Get assigned bus location
// @route   GET /api/student/bus-location
exports.getBusLocation = async (req, res, next) => {
  try {
    const student = await User.findById(req.user._id);

    if (!student.assignedBus) {
      return res.status(404).json({ message: 'No bus assigned' });
    }

    const bus = await Bus.findById(student.assignedBus)
      .populate('driver', 'name phone isOnline currentLocation');

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.json({
      bus: {
        _id: bus._id,
        busNumber: bus.busNumber,
        status: bus.status,
        currentLocation: bus.currentLocation,
        driver: bus.driver
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get notifications for student
// @route   GET /api/student/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      targetRole: { $in: ['all', 'students'] }
    })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ notifications });
  } catch (error) {
    next(error);
  }
};
