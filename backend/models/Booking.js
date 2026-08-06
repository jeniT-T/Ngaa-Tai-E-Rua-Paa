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
};

module.exports = Booking;
