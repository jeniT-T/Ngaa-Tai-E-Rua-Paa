-- database/schema.sql
-- Single source of truth for a fresh database. If you already have a database
-- from before, use migration_content_v2.sql instead of re-running this.

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member'
    CHECK (role IN ('member', 'caretaker', 'admin')),
  name VARCHAR(255),
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

  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'denied')),

  admin_notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);

-- category: freeform, e.g. 'recipe', 'onboarding', 'equipment', 'maintenance',
--           'rules', 'health_safety' — admins can introduce new categories too.
-- visible_to_roles: which roles can see this item, e.g. ARRAY['member','caretaker']
CREATE TABLE content_items (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  visible_to_roles TEXT[] NOT NULL DEFAULT ARRAY['member', 'caretaker', 'admin'],

  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

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