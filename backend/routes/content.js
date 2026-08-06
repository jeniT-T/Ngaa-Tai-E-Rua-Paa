// backend/routes/content.js
const express = require('express');
const ContentItem = require('../models/ContentItem');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// GET /api/content/library?search=&category=
// Marae-user-facing: only content visible to the logged-in user's own role.
// Role comes from req.user (server-verified), never trusted from the client.
router.get('/library', requireAuth, async (req, res) => {
  try {
    const { search, category } = req.query;
    const items = await ContentItem.findVisibleToRole(req.user.role, { search, category });
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// GET /api/content/categories
// Used to build the category tabs/grouping in the library UI
router.get('/categories', requireAuth, async (req, res) => {
  try {
    const categories = await ContentItem.findDistinctCategories();
    res.json({ categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// --- Admin content management (Iteration 4) ---

router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const items = await ContentItem.findAll();
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { title, body, category, visibleToRoles } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }
    if (visibleToRoles && (!Array.isArray(visibleToRoles) || visibleToRoles.length === 0)) {
      return res.status(400).json({ error: 'visibleToRoles must be a non-empty array' });
    }

    const item = await ContentItem.create({
      title,
      body,
      category,
      visibleToRoles,
      createdBy: req.user.id,
    });
    res.status(201).json({ item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create content' });
  }
});

router.patch('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { title, body, category, visibleToRoles } = req.body;

    if (visibleToRoles && (!Array.isArray(visibleToRoles) || visibleToRoles.length === 0)) {
      return res.status(400).json({ error: 'visibleToRoles must be a non-empty array' });
    }

    const item = await ContentItem.update(req.params.id, { title, body, category, visibleToRoles });
    if (!item) {
      return res.status(404).json({ error: 'Content item not found' });
    }
    res.json({ item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

// PATCH /api/content/:id/move  { category }
router.patch('/:id/move', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) {
      return res.status(400).json({ error: 'category is required' });
    }
    const item = await ContentItem.move(req.params.id, category);
    if (!item) {
      return res.status(404).json({ error: 'Content item not found' });
    }
    res.json({ item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to move content' });
  }
});

// POST /api/content/:id/copy  { category? }
router.post('/:id/copy', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { category } = req.body;
    const item = await ContentItem.copy(req.params.id, { category });
    if (!item) {
      return res.status(404).json({ error: 'Content item not found' });
    }
    res.status(201).json({ item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to copy content' });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await ContentItem.delete(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

module.exports = router;