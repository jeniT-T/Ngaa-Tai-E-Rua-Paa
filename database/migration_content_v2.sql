-- database/migration_content_v2.sql
-- Run this against your existing database. It upgrades content_items from the
-- fixed type/audience columns to a flexible category + multi-role visibility model,
-- and adds the issues table for the "contact management" feature.

-- 1. Drop the old restrictive CHECK constraints (names may vary — check with \d content_items
--    if this errors; Postgres auto-names them content_items_type_check / content_items_audience_check)
ALTER TABLE content_items DROP CONSTRAINT IF EXISTS content_items_type_check;
ALTER TABLE content_items DROP CONSTRAINT IF EXISTS content_items_audience_check;

-- 2. Rename type -> category (freeform now, not restricted to checklist/tutorial)
ALTER TABLE content_items RENAME COLUMN type TO category;

-- 3. Replace the single 'audience' column with an array of roles
ALTER TABLE content_items ADD COLUMN visible_to_roles TEXT[] NOT NULL
  DEFAULT ARRAY['member', 'caretaker', 'admin'];

-- Best-effort carry over of old audience values into the new array column
UPDATE content_items SET visible_to_roles =
  CASE audience
    WHEN 'guest' THEN ARRAY['member', 'admin']
    WHEN 'caretaker' THEN ARRAY['caretaker', 'admin']
    ELSE ARRAY['member', 'caretaker', 'admin']
  END;

ALTER TABLE content_items DROP COLUMN audience;

-- Speeds up "find content visible to my role" queries
CREATE INDEX idx_content_items_roles ON content_items USING GIN (visible_to_roles);
CREATE INDEX idx_content_items_category ON content_items(category);

-- 4. New table for the "contact management for issues" feature
CREATE TABLE issues (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at TIMESTAMP DEFAULT NOW()
);