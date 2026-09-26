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
  if (!requester) return; 

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

router.post('/', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, purpose, bookingType, whakapapa, area } = req.body;

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

    const booking = await Booking.create({
      userId: req.user.id,
      startDate,
      endDate,
      purpose,
      bookingType: bookingType || 'standard',
      whakapapa,
      area: area || 'general',
    });

    notifyRequester(booking, {
      subject: 'Booking request received',
      intro: "We've received your booking request. We'll email you once it's been reviewed.",
    }).catch(() => {}); 

    res.status(201).json({ booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit booking request' });
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
