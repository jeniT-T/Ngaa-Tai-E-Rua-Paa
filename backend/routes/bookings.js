// backend/routes/bookings.js
const express = require('express');
const Booking = require('../models/Booking');
const User = require('../models/User');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const { sendEmail } = require('../utils/mailer');

const router = express.Router();

const VALID_TYPES = ['standard', 'event', 'tangihanga'];

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-NZ', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function notifyRequester(booking, { subject, intro }) {
  const requester = await User.findById(booking.user_id);
  if (!requester) return; // shouldn't happen, but don't let a missing user break the flow

  const details = `Dates: ${formatDate(booking.start_date)} – ${formatDate(booking.end_date)}\nType: ${booking.booking_type}\nPurpose: ${booking.purpose}`;
  const notes = booking.admin_notes ? `\n\nNote from the marae: ${booking.admin_notes}` : '';

  await sendEmail({
    to: requester.email,
    subject,
    text: `${intro}\n\n${details}${notes}`,
    html: `<p>${intro}</p><p>${details.replace(/\n/g, '<br>')}</p>${
      booking.admin_notes ? `<p><em>Note from the marae: ${booking.admin_notes}</em></p>` : ''
    }`,
  });
}

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

    notifyRequester(booking, {
      subject: 'Booking request received',
      intro: "We've received your booking request. We'll email you once it's been reviewed.",
    }).catch(() => {}); // fire-and-forget, don't block the response on email

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

// PATCH /api/bookings/:id/status — admin only, approve/deny a booking
router.patch('/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['pending', 'approved', 'denied'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'pending', 'approved' or 'denied'" });
    }
    const booking = await Booking.updateStatus(req.params.id, status, adminNotes);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (status === 'approved' || status === 'denied') {
      notifyRequester(booking, {
        subject: status === 'approved' ? 'Your booking has been approved' : 'Your booking has been declined',
        intro:
          status === 'approved'
            ? 'Good news — your booking request has been approved.'
            : 'Your booking request has been declined.',
      }).catch(() => {});
    }

    res.json({ booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// PATCH /api/bookings/:id — the requester edits their own booking (dates,
// purpose, type). This resets it to 'pending' so the admin reviews the
// updated details — effectively a "re-request".
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await Booking.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own bookings' });
    }
    if (existing.status === 'cancelled') {
      return res.status(400).json({ error: 'This booking has been cancelled and can no longer be edited' });
    }

    const { startDate, endDate, purpose, bookingType } = req.body;
    if (bookingType && !VALID_TYPES.includes(bookingType)) {
      return res.status(400).json({ error: `bookingType must be one of: ${VALID_TYPES.join(', ')}` });
    }
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: 'End date must be on or after the start date' });
    }

    const booking = await Booking.update(req.params.id, { startDate, endDate, purpose, bookingType });
    res.json({ booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// PATCH /api/bookings/:id/cancel — the requester (or an admin) cancels a booking
router.patch('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const existing = await Booking.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only cancel your own bookings' });
    }

    const booking = await Booking.cancel(req.params.id);
    res.json({ booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

module.exports = router;
