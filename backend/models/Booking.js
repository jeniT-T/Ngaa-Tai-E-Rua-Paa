// backend/models/Booking.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const Booking = {
  async create({ userId, startDate, endDate, purpose, bookingType = 'standard' }) {
    const result = await pool.query(
      `INSERT INTO bookings (user_id, start_date, end_date, purpose, booking_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, startDate, endDate, purpose, bookingType]
    );
    return result.rows[0];
  },

  async findByUser(userId) {
    const result = await pool.query(
      `SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query(`SELECT * FROM bookings WHERE id = $1`, [id]);
    return result.rows[0] || null;
  },

  async findAll() {
    const result = await pool.query(
      `SELECT bookings.*, users.name AS requester_name, users.email AS requester_email
       FROM bookings
       JOIN users ON users.id = bookings.user_id
       ORDER BY
         CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
         created_at DESC`
    );
    return result.rows;
  },

  // Admin decision — approve/deny (or re-open back to pending if they change
  // their mind), optionally leaving a note for the requester.
  async updateStatus(id, status, adminNotes) {
    const result = await pool.query(
      `UPDATE bookings
       SET status = $1, admin_notes = COALESCE($2, admin_notes), updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, adminNotes ?? null, id]
    );
    return result.rows[0] || null;
  },

  // Owner edits their own request (dates/purpose/type) and it goes back to
  // 'pending' for the admin to look at again — a "re-request" after a change.
  async update(id, { startDate, endDate, purpose, bookingType }) {
    const result = await pool.query(
      `UPDATE bookings
       SET start_date = COALESCE($1, start_date),
           end_date = COALESCE($2, end_date),
           purpose = COALESCE($3, purpose),
           booking_type = COALESCE($4, booking_type),
           status = 'pending',
           admin_notes = NULL,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [startDate, endDate, purpose, bookingType, id]
    );
    return result.rows[0] || null;
  },

  async cancel(id) {
    const result = await pool.query(
      `UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  },
};

module.exports = Booking;
