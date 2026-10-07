// backend/models/Issue.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const Issue = {
  async create({ userId, subject, message }) {
    const result = await pool.query(
      `INSERT INTO issues (user_id, subject, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, subject, message]
    );
    return result.rows[0];
  },

  async findAll() {
    const result = await pool.query(
      `SELECT issues.*, users.name AS reporter_name, users.email AS reporter_email
       FROM issues
       JOIN users ON users.id = issues.user_id
       ORDER BY
         CASE status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
         created_at DESC`
    );
    return result.rows;
  },

  async updateStatus(id, status, completionNotes) {
    const result = await pool.query(
      `UPDATE issues SET status = COALESCE($1, status), completion_notes = COALESCE($3, completion_notes) WHERE id = $2 RETURNING *`,
      [status ?? null, id, completionNotes ?? null]
    );
    return result.rows[0] || null;
  },
  async delete(id) {
    const result = await pool.query('DELETE FROM issues WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },
};

module.exports = Issue;