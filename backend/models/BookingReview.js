// backend/models/BookingReview.js
//
// One row per booking, two independent halves — see
// database/migration_booking_reviews.sql for the full column rundown.
// The privacy boundary (never let a guest see the manager's notes about
// them) is enforced by which columns each route selects, not by anything
// in this model — findByBooking() always returns the full row, so routes
// must pick fields carefully. See backend/routes/bookings.js.
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const BookingReview = {
  async findByBooking(bookingId) {
    const result = await pool.query(
      `SELECT * FROM booking_reviews WHERE booking_id = $1`,
      [bookingId]
    );
    return result.rows[0] || null;
  },

  async upsertManagerReview(bookingId, { rating, notes, reviewedBy }) {
    const result = await pool.query(
      `INSERT INTO booking_reviews (booking_id, manager_rating, manager_notes, manager_reviewed_by, manager_reviewed_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (booking_id) DO UPDATE SET
         manager_rating = EXCLUDED.manager_rating,
         manager_notes = EXCLUDED.manager_notes,
         manager_reviewed_by = EXCLUDED.manager_reviewed_by,
         manager_reviewed_at = NOW(),
         updated_at = NOW()
       RETURNING *`,
      [bookingId, rating, notes || null, reviewedBy]
    );
    return result.rows[0];
  },

  async upsertGuestReview(bookingId, { rating, notes }) {
    const result = await pool.query(
      `INSERT INTO booking_reviews (booking_id, guest_rating, guest_notes, guest_reviewed_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (booking_id) DO UPDATE SET
         guest_rating = EXCLUDED.guest_rating,
         guest_notes = EXCLUDED.guest_notes,
         guest_reviewed_at = NOW(),
         updated_at = NOW()
       RETURNING *`,
      [bookingId, rating, notes || null]
    );
    return result.rows[0];
  },
};

module.exports = BookingReview;
