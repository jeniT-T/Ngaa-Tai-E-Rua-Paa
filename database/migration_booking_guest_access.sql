ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_access_token VARCHAR(64);

UPDATE bookings
SET guest_access_token = encode(sha256((id::text || clock_timestamp()::text || random()::text)::bytea), 'hex')
WHERE guest_access_token IS NULL;

ALTER TABLE bookings ALTER COLUMN guest_access_token SET NOT NULL;
ALTER TABLE bookings ADD CONSTRAINT bookings_guest_access_token_unique UNIQUE (guest_access_token);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_access_token ON bookings(guest_access_token);
