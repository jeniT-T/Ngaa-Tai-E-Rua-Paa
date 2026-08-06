// backend/routes/bookings.js
const express = require('express');
const Booking = require('../models/Booking');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

const VALID_TYPES = ['standard', 'event', 'tangihanga'];

// POST /api/bookings — any logged-in user can request a booking
router.post('/', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, purpose, bookingType } = req.body;

    if (!startDate || !endDate || !purpose) {
      return res.status(400).json({ error: 'Start date, end date and purpose are required' });
    }
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: 'End date must be on or after the start date' });
    }
    if (bookingType && !VALID_TYPES.includes(bookingType)) {
      return res.status(400).json({ error: `bookingType must be one of: ${VALID_TYPES.join(', ')}` });
    }

    const booking = await Booking.create({
      userId: req.user.id,
      startDate,
      endDate,
      purpose,
      bookingType: bookingType || 'standard',
    });
    res.status(201).json({ booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit booking request' });
  }
});

// GET /api/bookings/mine — the logged-in user's own booking requests
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.findByUser(req.user.id);
    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /api/bookings — admin only, view all booking requests
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const bookings = await Booking.findAll();
    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// PATCH /api/bookings/:id — admin only, approve/deny a booking
router.patch('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['pending', 'approved', 'denied'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'pending', 'approved' or 'denied'" });
    }
    const booking = await Booking.updateStatus(req.params.id, status, adminNotes);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({ booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

module.exports = router;
