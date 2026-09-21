-- database/migration_content_color.sql
-- Adds an optional per-item accent color to content_items, ported from the
-- teammate's arrival-items branch (their color picker). Falls back to a
-- page/group default when unset.
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS color VARCHAR(20);
