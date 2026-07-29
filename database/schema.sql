
-- database/schema.sql
-- Single source of truth. Delete users.sql, roles.sql, content.sql, tutorials.sql —
-- this file replaces all of them.
 
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
 
CREATE TABLE content_items (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
 
  type VARCHAR(20) NOT NULL
    CHECK (type IN ('checklist', 'tutorial')),
 
  audience VARCHAR(20) NOT NULL DEFAULT 'guest'
    CHECK (audience IN ('guest', 'caretaker', 'both')),
 
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
 