
const express = require('express');
const Checklist = require('../models/Checklist');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.use(requireAuth, requireRole('caretaker', 'admin'));

router.get('/', async (req, res) => {
  try {
    const checklists = await Checklist.findAll();
    res.json({ checklists });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch checklists' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, items } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const id = await Checklist.create({
      title: title.trim(),
      description,
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
    const { title, description } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const existing = await Checklist.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    await Checklist.update(req.params.id, { title: title.trim(), description });
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
