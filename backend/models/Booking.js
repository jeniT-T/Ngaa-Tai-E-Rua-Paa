const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function formatLocalTimestamp(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

const Booking = {
  async listAll() {
    const result = await pool.query(
      `SELECT b.id,
              b.user_id,
              to_char(b.start_datetime, 'YYYY-MM-DD"T"HH24:MI:SS') AS start_datetime,
              to_char(b.end_datetime, 'YYYY-MM-DD"T"HH24:MI:SS') AS end_datetime,
              b.purpose,
              b.booking_type,
              b.status,
              b.created_at,
              u.name AS user_name
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       ORDER BY b.start_datetime ASC`
    );
    return result.rows;
  },

  async findOverlap(startDateTime, endDateTime, excludeBookingId = null) {
    let query = `
      SELECT 1
      FROM bookings
      WHERE status != 'denied'
        AND NOT (end_datetime <= $1 OR start_datetime >= $2)
    `;
    const values = [startDateTime, endDateTime];

    if (excludeBookingId) {
      query += ` AND id != $3`;
      values.push(excludeBookingId);
    }

    query += ' LIMIT 1';
    const result = await pool.query(query, values);
    return result.rowCount > 0;
  },

  async create({ userId, startDateTime, endDateTime, purpose, bookingType = 'standard', status = 'pending' }) {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const startTimestamp = formatLocalTimestamp(start);
    const endTimestamp = formatLocalTimestamp(end);

    const result = await pool.query(
      `INSERT INTO bookings (user_id, start_datetime, end_datetime, purpose, booking_type, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id,
                 user_id,
                 to_char(start_datetime, 'YYYY-MM-DD"T"HH24:MI:SS') AS start_datetime,
                 to_char(end_datetime, 'YYYY-MM-DD"T"HH24:MI:SS') AS end_datetime,
                 purpose,
                 booking_type,
                 status,
                 created_at`,
      [userId, startTimestamp, endTimestamp, purpose, bookingType, status]
    );

    const booking = result.rows[0];
    const userResult = await pool.query('SELECT name AS user_name FROM users WHERE id = $1', [userId]);
    booking.user_name = userResult.rows[0]?.user_name || null;
    return booking;
  },

  async getById(id) {
    const result = await pool.query(
      `SELECT id,
              user_id,
              to_char(start_datetime, 'YYYY-MM-DD"T"HH24:MI:SS') AS start_datetime,
              to_char(end_datetime, 'YYYY-MM-DD"T"HH24:MI:SS') AS end_datetime,
              purpose,
              booking_type,
              status,
              created_at
       FROM bookings
       WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async remove(id) {
    const result = await pool.query('DELETE FROM bookings WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  },

  async update(id, updates) {
    const fields = [];
    const values = [];

    if (updates.startDateTime !== undefined) {
      fields.push(`start_datetime = $${fields.length + 1}`);
      values.push(updates.startDateTime);
    }

    if (updates.endDateTime !== undefined) {
      fields.push(`end_datetime = $${fields.length + 1}`);
      values.push(updates.endDateTime);
    }

    if (updates.purpose !== undefined) {
      fields.push(`purpose = $${fields.length + 1}`);
      values.push(updates.purpose);
    }

    if (updates.status !== undefined) {
      fields.push(`status = $${fields.length + 1}`);
      values.push(updates.status);
    }

    if (fields.length === 0) {
      return null;
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE bookings
       SET ${fields.join(', ')}
       WHERE id = $${values.length}
       RETURNING id,
                 user_id,
                 to_char(start_datetime, 'YYYY-MM-DD"T"HH24:MI:SS') AS start_datetime,
                 to_char(end_datetime, 'YYYY-MM-DD"T"HH24:MI:SS') AS end_datetime,
                 purpose,
                 booking_type,
                 status,
                 created_at`,
      values
    );

    if (result.rowCount === 0) {
      return null;
    }

    const booking = result.rows[0];
    const userResult = await pool.query('SELECT name AS user_name FROM users WHERE id = $1', [booking.user_id]);
    booking.user_name = userResult.rows[0]?.user_name || null;
    return booking;
  },
};

module.exports = Booking;
