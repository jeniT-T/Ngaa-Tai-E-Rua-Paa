-- database/migration_booking_reviews.sql
--
-- Post-stay reviews, both directions. One row per booking, two independent
-- halves:
--   - manager_* : the manager's private star rating + notes about the
--     guest ("how good a guest were they"). Never exposed to the guest —
--     see GET /api/bookings/:id/guest-review in backend/routes/bookings.js,
--     which only ever selects the guest_* columns.
--   - guest_* : the guest's own star rating + notes about their stay at
--     the marae. Readable by the booking's owner and by a manager.
-- Both halves can only be written once a booking is "complete" (status
-- 'approved' and its end_date has passed) — enforced in the routes, not
-- here, since that's a point-in-time check rather than a static constraint.

CREATE TABLE IF NOT EXISTS booking_reviews (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,

  manager_rating INTEGER CHECK (manager_rating BETWEEN 1 AND 5),
  manager_notes TEXT,
  manager_reviewed_by INTEGER REFERENCES users(id),
  manager_reviewed_at TIMESTAMP,

  guest_rating INTEGER CHECK (guest_rating BETWEEN 1 AND 5),
  guest_notes TEXT,
  guest_reviewed_at TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_reviews_booking ON booking_reviews(booking_id);
