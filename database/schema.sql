
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

  booking_type VARCHAR(20) NOT NULL DEFAULT 'standard'
    CHECK (booking_type IN ('standard', 'event', 'tangihanga')),

  area VARCHAR(20) NOT NULL DEFAULT 'general'
    CHECK (area IN ('general', 'paa')),

  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'denied', 'cancelled')),

  admin_notes TEXT,

  -- "Do you whakapapa to the Paa?" — asked on every booking request.
  whakapapa BOOLEAN NOT NULL DEFAULT false,


  guest_access_token VARCHAR(64) NOT NULL UNIQUE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX idx_bookings_guest_access_token ON bookings(guest_access_token);


CREATE TABLE content_items (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  visible_to_roles TEXT[] NOT NULL DEFAULT ARRAY['member', 'caretaker', 'admin'],
  placement VARCHAR(50),
  block_type VARCHAR(20) NOT NULL DEFAULT 'section'
    CHECK (block_type IN ('heading', 'section')),
  video_url TEXT,
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