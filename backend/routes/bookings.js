const express = require('express');
const Booking = require('../models/Booking');
const User = require('../models/User');
const BookingReview = require('../models/BookingReview');
const SiteSettings = require('../models/SiteSettings');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const { sendEmail } = require('../utils/mailer');

const router = express.Router();

function isBookingComplete(booking) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return booking.status === 'approved' && new Date(booking.end_date) < today;
}

function isValidRating(rating) {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

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

function dateOnly(value) {
  if (typeof value === 'string') return value.slice(0, 10);
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const CONFLICT_MESSAGE =
  'These dates overlap with an approved booking. Resend with overrideConflicts: true to approve anyway.';

async function notifyRequester(booking, { subject, intro }) {
  const requester = await User.findById(booking.user_id);
  if (!requester) return; 

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
    
    if (typeof whakapapa !== 'boolean') {
      return res.status(400).json({ error: 'Please answer whether you whakapapa to the Paa' });
    }
    if (area && !validAreas.includes(area)) {
      return res.status(400).json({ error: `area must be one of: ${validAreas.join(', ')}` });
    }

    let bookingUserId = req.user.id;
    if (isManager && userId) {
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(400).json({ error: 'That customer account could not be found' });
      }
      bookingUserId = targetUser.id;
    }

    
    let bookingStatus = 'pending';
    if (isManager && status) {
      if (!['pending', 'approved'].includes(status)) {
        return res.status(400).json({ error: "status must be 'pending' or 'approved'" });
      }
      bookingStatus = status;
    }

    
    if (bookingStatus === 'approved' && req.body.overrideConflicts !== true) {
      const conflicts = await Booking.findConflicts({
        startDate: dateOnly(startDate),
        endDate: dateOnly(endDate),
        area: area || 'general',
      });
      if (conflicts.length > 0) {
        return res.status(409).json({ error: CONFLICT_MESSAGE, conflicts });
      }
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
    }).catch(() => {}); 

    res.status(201).json({ booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit booking request' });
  }
});

router.get('/conflicts', requireAuth, requireRole('manager'), async (req, res) => {
  try {
    const { startDate, endDate, area, excludeId } = req.query;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate || '') || !/^\d{4}-\d{2}-\d{2}$/.test(endDate || '') ||
        !Number.isFinite(Date.parse(startDate)) || !Number.isFinite(Date.parse(endDate)) || endDate < startDate ||
        (excludeId !== undefined && !/^[1-9]\d*$/.test(excludeId))) {
      return res.status(400).json({ error: 'Choose valid booking dates' });
    }
    const { areas } = await getValidBookingValues();
    if (!areas.includes(area)) return res.status(400).json({ error: 'Choose a valid booking area' });
    const conflicts = await Booking.findConflicts({ startDate, endDate, area, excludeId: excludeId || null });
    res.json({ conflicts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check booking conflicts' });
  }
});

router.get('/mine', requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.findByUser(req.user.id);
    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

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

router.get('/calendar', requireAuth, requireRole('caretaker', 'manager', 'admin'), async (req, res) => {
  try {
    const bookings = await Booking.findApprovedForCalendar();
    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings for calendar' });
  }
});

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

router.get('/guest-active', async (req, res) => {
  try {
    const booking = await Booking.findCurrentlyOnSite();
    res.json({ active: !!booking, endDate: booking ? booking.end_date : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check guest access' });
  }
});

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

router.patch('/:id/status', requireAuth, requireRole('manager'), async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['pending', 'approved', 'denied'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'pending', 'approved' or 'denied'" });
    }

  
    if (status === 'approved' && req.body.overrideConflicts !== true) {
      const existing = await Booking.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      const conflicts = await Booking.findConflicts({
        startDate: dateOnly(existing.start_date),
        endDate: dateOnly(existing.end_date),
        area: existing.area,
        excludeId: existing.id,
      });
      if (conflicts.length > 0) {
        return res.status(409).json({ error: CONFLICT_MESSAGE, conflicts });
      }
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
