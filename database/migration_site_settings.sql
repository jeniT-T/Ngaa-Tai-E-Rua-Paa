
CREATE TABLE IF NOT EXISTS site_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),

  site_name VARCHAR(255) NOT NULL DEFAULT 'Manage My Marae',
  logo_url VARCHAR(500),

  map_image_url VARCHAR(500),

  map_pins JSONB NOT NULL DEFAULT '[]'::jsonb,

  booking_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  booking_areas JSONB NOT NULL DEFAULT '[]'::jsonb,

  whakapapa_question_enabled BOOLEAN NOT NULL DEFAULT true,
  whakapapa_question_label VARCHAR(255) NOT NULL DEFAULT 'Do you whakapapa to the Paa?',

  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO site_settings (
  id, site_name, logo_url, map_image_url, map_pins, booking_types, booking_areas,
  whakapapa_question_enabled, whakapapa_question_label
) VALUES (
  1,
  'Manage My Marae',
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

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_booking_type_check;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_area_check;
ALTER TABLE bookings ALTER COLUMN booking_type TYPE VARCHAR(50);
ALTER TABLE bookings ALTER COLUMN area TYPE VARCHAR(50);
