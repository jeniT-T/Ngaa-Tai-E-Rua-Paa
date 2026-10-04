-- database/migration_site_settings.sql
--
-- Makes the things that are specific to THIS marae — its name/logo, its map
-- image and pin layout, and its booking form's area/type options and
-- "whakapapa" question — admin-editable from a new Site Settings page,
-- instead of hardcoded in the frontend/backend. The client raised that they
-- may hand this product to other marae for their own use; right now doing
-- that means a developer editing source code and redeploying. This closes
-- that gap. It does NOT turn this into a multi-tenant app — one deployment
-- still serves one marae at a time (see the separate "branches" idea,
-- already on hold).
--
-- Singleton table: exactly one row, id is always 1.
CREATE TABLE IF NOT EXISTS site_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),

  site_name VARCHAR(255) NOT NULL DEFAULT 'Marae System',
  logo_url VARCHAR(500),

  map_image_url VARCHAR(500),
  -- Array of {type, x, y} — x/y are percentages (0-100) of the map image's
  -- width/height; a pin's position on the array IS its number on the map
  -- (1st entry = pin "1"). Each pin's NAME/DESCRIPTION/IMAGE are still
  -- edited as normal content items under the "map" placement in Content
  -- Manager, matched to this array by the same order — adding, removing or
  -- reordering pins here means the matching Content Manager entries shift
  -- too.
  map_pins JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Array of {value, label}. `value` is what's stored on a booking row —
  -- changing an existing value here changes what EXISTING bookings
  -- effectively point at, so prefer adding new options or editing labels
  -- over changing a value already in use.
  booking_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  booking_areas JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- The marae-specific "do you whakapapa to [this place]?" question —
  -- wording and whether to ask it at all are specific to this iwi/marae,
  -- not every marae will want it framed the same way (or at all).
  whakapapa_question_enabled BOOLEAN NOT NULL DEFAULT true,
  whakapapa_question_label VARCHAR(255) NOT NULL DEFAULT 'Do you whakapapa to the Paa?',

  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed the one row with THIS marae's current values, so nothing visibly
-- changes until someone actually edits the new Site Settings page.
INSERT INTO site_settings (
  id, site_name, logo_url, map_image_url, map_pins, booking_types, booking_areas,
  whakapapa_question_enabled, whakapapa_question_label
) VALUES (
  1,
  'Marae System',
  NULL,
  NULL,
  '[
    {"type": "Entrance", "x": 80, "y": 61},
    {"type": "Main Facility", "x": 46, "y": 68},
    {"type": "Assembly area 1", "x": 45, "y": 16},
    {"type": "Walking Route", "x": 55, "y": 42},
    {"type": "Facilities", "x": 18, "y": 68},
    {"type": "Open Space", "x": 72, "y": 35}
  ]'::jsonb,
  '[
    {"value": "standard", "label": "Standard hire"},
    {"value": "event", "label": "Event"},
    {"value": "tangihanga", "label": "Tangihanga"}
  ]'::jsonb,
  '[
    {"value": "general", "label": "General area"},
    {"value": "paa", "label": "Entire Paa"}
  ]'::jsonb,
  true,
  'Do you whakapapa to the Paa?'
)
ON CONFLICT (id) DO NOTHING;

-- The booking_type/area CHECK constraints were a fixed enum baked into the
-- schema. Now that the set of valid values is admin-configurable (above),
-- validation moves to the application layer — backend/routes/bookings.js
-- checks a submitted value against the CURRENT site_settings row instead of
-- a hardcoded list. Also widened the column lengths, since a custom
-- option's `value` slug isn't bound to the original short English words.
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_booking_type_check;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_area_check;
ALTER TABLE bookings ALTER COLUMN booking_type TYPE VARCHAR(50);
ALTER TABLE bookings ALTER COLUMN area TYPE VARCHAR(50);
