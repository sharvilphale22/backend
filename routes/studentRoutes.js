const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const { getProfile, getBusLocation, getNotifications } = require('../controllers/studentController');

router.use(protect, requireRole('student'));

router.get('/profile', getProfile);
router.get('/bus-location', getBusLocation);
router.get('/notifications', getNotifications);

module.exports = router;
