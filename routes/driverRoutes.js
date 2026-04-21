const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const { getProfile, toggleStatus, updateLocation, sendEmergency } = require('../controllers/driverController');

router.use(protect, requireRole('driver'));

router.get('/profile', getProfile);
router.put('/status', toggleStatus);
router.put('/location', updateLocation);
router.post('/emergency', sendEmergency);

module.exports = router;
