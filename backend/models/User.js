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