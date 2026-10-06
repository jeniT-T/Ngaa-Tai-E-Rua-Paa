-- Configurable blue site accent, editable from Site Settings.
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS secondary_colour VARCHAR(7) NOT NULL DEFAULT '#0081BD'
  CHECK (secondary_colour ~ '^#[0-9A-Fa-f]{6}$');
