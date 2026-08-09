-- database/migration_booking_cancel.sql
-- Run this against an existing database to allow bookings to be cancelled by
-- the requester. Adds 'cancelled' as a valid status value.
--
-- The constraint name below is Postgres's default auto-generated name for an
-- inline CHECK on the "status" column. If this errors with "constraint does
-- not exist", run \d bookings in psql to find the real name and swap it in.

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'approved', 'denied', 'cancelled'));
