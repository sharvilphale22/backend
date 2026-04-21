const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  getDashboard,
  getStudents, createStudent, updateStudent, deleteStudent,
  getDrivers, createDriver, updateDriver, deleteDriver,
  getBuses, createBus, updateBus, deleteBus,
  getRoutes, createRoute, updateRoute, deleteRoute,
  sendNotification, getNotifications
} = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(protect, requireRole('admin'));

// Dashboard
router.get('/dashboard', getDashboard);

// Students
router.route('/students').get(getStudents).post(createStudent);
router.route('/students/:id').put(updateStudent).delete(deleteStudent);

// Drivers
router.route('/drivers').get(getDrivers).post(createDriver);
router.route('/drivers/:id').put(updateDriver).delete(deleteDriver);

// Buses
router.route('/buses').get(getBuses).post(createBus);
router.route('/buses/:id').put(updateBus).delete(deleteBus);

// Routes
router.route('/routes').get(getRoutes).post(createRoute);
router.route('/routes/:id').put(updateRoute).delete(deleteRoute);

// Notifications
router.route('/notifications').get(getNotifications).post(sendNotification);

module.exports = router;
