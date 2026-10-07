// backend/routes/checklists.js
//
// Caretaker-authored checklists. Caretakers know the job, so they create
// and maintain these themselves rather than admin/manager writing them —
// admin keeps read/write access too since everything else caretaker-facing
// (calendar, schedule) is already reachable by admin (see App.jsx).
//
// A member can also *view* (read-only) these once they have an approved,
// still-current booking — same rule as Marae Guide access, see
// useArrivalAccess.js on the frontend and ArrivalAccessGate.jsx, which gates
// the read-only /checklists route this powers. They can't create, edit or
// delete anything — only the GET below is opened up to them.
const express = require('express');
const Checklist = require('../models/Checklist');
const ContentItem = require('../models/ContentItem');
const Booking = require('../models/Booking');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

const CHECKLIST_ROLES = ['member', 'caretaker', 'manager', 'admin'];

function hasValidAssignedRoles(roles) {
  return Array.isArray(roles) &&
    roles.length > 0 &&
    new Set(roles).size === roles.length &&
    roles.every((role) => CHECKLIST_ROLES.includes(role));
}

// GET /api/checklists/guest/:token and GET /api/checklists/guest -- no
// auth. Read-only, same checklist data a caretaker/admin/member with an
// active booking already sees (opening/closing procedures -- nothing
// sensitive about any particular person). These extend that same read-only
// access to an actual unauthenticated guest, backing the Marae Guide's
// guest-link flow (per-booking token, mirrors GET /api/bookings/guest/
// :token) and the generic physical-QR flow (mirrors GET /api/bookings/
// guest-active) -- see §24. Deliberately placed before `router.use
// (requireAuth)` below, since these two are meant to work for anyone with
// a valid link/QR, not just a logged-in user.
router.get('/guest/:token', async (req, res) => {
  try {
    const booking = await Booking.findByGuestToken(req.params.token);
    if (!booking) {
      return res.status(404).json({ error: 'This link is invalid.' });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const active = booking.status === 'approved' && new Date(booking.end_date) >= today;
    if (!active) {
      return res.status(403).json({ error: 'This link is no longer active.' });
    }
    const checklists = await Checklist.findAll(['member'], null, booking.id);
    res.json({ checklists });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch checklists' });
  }
});

router.get('/guest-active', async (req, res) => {
  try {
    const booking = await Booking.findCurrentlyOnSite();
    if (!booking) {
      return res.status(403).json({ error: 'Not currently available' });
    }
    const checklists = await Checklist.findAll(['member'], null, booking.id);
    res.json({ checklists });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch checklists' });
  }
});

router.use(requireAuth);

async function hasActiveApprovedBooking(userId) {
  const bookings = await Booking.findByUser(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return bookings.some((b) => b.status === 'approved' && new Date(b.end_date) >= today);
}

async function canView(req) {
  if (['caretaker', 'admin', 'manager'].includes(req.user.role)) return true;
  if (req.user.role !== 'member') return false;
  return hasActiveApprovedBooking(req.user.id);
}

router.get('/', async (req, res) => {
  try {
    if (!(await canView(req))) {
      return res.status(403).json({ error: 'Not authorized to view checklists' });
    }
    const roles = ['caretaker', 'admin'].includes(req.user.role) ? undefined : [req.user.role];
    const checklists = await Checklist.findAll(roles, req.user.role === 'member' ? req.user.id : null);
    res.json({ checklists });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch checklists' });
  }
});

router.get('/manage', requireRole('manager', 'caretaker', 'admin'), async (req, res) => {
  try {
    res.json({ checklists: await Checklist.findAll() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load checklists' });
  }
});

// Members record completion for their own approved bookings; staff can record any approved stay.
router.get('/completion-bookings', async (req, res) => {
  try { res.json({ bookings: await Checklist.completionBookings(req.user) }); }
  catch (err) { console.error(err); res.status(500).json({ error: 'Failed to load bookings' }); }
});

async function canRecordBooking(req, bookingId) {
  if (!/^[1-9]\d*$/.test(String(bookingId))) return false;
  const allowed = await Checklist.completionBookings(req.user);
  return allowed.some((booking) => Number(booking.id) === Number(bookingId));
}

router.get('/completions', async (req, res) => {
  try {
    if (!await canRecordBooking(req, req.query.bookingId)) return res.status(403).json({ error: 'You cannot access completion records for this booking' });
    res.json({ completions: await Checklist.completions(req.query.bookingId) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to load completion records' }); }
});

router.post('/:id/complete', async (req, res) => {
  try {
    const { bookingId, checkedItemIds } = req.body;
    if (!await canRecordBooking(req, bookingId)) return res.status(403).json({ error: 'Choose an approved booking you can access' });
    const checklist = await Checklist.getWithItems(req.params.id);
    if (!checklist) return res.status(404).json({ error: 'Checklist not found' });
    if (!['caretaker', 'admin'].includes(req.user.role) && !checklist.assigned_roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'This checklist is not assigned to your user type' });
    }
    if (checklist.booking_id && Number(checklist.booking_id) !== Number(bookingId)) {
      return res.status(400).json({ error: 'This checklist belongs to a different booking' });
    }
    if (!checklist.items.length || !Array.isArray(checkedItemIds) ||
        checkedItemIds.length !== checklist.items.length ||
        !checklist.items.every((item) => checkedItemIds.includes(item.id))) {
      return res.status(400).json({ error: 'Check every item before saving completion' });
    }
    const completion = await Checklist.complete({ bookingId, checklist, user: req.user });
    if (!completion) return res.status(409).json({ error: 'This checklist has already been completed for this booking' });
    res.status(201).json({ completion });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to save completion' }); }
});

// Staff edit only Cleaning & Checkout source steps, used by future approvals.
router.get('/default-template', requireRole('manager', 'caretaker', 'admin'), async (req, res) => {
  try {
    res.json({ checklist: await Checklist.defaultTemplate() });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to load default checklist' }); }
});

router.put('/default-template', requireRole('manager', 'caretaker', 'admin'), async (req, res) => {
  try {
    const { body } = req.body;
    if (typeof body !== 'string' || !body.trim()) return res.status(400).json({ error: 'Enter at least one checklist step' });
    res.json({ checklist: await Checklist.saveDefaultTemplate(body.trim()) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to save default checklist' }); }
});

router.patch('/default-template/:id', requireRole('manager', 'caretaker', 'admin'), async (req, res) => {
  try {
    const item = await ContentItem.findById(req.params.id);
    if (!item || item.placement !== 'arrival' || item.block_type !== 'section' || !['cleaning', 'Arrival Guide Cleaning & Checkout'].includes(item.category)) {
      return res.status(404).json({ error: 'Cleaning section not found' });
    }
    const { body } = req.body;
    if (typeof body !== 'string' || !body.trim()) return res.status(400).json({ error: 'Enter at least one cleaning step' });
    const updated = await ContentItem.update(item.id, {
      body: body.trim(), placement: item.placement, videoUrl: item.video_url, imageUrl: item.image_url,
    });
    res.json({ section: updated });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to save default checklist' }); }
});

// Everything from here on (creating, editing, deleting checklists and their
// items) stays caretaker/admin only — a member can look, not touch. This
// only applies to routes registered below it, so the GET / above (already
// handled and responded to by this point) is unaffected.
router.use(requireRole('caretaker', 'manager', 'admin'));

router.post('/', async (req, res) => {
  try {
    const { title, description, assignedRoles, items } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const roles = assignedRoles === undefined ? CHECKLIST_ROLES : assignedRoles;
    if (!hasValidAssignedRoles(roles)) {
      return res.status(400).json({ error: 'Choose one or more valid user types for this checklist' });
    }
    const id = await Checklist.create({
      title: title.trim(),
      description,
      assignedRoles: roles,
      createdBy: req.user.id,
      items: Array.isArray(items) ? items : [],
    });
    const checklist = await Checklist.getWithItems(id);
    res.status(201).json({ checklist });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create checklist' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { title, description, assignedRoles } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (assignedRoles !== undefined && !hasValidAssignedRoles(assignedRoles)) {
      return res.status(400).json({ error: 'Choose one or more valid user types for this checklist' });
    }
    const existing = await Checklist.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    await Checklist.update(req.params.id, {
      title: title.trim(),
      description,
      assignedRoles,
    });
    const checklist = await Checklist.getWithItems(req.params.id);
    res.json({ checklist });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update checklist' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Checklist.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete checklist' });
  }
});

router.post('/:id/items', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Item text is required' });
    }
    const existing = await Checklist.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    await Checklist.addItem(req.params.id, text);
    const checklist = await Checklist.getWithItems(req.params.id);
    res.status(201).json({ checklist });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

router.patch('/:id/items/:itemId', async (req, res) => {
  try {
    const belongs = await Checklist.itemBelongsToChecklist(req.params.itemId, req.params.id);
    if (!belongs) {
      return res.status(404).json({ error: 'Item not found on this checklist' });
    }
    const { text, is_done: isDone } = req.body;
    await Checklist.updateItem(req.params.itemId, {
      text: typeof text === 'string' ? text.trim() : undefined,
      isDone: typeof isDone === 'boolean' ? isDone : undefined,
    });
    const checklist = await Checklist.getWithItems(req.params.id);
    res.json({ checklist });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

router.delete('/:id/items/:itemId', async (req, res) => {
  try {
    const belongs = await Checklist.itemBelongsToChecklist(req.params.itemId, req.params.id);
    if (!belongs) {
      return res.status(404).json({ error: 'Item not found on this checklist' });
    }
    await Checklist.deleteItem(req.params.itemId);
    const checklist = await Checklist.getWithItems(req.params.id);
    res.json({ checklist });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;
