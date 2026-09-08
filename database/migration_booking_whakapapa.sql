-- database/migration_booking_whakapapa.sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS whakapapa BOOLEAN NOT NULL DEFAULT false;
