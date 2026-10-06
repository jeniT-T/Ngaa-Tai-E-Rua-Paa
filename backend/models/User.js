const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // e.g. postgres://user:pass@localhost:5432/marae
});

const User = {
  async findByEmail(email) {
    const result = await pool.query(
      'SELECT id, email, password_hash, role, name, created_at FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await pool.query(
      'SELECT id, email, role, name, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async create({ email, passwordHash, role = 'member', name }) {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, name, created_at`,
      [email, passwordHash, role, name]
    );
    return result.rows[0];
  },

  async findAll() {
    const result = await pool.query(
      'SELECT id, email, role, name, created_at FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  },

  async updateRole(id, role) {
    const result = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2
       RETURNING id, email, role, name, created_at`,
      [role, id]
    );
    return result.rows[0] || null;
  },

  async delete(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const existing = await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [id]);
      if (!existing.rows.length) {
        await client.query('ROLLBACK');
        return null;
      }
      // Preserve shared records while removing references to their author.
      for (const table of ['content_items', 'checklists', 'caretaker_tasks', 'equipment_items']) {
        const exists = await client.query('SELECT to_regclass($1) AS table_name', [table]);
        if (!exists.rows[0]?.table_name) continue;
        await client.query(`UPDATE ${table} SET created_by = NULL WHERE created_by = $1`, [id]);
      }
      const reviews = await client.query("SELECT to_regclass('booking_reviews') AS table_name");
      if (reviews.rows[0]?.table_name) {
        await client.query('UPDATE booking_reviews SET manager_reviewed_by = NULL WHERE manager_reviewed_by = $1', [id]);
      }
      // Owned bookings, their reviews, and issues cascade on account deletion.
      const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
      await client.query('COMMIT');
      return result.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // --- Password reset ---

  async setResetToken(id, token, expiresAt) {
    const result = await pool.query(
      `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3
       RETURNING id, email, name`,
      [token, expiresAt, id]
    );
    return result.rows[0] || null;
  },

  // Only matches if the token hasn't expired yet — callers don't need to
  // separately check expiry.
  async findByValidResetToken(token) {
    const result = await pool.query(
      `SELECT id, email, role, name FROM users
       WHERE reset_token = $1 AND reset_token_expires > NOW()`,
      [token]
    );
    return result.rows[0] || null;
  },

  // Sets a new password hash and clears the reset token so it can't be reused.
  async updatePassword(id, passwordHash) {
    const result = await pool.query(
      `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL
       WHERE id = $2
       RETURNING id, email, role, name`,
      [passwordHash, id]
    );
    return result.rows[0] || null;
  },
};

module.exports = User;
