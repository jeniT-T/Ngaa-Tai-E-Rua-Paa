const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const Booking = require('../models/Booking');

const router = express.Router();

router.use(requireAuth, requireRole('member', 'admin'));

function isValidDateTime(value) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function parseLocalDateTime(value) {
  if (!value) return null;
  const normalized = String(value).replace(' ', 'T');
  const [datePart, timePart] = normalized.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second = 0] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, second);
}

function formatLocalTimestamp(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.listAll();
    const filteredBookings = bookings.map((booking) => ({
      id: booking.id,
      user_id: booking.user_id,
      user_name: booking.user_name,
      start_datetime: booking.start_datetime,
      end_datetime: booking.end_datetime,
      booking_type: booking.booking_type,
      status: booking.status,
      created_at: booking.created_at,
      purpose: req.user.role === 'admin' ? booking.purpose : undefined,
    }));
    res.json({ bookings: filteredBookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { startDateTime, endDateTime, purpose, bookingType } = req.body;

    if (!startDateTime || !endDateTime || !purpose) {
      return res.status(400).json({ error: 'Start time, end time and purpose are required' });
    }

    if (!isValidDateTime(startDateTime) || !isValidDateTime(endDateTime)) {
      return res.status(400).json({ error: 'Start time and end time must be valid date/time values' });
    }

    const start = parseLocalDateTime(startDateTime);
    const end = parseLocalDateTime(endDateTime);

    if (!start || !end || end <= start) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const overlaps = await Booking.findOverlap(formatLocalTimestamp(start), formatLocalTimestamp(end));
    if (overlaps) {
      return res.status(409).json({ error: 'This time slot is already booked' });
    }

    const booking = await Booking.create({
      userId: req.user.id,
      startDateTime: formatLocalTimestamp(start),
      endDateTime: formatLocalTimestamp(end),
      purpose,
      bookingType: bookingType || 'standard',
      status: 'pending',
    });

    const responseBooking = {
      id: booking.id,
      user_id: booking.user_id,
      user_name: booking.user_name,
      start_datetime: booking.start_datetime,
      end_datetime: booking.end_datetime,
      booking_type: booking.booking_type,
      status: booking.status,
      created_at: booking.created_at,
      purpose: req.user.role === 'admin' ? booking.purpose : undefined,
    };

    res.status(201).json({ booking: responseBooking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Admin can remove a denied request or delete an approved booking entirely.
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.getById(id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only cancel your own booking' });
    }

    const deleted = await Booking.remove(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ success: true, deletedBookingId: id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// Admin can approve, deny, or reschedule a booking through one PATCH endpoint.
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.getById(id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own booking' });
    }

    const { status, startDateTime, endDateTime, purpose } = req.body;
    const updates = {};

    if (status && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can change booking status' });
    }

    if (status && ['pending', 'approved', 'denied'].includes(status)) {
      updates.status = status;
    }

    if (startDateTime || endDateTime) {
      if (!startDateTime || !endDateTime) {
        return res.status(400).json({ error: 'Both start time and end time are required when editing a booking' });
      }

      if (!isValidDateTime(startDateTime) || !isValidDateTime(endDateTime)) {
        return res.status(400).json({ error: 'Start time and end time must be valid date/time values' });
      }

      const start = parseLocalDateTime(startDateTime);
      const end = parseLocalDateTime(endDateTime);
      if (!start || !end || end <= start) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }

      const overlaps = await Booking.findOverlap(formatLocalTimestamp(start), formatLocalTimestamp(end), id);
      if (overlaps) {
        return res.status(409).json({ error: 'This time slot is already booked' });
      }

      updates.startDateTime = formatLocalTimestamp(start);
      updates.endDateTime = formatLocalTimestamp(end);
    }

    if (purpose !== undefined) {
      updates.purpose = purpose;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No changes supplied' });
    }

    const updatedBooking = await Booking.update(id, updates);
    if (!updatedBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ booking: { ...updatedBooking, purpose: req.user.role === 'admin' ? updatedBooking.purpose : undefined } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

module.exports = router;
