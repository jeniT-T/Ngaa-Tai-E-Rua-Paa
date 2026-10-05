-- database/schema.sql
-- Single source of truth for a fresh database. If you already have a database
-- from before, use migration_content_v2.sql instead of re-running this.

-- Roles: 'admin' manages content (the CMS) only. 'manager' handles booking
-- approvals, user/role management and reported issues — everything the
-- admin role used to do besides content. 'caretaker' and 'member' unchanged.
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member'
    CHECK (role IN ('member', 'caretaker', 'admin', 'manager')),
  name VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  purpose TEXT NOT NULL,

  -- The set of valid values for booking_type/area is admin-configurable
  -- (see site_settings below, migration_site_settings.sql) rather than a
  -- fixed CHECK enum — validated at the application layer instead
  -- (backend/routes/bookings.js) against the current site_settings row.
  booking_type VARCHAR(50) NOT NULL DEFAULT 'standard',

  -- Which part of the marae is being requested. Regardless of which area is
  -- chosen, booking ANY area blocks the whole property for everyone else —
  -- there's no partial/simultaneous availability, this is purely so the
  -- booker and admin know what was actually asked for.
  area VARCHAR(50) NOT NULL DEFAULT 'general',

  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'denied', 'cancelled')),

  admin_notes TEXT,

  -- "Do you whakapapa to the Paa?" — asked on every booking request.
  whakapapa BOOLEAN NOT NULL DEFAULT false,

  -- Unguessable token generated in backend/models/Booking.js (crypto.randomBytes).
  -- Lets anyone with the link view arrival info for this booking's dates
  -- without an account — solves "50 guests, 1 account holder". See
  -- GET /api/bookings/guest/:token.
  guest_access_token VARCHAR(64) NOT NULL UNIQUE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX idx_bookings_guest_access_token ON bookings(guest_access_token);

-- category: freeform, e.g. 'recipe', 'onboarding', 'equipment', 'maintenance',
--           'rules', 'health_safety' — admins can introduce new categories too.
--           Special case: for items with placement = 'arrival', category
--           doubles as which phase-group the item is shown under on the
--           arrival guide — must be 'arrival', 'general' or 'leaving'
--           (anything else falls back to 'general'). See ArrivalGuideView.jsx.
-- visible_to_roles: which roles can see this item, e.g. ARRAY['member','caretaker']
-- placement: NULL = internal content library item (existing behaviour).
--            'home' | 'history' | 'facilities' | 'events' = shows up on that
--            public marketing page instead, no login required to view it.
-- block_type: 'section' (a card in the page's list), 'heading' (the page's
--            title/intro text), or 'gallery' (a plain admin-uploaded photo
--            in the page's image strip, no title/body rendered alongside
--            it — used for things like the History page's photo gallery) —
--            only meaningful when placement is set.
CREATE TABLE content_items (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  visible_to_roles TEXT[] NOT NULL DEFAULT ARRAY['member', 'caretaker', 'admin'],
  placement VARCHAR(50),
  block_type VARCHAR(20) NOT NULL DEFAULT 'section'
    CHECK (block_type IN ('heading', 'section', 'gallery')),
  video_url TEXT,
  -- Admin-uploaded image for this item (see migration_content_images.sql /
  -- POST /api/content/upload) — a relative "/uploads/<filename>" path, or
  -- NULL for none.
  image_url TEXT,
  color VARCHAR(20),

  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_content_items_placement ON content_items(placement);

CREATE INDEX idx_content_items_roles ON content_items USING GIN (visible_to_roles);
CREATE INDEX idx_content_items_category ON content_items(category);

CREATE TABLE issues (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Caretaker-authored checklists (see migration_checklists.sql for the
-- rationale) — caretakers create and maintain these themselves.
CREATE TABLE checklists (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE checklist_items (
  id SERIAL PRIMARY KEY,
  checklist_id INTEGER NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_checklist_items_checklist ON checklist_items(checklist_id, position);

-- Post-stay reviews, both directions (see migration_booking_reviews.sql for
-- the full rationale). One row per booking: manager_* is the manager's
-- private star rating + notes about the guest, never exposed to the guest;
-- guest_* is the guest's own star rating + notes about their stay, readable
-- by the booking's owner and by a manager. Both halves are only writable
-- once a booking is "complete" (approved, end_date passed) — enforced in
-- the routes, not here.
CREATE TABLE booking_reviews (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,

  manager_rating INTEGER CHECK (manager_rating BETWEEN 1 AND 5),
  manager_notes TEXT,
  manager_reviewed_by INTEGER REFERENCES users(id),
  manager_reviewed_at TIMESTAMP,

  guest_rating INTEGER CHECK (guest_rating BETWEEN 1 AND 5),
  guest_notes TEXT,
  guest_reviewed_at TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_booking_reviews_booking ON booking_reviews(booking_id);

-- Site-wide settings — the handful of things specific to THIS marae's
-- identity rather than page content (see migration_site_settings.sql for
-- the full rationale: making the product reusable by a different marae
-- without a developer editing code). Singleton table, exactly one row.
CREATE TABLE site_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),

  site_name VARCHAR(255) NOT NULL DEFAULT 'Marae System',
  logo_url VARCHAR(500),

  map_image_url VARCHAR(500),
  -- Array of {type, x, y} — a pin's position in this array IS its number
  -- on the map; each pin's name/description/image is still a normal
  -- content item under the "map" placement, matched by the same order.
  map_pins JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Array of {value, label} each. `value` is what's stored on a booking row.
  booking_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  booking_areas JSONB NOT NULL DEFAULT '[]'::jsonb,

  whakapapa_question_enabled BOOLEAN NOT NULL DEFAULT true,
  whakapapa_question_label VARCHAR(255) NOT NULL DEFAULT 'Do you whakapapa to the Paa?',

  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO site_settings (
  id, site_name, map_pins, booking_types, booking_areas,
  whakapapa_question_enabled, whakapapa_question_label
) VALUES (
  1,
  'Marae System',
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
);

-- The caretaker's own task calendar/schedule, shared between caretaker and
-- manager (see migration_caretaker_tasks.sql for the full rationale —
-- there's only one caretaker, and manager needs the same view, which the
-- old per-browser localStorage version couldn't do).
CREATE TABLE caretaker_tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  start_time VARCHAR(5),
  end_time VARCHAR(5),
  urgency VARCHAR(20) NOT NULL DEFAULT 'medium',
  notes TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_caretaker_tasks_date ON caretaker_tasks(date);

-- Equipment inventory (S36) — see migration_equipment.sql for rationale.
CREATE TABLE equipment_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  condition VARCHAR(100) NOT NULL DEFAULT 'Good',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_equipment_items_name ON equipment_items(name);
