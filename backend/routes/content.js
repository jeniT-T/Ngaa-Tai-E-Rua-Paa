// backend/routes/content.js
const express = require('express');
const ContentItem = require('../models/ContentItem');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

const PUBLIC_PAGES = [
  'home',
  'history',
  'facilities',
  'events',
  'contacts',
  'health-and-safety',
  'map',
  'arrival',
  'arrival-gas',
  'arrival-wifi',
  'arrival-emergency',
  'arrival-accessibility',
  'arrival-rules',
];
const BLOCK_TYPES = ['heading', 'section'];

// Ported from the teammate's arrival-items branch: accepts watch?v=, youtu.be/,
// and /embed/ URL forms. videoUrl is optional on any content item — most
// useful for arrival-guide sections, but not restricted to them.
function isValidYoutubeUrl(url) {
  if (!url) return true; // optional field
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)/.test(url);
}

// GET /api/content/public/:page — no auth. Powers every public/marae-info
// page (home/history/facilities/events/contacts/health-and-safety/map/
// arrival guide + subpages). Admins choose a page as an item's "placement"
// in the CMS and it shows up here automatically. Note: the arrival guide
// pages are reachable here without auth even though the page itself is
// booking-gated in the frontend — same tradeoff already made for every
// other public-page fetch, and none of this content is sensitive.
router.get('/public/:page', async (req, res) => {
  try {
    const { page } = req.params;
    if (!PUBLIC_PAGES.includes(page)) {
      return res.status(400).json({ error: `page must be one of: ${PUBLIC_PAGES.join(', ')}` });
    }
    const items = await ContentItem.findByPlacement(page);
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch page content' });
  }
});

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
    const { title, body, category, visibleToRoles, placement, blockType, videoUrl } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }
    if (visibleToRoles && (!Array.isArray(visibleToRoles) || visibleToRoles.length === 0)) {
      return res.status(400).json({ error: 'visibleToRoles must be a non-empty array' });
    }
    if (placement && !PUBLIC_PAGES.includes(placement)) {
      return res.status(400).json({ error: `placement must be one of: ${PUBLIC_PAGES.join(', ')}` });
    }
    if (blockType && !BLOCK_TYPES.includes(blockType)) {
      return res.status(400).json({ error: `blockType must be one of: ${BLOCK_TYPES.join(', ')}` });
    }
    if (!isValidYoutubeUrl(videoUrl)) {
      return res.status(400).json({ error: 'videoUrl must be a valid YouTube link' });
    }

    const item = await ContentItem.create({
      title,
      body,
      category,
      visibleToRoles,
      createdBy: req.user.id,
      placement: placement || null,
      blockType,
      videoUrl: videoUrl || null,
    });
    res.status(201).json({ item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create content' });
  }
});

router.patch('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { title, body, category, visibleToRoles, placement, blockType, videoUrl } = req.body;

    if (visibleToRoles && (!Array.isArray(visibleToRoles) || visibleToRoles.length === 0)) {
      return res.status(400).json({ error: 'visibleToRoles must be a non-empty array' });
    }
    if (placement && !PUBLIC_PAGES.includes(placement)) {
      return res.status(400).json({ error: `placement must be one of: ${PUBLIC_PAGES.join(', ')}` });
    }
    if (blockType && !BLOCK_TYPES.includes(blockType)) {
      return res.status(400).json({ error: `blockType must be one of: ${BLOCK_TYPES.join(', ')}` });
    }
    if (!isValidYoutubeUrl(videoUrl)) {
      return res.status(400).json({ error: 'videoUrl must be a valid YouTube link' });
    }

    const item = await ContentItem.update(req.params.id, {
      title,
      body,
      category,
      visibleToRoles,
      placement: placement || null,
      blockType,
      videoUrl: videoUrl || null,
    });
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