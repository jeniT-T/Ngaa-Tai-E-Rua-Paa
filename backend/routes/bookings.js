// backend/routes/bookings.js
const express = require('express');
const Booking = require('../models/Booking');
const User = require('../models/User');
const BookingReview = require('../models/BookingReview');
const SiteSettings = require('../models/SiteSettings');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const { sendEmail } = require('../utils/mailer');

const router = express.Router();

// A booking only becomes reviewable (by either side) once it's actually
// over — no point rating a guest's stay, or asking a guest how their stay
// went, while it's still pending or still happening.
function isBookingComplete(booking) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return booking.status === 'approved' && new Date(booking.end_date) < today;
}

function isValidRating(rating) {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

// The set of valid booking_type/area values is admin-configurable (see
// SiteSettings / the new Site Settings page) rather than fixed here — these
// helpers read the CURRENT settings row on each call rather than caching a
// list at startup, so a change takes effect immediately with no restart.
async function getValidBookingValues() {
  const settings = await SiteSettings.get();
  return {
    types: (settings?.booking_types || []).map((t) => t.value),
    areas: (settings?.booking_areas || []).map((a) => a.value),
  };
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-NZ', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function notifyRequester(booking, { subject, intro }) {
  const requester = await User.findById(booking.user_id);
  if (!requester) return; // shouldn't happen, but don't let a missing user break the flow

  const settings = await SiteSettings.get();
  const areaOption = (settings?.booking_areas || []).find((a) => a.value === booking.area);
  const areaLabel = areaOption ? areaOption.label : booking.area;
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
    const { types: validTypes, areas: validAreas } = await getValidBookingValues();
    if (bookingType && !validTypes.includes(bookingType)) {
      return res.status(400).json({ error: `bookingType must be one of: ${validTypes.join(', ')}` });
    }
    // The "whakapapa" question itself can be switched off per marae (Site
    // Settings) — when it is, the frontend never asks it and always sends
    // `false`, so this still arrives as a boolean either way.
    if (typeof whakapapa !== 'boolean') {
      return res.status(400).json({ error: 'Please answer whether you whakapapa to the Paa' });
    }
    if (area && !validAreas.includes(area)) {
      return res.status(400).json({ error: `area must be one of: ${validAreas.join(', ')}` });
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

// GET /api/bookings/calendar — caretaker/manager/admin only. Approved
// bookings with enough detail to show on the caretaker's task
// calendar/schedule (see frontend/src/hooks/useActiveBookingsForCalendar.js),
// so staff can see when the marae itself is booked, not just each other's
// tasks. Deliberately narrower than GET / (manager-only, full booking
// management) — this never exposes who booked it, just that it's booked.
router.get('/calendar', requireAuth, requireRole('caretaker', 'manager', 'admin'), async (req, res) => {
  try {
    const bookings = await Booking.findApprovedForCalendar();
    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings for calendar' });
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

// GET /api/bookings/guest-active — no auth, no token. Backs a generic,
// non-booking-specific QR code the client can post physically around the
// marae itself (as opposed to the per-booking link/QR above, which is
// personal to one booking and shared digitally) -- see §24. Deliberately
// the narrowest possible check: true only when an approved booking's date
// range covers *today* specifically, so this only ever works while someone
// is actually in residence -- not before arrival or after departure, unlike
// the per-booking link above (which stays "active" from approval through
// to end-of-stay). Returns nothing about who's booked, or why.
router.get('/guest-active', async (req, res) => {
  try {
    const booking = await Booking.findCurrentlyOnSite();
    res.json({ active: !!booking, endDate: booking ? booking.end_date : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check guest access' });
  }
});

// GET /api/bookings — manager only, view all booking requests
// Permanent deletion is restricted to managers.
router.delete('/:id', requireAuth, requireRole('manager'), async (req, res) => {
  try {
    if (!/^[1-9]\d*$/.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    const deleted = await Booking.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

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
    const { types: validTypes, areas: validAreas } = await getValidBookingValues();
    if (bookingType && !validTypes.includes(bookingType)) {
      return res.status(400).json({ error: `bookingType must be one of: ${validTypes.join(', ')}` });
    }
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: 'End date must be on or after the start date' });
    }
    if (whakapapa !== undefined && typeof whakapapa !== 'boolean') {
      return res.status(400).json({ error: 'whakapapa must be true or false' });
    }
    if (area && !validAreas.includes(area)) {
      return res.status(400).json({ error: `area must be one of: ${validAreas.join(', ')}` });
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

// GET /api/bookings/:id/review — manager only. Returns the full review row
// (both the manager's private rating/notes about the guest AND the guest's
// own rating/notes about the marae) — the manager is allowed to see both
// sides, only the guest's own half is kept from the guest. See GET
// /:id/guest-review below for that boundary.
router.get('/:id/review', requireAuth, requireRole('manager'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    const review = await BookingReview.findByBooking(req.params.id);
    res.json({ review, complete: isBookingComplete(booking) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// PUT /api/bookings/:id/manager-review — manager only, { rating, notes }.
// The manager's private assessment of the guest — never returned to the
// guest by any route.
router.put('/:id/manager-review', requireAuth, requireRole('manager'), async (req, res) => {
  try {
    const { rating, notes } = req.body;
    if (!isValidRating(rating)) {
      return res.status(400).json({ error: 'rating must be a whole number from 1 to 5' });
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (!isBookingComplete(booking)) {
      return res.status(400).json({ error: 'You can only review a guest once their booking is complete' });
    }
    const review = await BookingReview.upsertManagerReview(req.params.id, {
      rating,
      notes,
      reviewedBy: req.user.id,
    });
    res.json({ review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save review' });
  }
});

// GET /api/bookings/:id/guest-review — the booking's own owner (or a
// manager). Deliberately selects only the guest_* columns, never
// manager_rating/manager_notes/manager_reviewed_by — a guest requesting
// their own booking's review must never see what the manager wrote about
// them.
router.get('/:id/guest-review', requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.user_id !== req.user.id && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Not authorized to view this review' });
    }
    const review = await BookingReview.findByBooking(req.params.id);
    res.json({
      review: review
        ? { rating: review.guest_rating, notes: review.guest_notes, reviewedAt: review.guest_reviewed_at }
        : null,
      complete: isBookingComplete(booking),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// PUT /api/bookings/:id/guest-review — the booking's own owner only,
// { rating, notes }. The guest's own review of their stay at the marae.
router.put('/:id/guest-review', requireAuth, async (req, res) => {
  try {
    const { rating, notes } = req.body;
    if (!isValidRating(rating)) {
      return res.status(400).json({ error: 'rating must be a whole number from 1 to 5' });
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only review your own bookings' });
    }
    if (!isBookingComplete(booking)) {
      return res.status(400).json({ error: 'You can only leave a review once your stay is complete' });
    }
    const review = await BookingReview.upsertGuestReview(req.params.id, { rating, notes });
    res.json({
      review: { rating: review.guest_rating, notes: review.guest_notes, reviewedAt: review.guest_reviewed_at },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save review' });
  }
});

module.exports = router;
