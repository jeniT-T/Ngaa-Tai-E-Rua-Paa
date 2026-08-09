-- database/migration_content_placement.sql
-- Run this against an existing database to let admins target content at a
-- public marketing page (home/history/facilities/events) instead of only
-- the internal content library.

ALTER TABLE content_items ADD COLUMN IF NOT EXISTS placement VARCHAR(50);
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS block_type VARCHAR(20) NOT NULL DEFAULT 'section';

-- Guard against bad values sneaking in outside the API (safe to run more than once).
ALTER TABLE content_items DROP CONSTRAINT IF EXISTS content_items_block_type_check;
ALTER TABLE content_items ADD CONSTRAINT content_items_block_type_check
  CHECK (block_type IN ('heading', 'section'));

CREATE INDEX IF NOT EXISTS idx_content_items_placement ON content_items(placement);
