// backend/routes/settings.js
//
// Reads and writes the site_settings singleton row — see
// backend/models/SiteSettings.js and database/migration_site_settings.sql
// for what it holds and why.
const express = require('express');
const SiteSettings = require('../models/SiteSettings');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function isValidOptionList(list) {
  return (
    Array.isArray(list) &&
    list.length > 0 &&
    list.every((item) => item && isNonEmptyString(item.value) && isNonEmptyString(item.label))
  );
}

function isValidPinList(list) {
  return (
    Array.isArray(list) &&
    list.every(
      (pin) =>
        pin &&
        isNonEmptyString(pin.type) &&
        typeof pin.x === 'number' &&
        typeof pin.y === 'number' &&
        pin.x >= 0 &&
        pin.x <= 100 &&
        pin.y >= 0 &&
        pin.y <= 100
    )
  );
}

// GET /api/settings — no auth. Every page that renders marae branding, the
// map, or the booking form needs this, including for a logged-out visitor,
// so it has to be public. Nothing stored here is sensitive.
router.get('/', async (req, res) => {
  try {
    const settings = await SiteSettings.get();
    res.json({ settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

// PUT /api/settings — admin only. Partial update; omit a field to leave it
// unchanged.
router.put('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const {
      siteName,
      secondaryColour,
      logoUrl,
      mapImageUrl,
      mapPins,
      bookingTypes,
      bookingAreas,
      whakapapaQuestionEnabled,
      whakapapaQuestionLabel,
    } = req.body;

    if (secondaryColour !== undefined && (typeof secondaryColour !== 'string' || !/^#[0-9a-f]{6}$/i.test(secondaryColour))) {
      return res.status(400).json({ error: 'Secondary colour must be a six-digit hex colour, such as #0081BD' });
    }
    if (siteName !== undefined && !isNonEmptyString(siteName)) {
      return res.status(400).json({ error: 'Site name cannot be empty' });
    }
    if (mapPins !== undefined && !isValidPinList(mapPins)) {
      return res.status(400).json({ error: 'Each map pin needs a type label and x/y between 0 and 100' });
    }
    if (bookingTypes !== undefined && !isValidOptionList(bookingTypes)) {
      return res
        .status(400)
        .json({ error: 'Booking types need at least one option, each with a value and label' });
    }
    if (bookingAreas !== undefined && !isValidOptionList(bookingAreas)) {
      return res
        .status(400)
        .json({ error: 'Booking areas need at least one option, each with a value and label' });
    }
    if (whakapapaQuestionLabel !== undefined && !isNonEmptyString(whakapapaQuestionLabel)) {
      return res.status(400).json({ error: 'The whakapapa question label cannot be empty' });
    }

    const settings = await SiteSettings.update({
      siteName,
      secondaryColour,
      logoUrl,
      mapImageUrl,
      mapPins,
      bookingTypes,
      bookingAreas,
      whakapapaQuestionEnabled,
      whakapapaQuestionLabel,
    });
    res.json({ settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

module.exports = router;
