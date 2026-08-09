
const express = require('express');
const ArrivalItem = require('../models/ArrivalItem');

const router = express.Router();

// No access control on these routes currently - anyone can view, add,
// edit, or delete arrival items. Revisit if/when auth is required here.

function isValidYoutubeUrl(url) {
  if (!url) return true; // optional field
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)/.test(url);
}

router.get('/', async (req, res) => {
  try {
    const items = await ArrivalItem.findAll();
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch arrival items' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await ArrivalItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch arrival item' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { itemKey, groupKey, title, color, body, youtubeUrl, sortOrder } = req.body;

    if (!itemKey || !groupKey || !title) {
      return res.status(400).json({ error: 'itemKey, groupKey and title are required' });
    }

    if (!ArrivalItem.VALID_GROUPS.includes(groupKey)) {
      return res.status(400).json({ error: `groupKey must be one of: ${ArrivalItem.VALID_GROUPS.join(', ')}` });
    }

    if (!isValidYoutubeUrl(youtubeUrl)) {
      return res.status(400).json({ error: 'youtubeUrl must be a valid YouTube link' });
    }

    const item = await ArrivalItem.create({ itemKey, groupKey, title, color, body, youtubeUrl, sortOrder });
    res.status(201).json({ item });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An item with that key already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create arrival item' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, color, body, youtubeUrl, groupKey, sortOrder } = req.body;

    if (groupKey && !ArrivalItem.VALID_GROUPS.includes(groupKey)) {
      return res.status(400).json({ error: `groupKey must be one of: ${ArrivalItem.VALID_GROUPS.join(', ')}` });
    }

    if (!isValidYoutubeUrl(youtubeUrl)) {
      return res.status(400).json({ error: 'youtubeUrl must be a valid YouTube link' });
    }

    const updated = await ArrivalItem.update(req.params.id, { title, color, body, youtubeUrl, groupKey, sortOrder });
    if (!updated) return res.status(404).json({ error: 'Item not found' });
    res.json({ item: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update arrival item' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await ArrivalItem.remove(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Item not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete arrival item' });
  }
});

module.exports = router;
