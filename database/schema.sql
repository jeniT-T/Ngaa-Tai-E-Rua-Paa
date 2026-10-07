-- database/schema.sql
-- Single source of truth for a fresh database. If you already have a database
-- from before, apply only missing migrations; see README.md.

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
  completion_notes TEXT NOT NULL DEFAULT '',
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
  assigned_roles TEXT[] NOT NULL DEFAULT ARRAY['member', 'caretaker', 'manager', 'admin']::TEXT[],
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
  secondary_colour VARCHAR(7) NOT NULL DEFAULT '#0081BD' CHECK (secondary_colour ~ '^#[0-9A-Fa-f]{6}$'),
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

CREATE TABLE IF NOT EXISTS checklist_completions (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  checklist_id INTEGER REFERENCES checklists(id) ON DELETE SET NULL,
  checklist_title TEXT NOT NULL,
  completed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  completed_by_name TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  items JSONB NOT NULL,
  UNIQUE (booking_id, checklist_id)
);

BEGIN;
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS booking_id INTEGER UNIQUE REFERENCES bookings(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION add_booking_cleaning_checklist() RETURNS trigger AS $$
DECLARE
  checklist_id INTEGER;
BEGIN
  IF NEW.status <> 'approved' THEN RETURN NEW; END IF;
  INSERT INTO checklists (title, description, assigned_roles, booking_id)
  VALUES ('Cleaning & Checkout — Booking #' || NEW.id,
    'Default cleaning steps from the Marae Guide for ' || NEW.start_date || ' to ' || NEW.end_date || '.',
    ARRAY['member', 'caretaker', 'manager', 'admin']::TEXT[], NEW.id)
  ON CONFLICT (booking_id) DO NOTHING RETURNING id INTO checklist_id;
  IF checklist_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO checklist_items (checklist_id, text, position)
  SELECT checklist_id, title || ': ' || step,
         (row_number() OVER (ORDER BY content_id, ordinal) - 1)::INTEGER
  FROM (
    SELECT c.id AS content_id, c.title, lines.ordinal,
      btrim(regexp_replace(lines.line, '^[[:space:]]*[•●*-][[:space:]]*', '')) AS step
    FROM content_items c
    CROSS JOIN LATERAL regexp_split_to_table(c.body, E'\r?\n') WITH ORDINALITY AS lines(line, ordinal)
    WHERE c.placement = 'arrival' AND c.block_type = 'section'
      AND c.category IN ('cleaning', 'Arrival Guide Cleaning & Checkout')
  ) steps WHERE step <> '';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS booking_cleaning_checklist ON bookings;
CREATE TRIGGER booking_cleaning_checklist AFTER INSERT OR UPDATE OF status ON bookings
FOR EACH ROW EXECUTE FUNCTION add_booking_cleaning_checklist();
-- Give already-approved bookings the same default without overwriting existing copies.
UPDATE bookings SET status = status WHERE status = 'approved';
COMMIT;

BEGIN;
-- Seed the guide before deriving its cleaning checklist.
-- Seed guide in display order; preserve existing CMS edits.
-- database/migration_arrival_content.sql

INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Marae Guide',
  $body$Please follow these guidelines to ensure proper use of all marae facilities. Click on any section to expand.$body$,
  'Arrival Guide Getting Started', 'arrival', 'heading'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND block_type = 'heading'
);

-- aircon
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Airconditioning',
  $body$Wharenui
The remote for the air conditioning is located on the right side of the 4th pillar when looking inside from the front entrance.

Dining Room / Reitu
The remote is located on the wall. If you come in from the Reitu carving entrance it is on the left wall below the mural. If you come in from the side entrance it's on your right side.$body$,
  'Arrival Guide Equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Airconditioning'
);

-- bakersOven
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Bakers Oven',
  $body$• Ensure the Oven is turned on the wall.
• Ensure the Gas Fan is turned on. The Gas Fan makes the Gas Flow.
• Open the door of the oven until flat.
• Locate the Gas light flap and open it.
• Turn the oven on until you see the green light.
• Press and turn the Dial to the Pilot light. Keep your finger on the Dial and then press the Lighter button about 10 times.
• Look through the light port you will see a blue flame. It's very light but you can see it.
• If it doesn't appear keep your finger on the dial and press the Lighter Button another 5 times. If it doesn't light up a blue flame keep trying until you see the flame.
• When the flame is lit the oven is now active. Turn the dial to the far left to start in full ignition mode.
• To turn off, turn the Dial to the far right and turn the temperature dial to off.$body$,
  'Arrival Guide Kitchen', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Bakers Oven'
);

-- brattPan
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Bratt Pan',
  $body$• Ensure the Bratt pan is turned on the wall.
• Ensure the Gas Fan is turned on. The Gas Fan makes the Gas Flow.
• Press the button to fill the Bratt pan with water.
• When the Bratt pan is full turn, the temperature dials up to its required temperature.$body$,
  'Arrival Guide Kitchen', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Bratt Pan'
);

-- chairs
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Chairs',
  $body$• Wharenui Chairs are stacked to the far left of the Wharenui.
• Outside chairs are stacked under the awning.
• Forms and stacked chairs are under the marae.
• Dining Chairs are stacked on the stage, 5 high and 2 rows all the way across.$body$,
  'Arrival Guide Equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Chairs'
);

-- chiller
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Chiller',
  $body$• To use the Chiller, you must use the step ladder to the left of the Chiller and switch the Chiller on by looking on top of the chiller and turning on the switch.
• Upon final clean ensure all food is removed.
• Give the chiller a quick mop on exit and switch off from the wall.$body$,
  'Arrival Guide Equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Chiller'
);

-- combiOvens
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Combi Ovens',
  $body$• Watch this space. There will be some instructions on how to cook using the Combi ovens if you don't already know. Ensure to run a quick clean when you finish. Trays are to the right of the Combi Ovens on the bench.$body$,
  'Arrival Guide Kitchen', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Combi Ovens'
);

-- deepFryer
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Deep Fryer',
  $body$• It takes about 20 Litres of oil to use this, Fryer. To start do the same instructions as for the Bakers Oven.$body$,
  'Arrival Guide Kitchen', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Deep Fryer'
);

-- defibrillator
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Defibrillator',
  $body$• Located to the right of the Wharenui. Please follow the instructions. Inform the Paa Committee Chairperson if it's been used.$body$,
  'Arrival Guide Equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Defibrillator'
);

-- cleanDining
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Clean – Final Dining Hall',
  $body$• Close all windows.
• Close Curtains.
• Ensure all chairs are stacked away. 5 chairs high, 2 rows across the stage
• The 2 Table Trolleys and 1 Chair Trolley positioned in front of the stage.
• Sweep the floors with the brush and dustpan.
• Close all doors. Don't allow anyone to go on the floors.
• From the Loading Dock there are 2 Green Mop Buckets and 2 Mops. Use these only for the Dining Hall. The cleaning products are to the left of the hot water Urn. If you want to get hot water out of the taps you must make sure the Gas Button is turned on. This allows the Gas to flow and heat the water.
• Mop the Floor as usual.
• When finished poor the water outside down the drain. Ring out the Mops and hang back up on the wall of the Loading Dock.$body$,
  'Arrival Guide Cleaning & Checkout', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Clean – Final Dining Hall'
);

-- cleanKitchen
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Clean – Final Kitchen',
  $body$• The Kitchen should be the final thing you do before exiting.
• Close all windows.
• Ensure all rubbish is removed. You're responsible for removing your rubbish unless prior approval with the Paa Committee Chairperson as there is an extra cost.
• All Trolleys are put away in the backroom with the dishes.
• All Food is removed.
• All Fridges are emptied and turned off.
• All Bins are cleaned and stacked to the right side of the Exit door inside.
• Dishes have been put away.
• Tea towels have been placed in the Washing machine and turned on.
• Combi ovens have been put on clean mode.
• All Stainless-steel benches are wiped down.
• Dishwasher unit is emptied and racks put away.
• Ensure you're the last to exit the kitchen. Don't allow anyone to go on the floors.
• Urn. If you want to get hot water out of the taps you must make sure the Gas Button is turned on. This allows the Gas to flow and heat the water. Turn off when you have the hot water.
• Mop the Floor ensuring you cover the entire floor. Make a track so that you'll mop all the way out to the exit door. Close the Door and lock up.
• When finished pour the water outside down the drain. Ring out the Mops and hang back up on the wall of the Loading Dock.$body$,
  'Arrival Guide Cleaning & Checkout', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Clean – Final Kitchen'
);

-- cleanToilets
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Clean – Final Toilets',
  $body$• Place all of the rubbish in the toilets to the outside bin. It's the responsibility of the hirer to get rid of the rubbish unless prior approval as there is an extra cost.
• The Cleaning products are in the ladies toilets.
• Use the paper towels and the Spray bottle labelled Bench tops to wipe down the benches.
• Use the paper towels and the Spray bottle for the toilets.
• Ensure all of the Lids and under the lids of the toilets are set up after cleaning.
• Use the Window Cleaner to clean any dirty windows.
• The Blue Mop buckets and Blue Mops are on the wall in the corner of the Dining Hall. If you come out of the toilets and head left and left again you can look on the wall to the right, and you'll see them.
• Use the Floor cleaning product. Turn on a shower and use the hot water from there. Mop the showers and the floors.
• Return the Mop and Buckets to original spots please.
• Lock the Toilet doors so no one can use them.$body$,
  'Arrival Guide Cleaning & Checkout', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Clean – Final Toilets'
);

-- cleanWharenui
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Clean – Final Wharenui',
  $body$• Chairs to be stacked on the far left of the wharenui by the entrance of the ariki room.
• All Rubbish must be removed.
• Floors to be vacuum.
• Ensure to vacuum the mattress room and return the Vacuum to the Mattress room.
• If windows are dirty, please use the window cleaner in the toilets and paper towels to clean.$body$,
  'Arrival Guide Cleaning & Checkout', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Clean – Final Wharenui'
);

-- cleanEquipment
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Cleaning Equipment',
  $body$• Wharenui – Vacuum, Brushes and Brooms are in the Mattress Room.
• Toilets – Cleaning chemicals are in the ladies toilet. Brooms are next to the disability toilets. Mops and Buckets are on the back wall of the Wharekai Reitu.
• Kitchen – All cleaning chemicals are on the bench next to the Urn. All mops, buckets and brooms are on the back loading dock.$body$,
  'Arrival Guide Getting Started', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Cleaning Equipment'
);

-- dishWasher
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Dish Washer',
  $body$• Turn on the power for the dishwasher.
• Then press the Power on the dishwasher.
• Slide in a rack of dirty dishes and close hood.
• Press Start.
• Wait till finished then lift hood and remove the rack.
• For the final clean ensure all of the Racks are put away below the benches and the Dishwasher hood is raised.$body$,
  'Arrival Guide Kitchen', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Dish Washer'
);

-- dishes
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Dishes',
  $body$• The backroom has labels for where each dish must return to.
• Cutlery and Cups are on the trolley with drawers.
• Ensure every dish is put away on your final clean.$body$,
  'Arrival Guide Kitchen', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Dishes'
);

-- freezers
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Freezers',
  $body$• Press the button on the top of the freezer to turn on.
• Remove all kai from Freezer on final clean and turn off the Freezer.$body$,
  'Arrival Guide Kitchen', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Freezers'
);

-- fridges
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Fridges',
  $body$• Press the button on the top of the Fridges to turn on.
• Remove all kai from Freezer on final clean and turn off the Fridge.$body$,
  'Arrival Guide Kitchen', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Fridges'
);

-- gas
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Gas',
  $body$• There are 2 areas where our gas bottles are located. 1 is at the back of the kitchen and the other is at the back of the new toilets.
• If the gas runs out, turn the dial to the other gas bottle and open up the value. Close the Value of the gas bottle that has run out.
• Important: In the kitchen, you must switch the Gas switch on (located below the power buttons for the Combi Ovens). This controls the flow of Gas. Without it switched on your gas cookers will not work and no Hot water will come out of the taps.
• When not in use turn off the Gas switch.$body$,
  'Arrival Guide Utilities & Climate', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Gas'
);

-- grillTops
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Grill Tops',
  $body$• Switch on the Gas Switch.
• Turn on the Gas dial and light with the Gas Lighter located on the shelf above the GrilTops.$body$,
  'Arrival Guide Getting Started', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Grill Tops'
);

-- hangiCookers
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Hangi Cookers',
  $body$• Hangi Cookers should have a connection directly to the wall gas outlet.$body$,
  'Arrival Guide Kitchen', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Hangi Cookers'
);

-- hotBoxes
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Hot Boxes',
  $body$• Hot boxes used to keep your bulk kai warm.
• Just turn on and turn off as needed.
• Make sure on your final clean to give it a wipe out and switch off.$body$,
  'Arrival Guide Kitchen', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Hot Boxes'
);

-- hotWater
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Hot Water',
  $body$• For immediate hot water use the Urn on the Wall.
• There maybe in some cases a plug in Urn available to you.
• Hot water from the taps you must make sure you turn the Gas Switch 1*.$body$,
  'Arrival Guide Utilities & Climate', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Hot Water'
);

-- microwave
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Microwave',
  $body$• Make sure everything is removed and switch off when not in use.$body$,
  'Arrival Guide Kitchen', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Microwave'
);

-- evacuation
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Evacuation Point',
  $body$• The Evacuation point is located in the front car park by the main road.$body$,
  'Arrival Guide Getting Started', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Evacuation Point'
);

-- firstAid
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'First Aid',
  $body$• The 1st Aid kit is located at the shelf next to the Urn.$body$,
  'Arrival Guide Getting Started', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'First Aid'
);

-- flag
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Flag / Kara',
  $body$• The Flag / Kara will stay up during the whole duration of the hui/tangi/wananga.$body$,
  'Arrival Guide Getting Started', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Flag / Kara'
);

-- floors
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Floors',
  $body$• Every floor has a different Mop and Bucket.
• The Green mop and bucket are for the Dining hall only. Use the floor cleaner.
• The Yellow mop and bucket are for the Kitchen only. Do spot cleans during your time and use the Yellow mop and bucket for your final exit clean. If not, the floor will come up dirty unless its dried. Also use the sjax or Jiff products for this floor.
• The Blue mop and bucket are for the new and old toilets. Floor cleaner in Ladies Toilet.$body$,
  'Arrival Guide Getting Started', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Floors'
);

-- linen
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Linen',
  $body$• All linen is in the Mattress Room Cupboard.
• On exit day, use the Green Laundry bag that is located in the Cupboard to the left of the linen cupboard and fill up with all of the linen to be collected. Leave the bags in the Mattress Room for collection.$body$,
  'Arrival Guide Facilities', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Linen'
);

-- loadingDock
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Loading Dock',
  $body$• Do not use the Dining Room chairs outside. It ruins the chair foot rubbers.
• No smoking on the Loading Dock.
• On the final clean, use the hose on the wall to hose down.$body$,
  'Arrival Guide Getting Started', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Loading Dock'
);

-- mattressRoom
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Mattress Room',
  $body$• In the mattress room there is a picture on the left as you walk into the mattress room of how you should leave this space. Please ensure its left in this manner.
• Under no circumstances is there to be any sleeping in the mattress room. It's a fire exit and must be clear at all times.
• The fire exit door should not be used unless for emergencies. There is a photo to the left as you enter the Mattress room that shows how you should leave the Mattress Room when finished.
• Pillows are on the walls.
• The Topper/Mattress Wall and mattress are in the middle of the room.
• Whaariki are to the back wall.
• 6 treacle tables are stored to the back.
• Vacuum is stacked at the back wall.
• Blow up mattresses stack in the gap next to it.$body$,
  'Arrival Guide Getting Started', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Mattress Room'
);

-- lights
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Lights',
  $body$Wharenui
The light switch for the internal lights is located to the left of the entrance door.

Wharenui mahau lights (for nighttime)
• Turn on at nighttime only.
• Use the main key that opens the toilets and wharenui and open the Ariki room which is the 1st door to the left as you enter the wharenui.
• Look on the wall and you'll see a Dial. Turn the Dial to On. The lights will turn on around the mahau.
• Exit the Ariki room and make sure it is locked.
• In the morning ensure to turn off these lights.

Mattress Room
The light switch is on the right side as you enter the Mattress room or the back wall by the Fire Alarm.

Toilets
These switch on automatically when a person enters the toilet. They will turn off after a period of time.

Dining Room
Light switch is located in the kitchen to the left of the storage/dishes room between the Main Switch Board and the door.

Outside and Front Gate Lights
Light switch is located in the kitchen to the left of the storage/dishes room between the Main Switch Board and the door.$body$,
  'Arrival Guide Utilities & Climate', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Lights'
);

-- parking
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Parking',
  $body$• 3 Areas to park.
• Front Carpark at the Front of the Paa.
• Back Carpark behind the Wharenui and Kitchen.
• On the road.$body$,
  'Arrival Guide Getting Started', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Parking'
);

-- pigBins
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Pig Bins',
  $body$• There are large Blue pig bins at the back loading dock. Please ensure you only have food scraps in the bin. We will use these scraps in our new composting system.
• Place the Bins to the left of the Loading Dock.$body$,
  'Arrival Guide Getting Started', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Pig Bins'
);

-- recyclingBins
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Recycling Bins',
  $body$• There is a limited amount of recycling bins. Please fill these bins and then place any extra in rubbish bags.$body$,
  'Arrival Guide Getting Started', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Recycling Bins'
);

-- rubbish
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Rubbish',
  $body$• It is the responsibility of the hirer to remove the rubbish from the paa. However, if you require us to remove the rubbish there is a cost. For some people do hire a skip to get rid of the rubbish. We can provide you details for this.
• Stack all of the rubbish bags on the grey rack on the loading dock.
• We do have pig bins which you can use for kai which we use in our composting system.$body$,
  'Arrival Guide Getting Started', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Rubbish'
);

-- showers
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Showers',
  $body$• The Showers use gas which is located at the back of the main toilets. If the Water goes cold, check the Dial which way it's pointing and point it to the opposite side. Then turn on the gas bottle you've pointed the dial to and you should have hot water. Any issues please call The Paa Committee Chairperson 0212749600.$body$,
  'Arrival Guide Facilities', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Showers'
);

-- smoking
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Smoking',
  $body$• Smoking is only permitted by the back Green toilets to the back of the loading dock.$body$,
  'Arrival Guide Getting Started', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Smoking'
);

-- tables
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Tables',
  $body$• Wharenui tables must stay in the Wharenui. No Dining room tables to be used in the Wharenui.
• Wharekai tables are stacked on the trolleys and placed in front of the stage.$body$,
  'Arrival Guide Equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Tables'
);

-- toilets
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Toilets',
  $body$• There are 3 sets of toilets that can be used during larger events.
• The main toilets are to the left of the Wharenui.
• There are green toilets at the back of the loading dock. These toilets will only be opened for large events. This area is also used for Smoking and Vaping.
• The final is the front toilets. Due to be completed in November 2025 these will be used mainly for our visitors who come onto the Paa.$body$,
  'Arrival Guide Facilities', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Toilets'
);

-- trolleys
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Trolleys',
  $body$• All of the kitchen trolleys must be removed from the kitchen floor and placed in the area where the dishes are stacked on final clean.
• Ensure these are wiped down and clear of any kai or rubbish.$body$,
  'Arrival Guide Equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Trolleys'
);

-- vacuum
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Vacuum',
  $body$• The Vacuum is located in the Mattress room of the wharenui. Please use this to do a final clean before exiting the Wharenui.
• It's a backpack style so easy to use.
• Please ensure the Vacuum is returned to its proper place.$body$,
  'Arrival Guide Equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Vacuum'
);

-- wifi
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'WiFi',
  $body$• The WiFi Router is located in the Kitchen on the shelf.
• WiFi password is "NgaaTaieRua23"
• Reception doesn't extend to the Wharenui.$body$,
  'Arrival Guide Getting Started', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'WiFi'
);

-- Rename for databases that already ran this migration under the old
-- "Arrival Info" naming, before the guide was renamed to "Marae Guide"
-- to reflect that it covers the whole stay, not just arrival.
UPDATE content_items
SET title = 'Marae Guide', updated_at = NOW()
WHERE placement = 'arrival' AND block_type = 'heading'
  AND title = 'Marae Facilities & Operations Guide';


CREATE TABLE IF NOT EXISTS default_booking_checklist (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  body TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO default_booking_checklist (id, body)
SELECT 1, COALESCE(string_agg(title || ': ' || step, E'\n' ORDER BY content_id, ordinal), '')
FROM (
  SELECT c.id AS content_id, c.title, lines.ordinal,
    btrim(regexp_replace(lines.line, '^[[:space:]]*[•●*-][[:space:]]*', '')) AS step
  FROM content_items c
  CROSS JOIN LATERAL regexp_split_to_table(c.body, E'\r?\n') WITH ORDINALITY AS lines(line, ordinal)
  WHERE c.placement = 'arrival' AND c.block_type = 'section'
    AND c.category IN ('cleaning', 'Arrival Guide Cleaning & Checkout')
) steps WHERE step <> ''
ON CONFLICT (id) DO NOTHING;
CREATE OR REPLACE FUNCTION add_booking_cleaning_checklist() RETURNS trigger AS $$
DECLARE
  checklist_id INTEGER;
BEGIN
  IF NEW.status <> 'approved' THEN RETURN NEW; END IF;
  INSERT INTO checklists (title, description, assigned_roles, booking_id)
  VALUES ('Cleaning & Checkout — Booking #' || NEW.id,
    'Default cleaning steps from the Marae Guide for ' || NEW.start_date || ' to ' || NEW.end_date || '.',
    ARRAY['member', 'caretaker', 'manager', 'admin']::TEXT[], NEW.id)
  ON CONFLICT (booking_id) DO NOTHING RETURNING id INTO checklist_id;
  IF checklist_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO checklist_items (checklist_id, text, position)
  SELECT checklist_id, btrim(line), (ordinal - 1)::INTEGER
  FROM default_booking_checklist
  CROSS JOIN LATERAL regexp_split_to_table(body, E'\r?\n') WITH ORDINALITY AS lines(line, ordinal)
  WHERE id = 1 AND btrim(line) <> '';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
