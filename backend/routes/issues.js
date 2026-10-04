const express = require('express');
const Issue = require('../models/Issue');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }
    const issue = await Issue.create({ userId: req.user.id, subject, message });
    res.status(201).json({ issue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit issue' });
  }
});

// Caretaker can see and update these too (not just manager) — they're the
// one who'd actually know about or fix most reported issues, so they need
// to be aware of what's been reported, same as manager. Admin is included
// too: the frontend route /caretaker/issues (and the caretaker dashboard
// card linking to it) already allows admin as well as caretaker — without
// 'admin' here, an admin visiting that page got a 403 ("Forbidden:
// insufficient permissions") with the issues list silently falling back to
// its "No issues reported." empty state, which is confusing rather than a
// clear error. Keeping the backend's allowed roles matching whatever the
// frontend route already allows avoids this class of bug.
router.get('/', requireAuth, requireRole('manager', 'caretaker', 'admin'), async (req, res) => {
  try {
    const issues = await Issue.findAll();
    res.json({ issues });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

router.patch('/:id', requireAuth, requireRole('manager', 'caretaker', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'open', 'in_progress' or 'resolved'" });
    }
    const issue = await Issue.updateStatus(req.params.id, status);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json({ issue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update issue' });
  }
});

module.exports = router;