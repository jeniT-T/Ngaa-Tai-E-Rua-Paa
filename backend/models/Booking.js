// backend/models/Booking.js
const crypto = require('crypto');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const Booking = {
  // status: defaults to 'pending' (the normal self-serve request flow) but a
  // manager creating a booking on a customer's behalf can pass 'approved'
  // directly — see POST /api/bookings, where only a manager is allowed to
  // set this at all.
  async create({ userId, startDate, endDate, purpose, bookingType = 'standard', whakapapa = false, area = 'general', status = 'pending' }) {
    // Unguessable per-booking token — this is what lets guests who aren't
    // the account holder reach arrival info via a shared link/QR code with
    // no login of their own. See GET /api/bookings/guest/:token.
    const guestAccessToken = crypto.randomBytes(24).toString('hex');

    const result = await pool.query(
      `INSERT INTO bookings (user_id, start_date, end_date, purpose, booking_type, whakapapa, area, guest_access_token, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, startDate, endDate, purpose, bookingType, whakapapa, area, guestAccessToken, status]
    );
    return result.rows[0];
  },

  // Looked up by the public "share this booking's arrival info" link/QR
  // code — deliberately returns nothing about the account holder (no name,
  // no email, no user_id) since anyone with the link can call this.
  async findByGuestToken(token) {
    const result = await pool.query(
      `SELECT id, start_date, end_date, status, area, booking_type, purpose
       FROM bookings WHERE guest_access_token = $1`,
      [token]
    );
    return result.rows[0] || null;
  },

  // Date ranges for bookings that could still occupy the marae — used to
  // gray out unavailable days on the booking calendar. 'approved' bookings
  // are hard-blocked; 'pending' ones are returned too so the frontend can
  // flag them as tentative without necessarily disabling them. Denied and
  // cancelled bookings never block anything. excludeId lets an owner editing
  // their own booking see the calendar without their own dates blocking them.
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

  // Approved bookings with enough detail (purpose/type/area, not just dates)
  // to show on the caretaker's own task calendar/schedule — so staff can
  // see at a glance when the marae itself is occupied by a booking, not
  // just each other's tasks. See GET /api/bookings/calendar.
  async findApprovedForCalendar() {
    const result = await pool.query(
      `SELECT id, start_date, end_date, purpose, booking_type, area
       FROM bookings WHERE status = 'approved' ORDER BY start_date`
    );
    return result.rows;
  },

  // The one approved booking (if any) whose date range covers *today*
  // specifically -- not "hasn't ended yet" like findActiveRanges/the
  // per-token guest check below use, which also count a future approved
  // booking as fine. Backs the generic, non-booking-specific guest QR code
  // the client can post physically around the marae itself (as opposed to
  // the per-booking link/QR, which is personal to one booking and shared
  // digitally) -- see GET /api/bookings/guest-active. That generic code is
  // only meant to work while someone is actually in residence, so this is
  // deliberately a stricter check than the ones elsewhere in this file.
  async findCurrentlyOnSite() {
    const result = await pool.query(
      `SELECT id, start_date, end_date FROM bookings
       WHERE status = 'approved' AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE
       ORDER BY start_date LIMIT 1`
    );
    return result.rows[0] || null;
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
