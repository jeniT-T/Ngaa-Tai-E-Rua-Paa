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

router.get('/', requireAuth, requireRole('manager'), async (req, res) => {
  try {
    const issues = await Issue.findAll();
    res.json({ issues });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

router.patch('/:id', requireAuth, requireRole('manager'), async (req, res) => {
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