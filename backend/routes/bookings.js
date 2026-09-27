// backend/routes/bookings.js
const express = require('express');
const Booking = require('../models/Booking');
const User = require('../models/User');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const { sendEmail } = require('../utils/mailer');

const router = express.Router();

const VALID_TYPES = ['standard', 'event', 'tangihanga'];
const VALID_AREAS = ['general', 'paa'];

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-NZ', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function notifyRequester(booking, { subject, intro }) {
  const requester = await User.findById(booking.user_id);
  if (!requester) return; // shouldn't happen, but don't let a missing user break the flow

  const areaLabel = booking.area === 'paa' ? 'Entire Paa' : 'General area';
  const details = `Dates: ${formatDate(booking.start_date)} – ${formatDate(booking.end_date)}\nArea: ${areaLabel}\nType: ${booking.booking_type}\nPurpose: ${booking.purpose}`;
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

// POST /api/bookings — any logged-in user can request a booking for
// themselves; a manager can additionally pass `userId` to book on behalf of
// a customer's account, and `status` to mark it approved immediately.
router.post('/', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, purpose, bookingType, whakapapa, area, userId, status } = req.body;
    const isManager = req.user.role === 'manager';

    if (!startDate || !endDate || !purpose) {
      return res.status(400).json({ error: 'Start date, end date and purpose are required' });
    }
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: 'End date must be on or after the start date' });
    }
    if (bookingType && !VALID_TYPES.includes(bookingType)) {
      return res.status(400).json({ error: `bookingType must be one of: ${VALID_TYPES.join(', ')}` });
    }
    if (typeof whakapapa !== 'boolean') {
      return res.status(400).json({ error: 'Please answer whether you whakapapa to the Paa' });
    }
    if (area && !VALID_AREAS.includes(area)) {
      return res.status(400).json({ error: `area must be one of: ${VALID_AREAS.join(', ')}` });
    }

    // A regular member can only ever book for themselves. A manager may
    // book on behalf of a customer's account (someone who rang up or asked
    // in person) by passing that customer's userId — everything else about
    // the booking works exactly the same either way (same table, same
    // approval flow, same emails), it's just whose account it's filed under.
    let bookingUserId = req.user.id;
    if (isManager && userId) {
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(400).json({ error: 'That customer account could not be found' });
      }
      bookingUserId = targetUser.id;
    }

    // Only a manager can set the status directly — a manager taking a
    // booking over the phone already knows it's confirmed, so they can mark
    // it approved immediately instead of it sitting in the pending queue
    // waiting for... the same manager to approve it. Anyone else's request
    // always starts 'pending', same as before.
    let bookingStatus = 'pending';
    if (isManager && status) {
      if (!['pending', 'approved'].includes(status)) {
        return res.status(400).json({ error: "status must be 'pending' or 'approved'" });
      }
      bookingStatus = status;
    }

    const booking = await Booking.create({
      userId: bookingUserId,
      startDate,
      endDate,
      purpose,
      bookingType: bookingType || 'standard',
      whakapapa,
      area: area || 'general',
      status: bookingStatus,
    });

    notifyRequester(booking, {
      subject: bookingStatus === 'approved' ? 'Your booking has been confirmed' : 'Booking request received',
      intro:
        bookingStatus === 'approved'
          ? 'Your booking has been confirmed.'
          : "We've received your booking request. We'll email you once it's been reviewed.",
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

// GET /api/bookings/availability — any logged-in user, the date ranges that
// are already spoken for so the frontend can gray them out on a calendar.
// ?excludeId=123 lets a booker editing their own booking see the calendar
// without their own current dates showing up as blocked.
router.get('/availability', requireAuth, async (req, res) => {
  try {
    const excludeId = req.query.excludeId ? Number(req.query.excludeId) : undefined;
    const ranges = await Booking.findActiveRanges(excludeId);
    res.json({
      ranges: ranges.map((r) => ({
        id: r.id,
        startDate: r.start_date,
        endDate: r.end_date,
        status: r.status,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// GET /api/bookings/guest/:token — no auth. The "share this booking" link/QR
// code a guest without their own account uses. Deliberately returns only
// what's needed to gate the arrival guide (dates/status/purpose) — never the
// account holder's name, email or user id. Placed before the manager-only
// routes below since this one is meant for anyone with the link.
router.get('/guest/:token', async (req, res) => {
  try {
    const booking = await Booking.findByGuestToken(req.params.token);
    if (!booking) {
      return res.status(404).json({ error: 'This link is invalid.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(booking.end_date);
    const active = booking.status === 'approved' && endDate >= today;

    res.json({
      booking: {
        startDate: booking.start_date,
        endDate: booking.end_date,
        status: booking.status,
        area: booking.area,
        bookingType: booking.booking_type,
        purpose: booking.purpose,
      },
      active,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to look up this link' });
  }
});

// GET /api/bookings — manager only, view all booking requests
router.get('/', requireAuth, requireRole('manager'), async (req, res) => {
  try {
    const bookings = await Booking.findAll();
    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// PATCH /api/bookings/:id/status — manager only, approve/deny a booking
router.patch('/:id/status', requireAuth, requireRole('manager'), async (req, res) => {
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

    const { startDate, endDate, purpose, bookingType, whakapapa, area } = req.body;
    if (bookingType && !VALID_TYPES.includes(bookingType)) {
      return res.status(400).json({ error: `bookingType must be one of: ${VALID_TYPES.join(', ')}` });
    }
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: 'End date must be on or after the start date' });
    }
    if (whakapapa !== undefined && typeof whakapapa !== 'boolean') {
      return res.status(400).json({ error: 'whakapapa must be true or false' });
    }
    if (area && !VALID_AREAS.includes(area)) {
      return res.status(400).json({ error: `area must be one of: ${VALID_AREAS.join(', ')}` });
    }

    const booking = await Booking.update(req.params.id, { startDate, endDate, purpose, bookingType, whakapapa, area });
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
    if (existing.user_id !== req.user.id && req.user.role !== 'manager') {
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
