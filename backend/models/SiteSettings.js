// backend/models/SiteSettings.js
//
// One singleton row (id = 1) holding the handful of things that are
// specific to THIS marae's identity rather than being page content — site
// name/logo, the map's image + pin layout, and the booking form's area/type
// options and "whakapapa" question wording. See
// database/migration_site_settings.sql for the full rationale. Admin-only
// to change (backend/routes/settings.js); readable by anyone, since public
// pages (the booking form, the map, the navbar) need it before anyone logs in.
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Maps the API's camelCase field names to their actual column names.
const COLUMNS = {
  siteName: 'site_name',
  logoUrl: 'logo_url',
  mapImageUrl: 'map_image_url',
  mapPins: 'map_pins',
  bookingTypes: 'booking_types',
  bookingAreas: 'booking_areas',
  whakapapaQuestionEnabled: 'whakapapa_question_enabled',
  whakapapaQuestionLabel: 'whakapapa_question_label',
};

const JSON_COLUMNS = new Set(['map_pins', 'booking_types', 'booking_areas']);

const SiteSettings = {
  async get() {
    const result = await pool.query('SELECT * FROM site_settings WHERE id = 1');
    return result.rows[0] || null;
  },

  // Partial update — only the keys actually passed in `fields` are changed;
  // everything else keeps its current value.
  async update(fields) {
    const sets = [];
    const values = [];
    let i = 1;
    for (const [key, column] of Object.entries(COLUMNS)) {
      if (fields[key] === undefined) continue;
      const isJson = JSON_COLUMNS.has(column);
      sets.push(`${column} = $${i}${isJson ? '::jsonb' : ''}`);
      values.push(isJson ? JSON.stringify(fields[key]) : fields[key]);
      i += 1;
    }

    if (sets.length === 0) {
      return this.get();
    }

    sets.push('updated_at = NOW()');
    const result = await pool.query(
      `UPDATE site_settings SET ${sets.join(', ')} WHERE id = 1 RETURNING *`,
      values
    );
    return result.rows[0];
  },
};

module.exports = SiteSettings;
