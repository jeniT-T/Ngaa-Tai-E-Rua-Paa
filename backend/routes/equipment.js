// backend/routes/equipment.js
//
// Equipment inventory (S36). Caretaker and admin manage the list;
// manager gets read-only access (same access shape as the caretaker
// calendar — see caretakerTasks.js — but writes stay caretaker/admin only
// here, since this is the caretaker's own inventory to maintain).
const express = require('express');
const Equipment = require('../models/Equipment');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.use(requireAuth);

router.get('/', requireRole('caretaker', 'manager', 'admin'), async (req, res) => {
  try {
    const items = await Equipment.findAll();
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

router.post('/', requireRole('caretaker', 'admin'), async (req, res) => {
  try {
    const { name, condition } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const item = await Equipment.create({ name, condition, createdBy: req.user.id });
    res.status(201).json({ item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create equipment item' });
  }
});

router.patch('/:id', requireRole('caretaker', 'admin'), async (req, res) => {
  try {
    const item = await Equipment.update(req.params.id, req.body);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update equipment item' });
  }
});

router.delete('/:id', requireRole('caretaker', 'admin'), async (req, res) => {
  try {
    await Equipment.delete(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete equipment item' });
  }
});

module.exports = router;
