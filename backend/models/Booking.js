const crypto = require('crypto');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const Booking = {
  async create({ userId, startDate, endDate, purpose, bookingType = 'standard', whakapapa = false, area = 'general' }) {
    const guestAccessToken = crypto.randomBytes(24).toString('hex');

    const result = await pool.query(
      `INSERT INTO bookings (user_id, start_date, end_date, purpose, booking_type, whakapapa, area, guest_access_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, startDate, endDate, purpose, bookingType, whakapapa, area, guestAccessToken]
    );
    return result.rows[0];
  },

  async findByGuestToken(token) {
    const result = await pool.query(
      `SELECT id, start_date, end_date, status, area, booking_type, purpose
       FROM bookings WHERE guest_access_token = $1`,
      [token]
    );
    return result.rows[0] || null;
  },

  async findActiveRanges(excludeId) {
    const conditions = [`status IN ('approved', 'pending')`];
    const values = [];
    if (excludeId) {
      values.push(excludeId);
      conditions.push(`id != $${values.length}`);
    }
    const result = await pool.query(
      `SELECT id, start_date, end_date, status FROM bookings WHERE ${conditions.join(' AND ')} ORDER BY start_date`,
      values
    );
    return result.rows;
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

  async update(id, { startDate, endDate, purpose, bookingType, whakapapa, area }) {
    const result = await pool.query(
      `UPDATE bookings
       SET start_date = COALESCE($1, start_date),
           end_date = COALESCE($2, end_date),
           purpose = COALESCE($3, purpose),
           booking_type = COALESCE($4, booking_type),
           whakapapa = COALESCE($5, whakapapa),
           area = COALESCE($6, area),
           status = 'pending',
           admin_notes = NULL,
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [startDate, endDate, purpose, bookingType, whakapapa ?? null, area ?? null, id]
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
