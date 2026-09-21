-- database/migration_booking_area.sql
-- Adds the "which part of the marae" question to bookings. Booking either
-- area blocks the whole property for everyone else (no change needed to
-- the availability logic) — this column is just so the booker and admin
-- can see what was actually requested.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS area VARCHAR(20) NOT NULL DEFAULT 'general';

-- Postgres has no "ADD CONSTRAINT IF NOT EXISTS", so drop-then-add instead.
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_area_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_area_check CHECK (area IN ('general', 'paa'));
