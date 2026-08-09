// backend/routes/bookings.js
const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// Members (and admins) can create bookings
router.post('/', requireAuth, requireRole('member', 'admin'), (req, res) => {
  // TODO: replace with real bookings controller
  res.json({ message: `Booking created by ${req.user.name}` });
});

module.exports = router;
