// backend/routes/content.js
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const ContentItem = require('../models/ContentItem');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// --- Image uploads for content items ---
//
// Stored on disk under backend/uploads/ (served statically by server.js at
// /uploads) rather than in the database — simplest option for a single-
// server dev/small-deployment setup like this one. If this ever needs to
// run across multiple backend instances or scale up, swap this for
// object storage (S3-compatible) and keep image_url as just a URL either
// way, so nothing above this layer has to change.
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB — generous for a photo, small enough to not fill the disk

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, WEBP or GIF images are allowed'));
    }
    cb(null, true);
  },
});

// POST /api/content/upload — admin or caretaker. Takes a single "image"
// field (multipart/form-data) and returns the path to reference it by
// elsewhere (as an item's imageUrl). Doesn't touch content_items itself —
// saving that path onto an item is a separate POST/PATCH, same as videoUrl,
// which is where the caretaker-tutorials-only restriction is enforced.
router.post('/upload', requireAuth, requireRole('admin', 'caretaker'), (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      const message = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
        ? 'Image is too large (max 8MB)'
        : err.message || 'Upload failed';
      return res.status(400).json({ error: message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

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
  'caretaker-tutorials',
];
// 'gallery' is a third block type — a plain photo in a page's image strip
// (no title/body rendered), used to convert the History page's and Health
// & Safety page's previously hardcoded images into admin-uploadable ones.
const BLOCK_TYPES = ['heading', 'section', 'gallery'];

// A caretaker is only ever allowed to touch content placed on their own
// tutorials page — everything else (the marketing pages, the arrival guide,
// library-only items) stays admin-only. Admin can touch anything, same as
// before this was added. Used on every write route below, checked against
// both an item's existing placement (before a change) and its incoming
// placement (after), so a caretaker can't use "move" to smuggle a tutorial
// out into some other page, or edit an unrelated admin item by guessing its id.
const CARETAKER_PLACEMENT = 'caretaker-tutorials';
function canWriteContent(user, placement) {
  if (user.role === 'admin') return true;
  if (user.role === 'caretaker') return placement === CARETAKER_PLACEMENT;
  return false;
}

// Ported from the teammate's arrival-items branch: accepts watch?v=, youtu.be/,
// and /embed/ URL forms. videoUrl is optional on any content item — most
// useful for arrival-guide sections, but not restricted to them.
function isValidYoutubeUrl(url) {
  if (!url) return true; // optional field
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)/.test(url);
}

// Tutorial authors manage all assignments; viewers receive only their own role.
router.get('/tutorials/manage', requireAuth, requireRole('admin', 'caretaker'), async (req, res) => {
  try {
    res.json({ items: await ContentItem.findByPlacement(CARETAKER_PLACEMENT) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tutorials' });
  }
});

router.get('/tutorials', requireAuth, async (req, res) => {
  try {
    res.json({ items: await ContentItem.findByPlacement(CARETAKER_PLACEMENT, req.user.role) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tutorials' });
  }
});

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
    const items = await ContentItem.findByPlacement(page, page === CARETAKER_PLACEMENT ? 'member' : null);
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

router.post('/', requireAuth, requireRole('admin', 'caretaker'), async (req, res) => {
  try {
    const { title, body, category, visibleToRoles, placement, blockType, videoUrl, imageUrl } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }
    if (visibleToRoles !== undefined && (!Array.isArray(visibleToRoles) || visibleToRoles.length === 0 || visibleToRoles.some((role) => !['member', 'caretaker', 'manager', 'admin'].includes(role)))) {
      return res.status(400).json({ error: 'Choose one or more valid user types' });
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
    if (!canWriteContent(req.user, placement || null)) {
      return res.status(403).json({ error: 'Caretakers can only create content on the tutorials page' });
    }

    const item = await ContentItem.create({
      title,
      body,
      category,
      visibleToRoles: visibleToRoles || (placement === CARETAKER_PLACEMENT ? ['member', 'caretaker', 'manager', 'admin'] : undefined),
      createdBy: req.user.id,
      placement: placement || null,
      blockType,
      videoUrl: videoUrl || null,
      imageUrl: imageUrl || null,
    });
    res.status(201).json({ item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create content' });
  }
});

router.patch('/:id', requireAuth, requireRole('admin', 'caretaker'), async (req, res) => {
  try {
    const { title, body, category, visibleToRoles, placement, blockType, videoUrl, imageUrl } = req.body;

    if (visibleToRoles !== undefined && (!Array.isArray(visibleToRoles) || visibleToRoles.length === 0 || visibleToRoles.some((role) => !['member', 'caretaker', 'manager', 'admin'].includes(role)))) {
      return res.status(400).json({ error: 'Choose one or more valid user types' });
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

    const existing = await ContentItem.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Content item not found' });
    }
    // Check both where the item currently is and where this update would
    // move it to — a caretaker can only ever touch their own tutorials.
    if (!canWriteContent(req.user, existing.placement) || !canWriteContent(req.user, placement || null)) {
      return res.status(403).json({ error: 'Caretakers can only manage content on the tutorials page' });
    }

    const item = await ContentItem.update(req.params.id, {
      title,
      body,
      category,
      visibleToRoles,
      placement: placement || null,
      blockType,
      videoUrl: videoUrl || null,
      imageUrl: imageUrl || null,
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
router.patch('/:id/move', requireAuth, requireRole('admin', 'caretaker'), async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) {
      return res.status(400).json({ error: 'category is required' });
    }
    const existing = await ContentItem.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Content item not found' });
    }
    if (!canWriteContent(req.user, existing.placement)) {
      return res.status(403).json({ error: 'Caretakers can only manage content on the tutorials page' });
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
router.post('/:id/copy', requireAuth, requireRole('admin', 'caretaker'), async (req, res) => {
  try {
    const { category } = req.body;
    const existing = await ContentItem.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Content item not found' });
    }
    if (!canWriteContent(req.user, existing.placement)) {
      return res.status(403).json({ error: 'Caretakers can only manage content on the tutorials page' });
    }
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

router.delete('/:id', requireAuth, requireRole('admin', 'caretaker'), async (req, res) => {
  try {
    const existing = await ContentItem.findById(req.params.id);
    if (!existing) {
      return res.status(204).send();
    }
    if (!canWriteContent(req.user, existing.placement)) {
      return res.status(403).json({ error: 'Caretakers can only manage content on the tutorials page' });
    }
    await ContentItem.delete(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

module.exports = router;