// backend/routes/caretakerTasks.js
//
// Backend for the caretaker's task calendar/schedule, shared between
// caretaker and manager (there's only one caretaker, and manager needs the
// same view — see database/migration_caretaker_tasks.sql). Admin is
// included too since it already had route-level access to the
// calendar/schedule pages themselves (App.jsx's RoleRoute).
const express = require('express');
const CaretakerTask = require('../models/CaretakerTask');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.use(requireAuth, requireRole('caretaker', 'manager', 'admin'));

router.get('/', async (req, res) => {
  try {
    const tasks = await CaretakerTask.findAll();
    res.json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, date, startTime, endTime, urgency, notes } = req.body;
    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }
    const task = await CaretakerTask.create({
      title,
      date,
      startTime,
      endTime,
      urgency,
      notes,
      createdBy: req.user.id,
    });
    res.status(201).json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const task = await CaretakerTask.update(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.patch('/:id/complete', async (req, res) => {
  try {
    const task = await CaretakerTask.setCompleted(req.params.id, true);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await CaretakerTask.delete(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
