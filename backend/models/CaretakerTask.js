// backend/models/CaretakerTask.js
//
// The caretaker's own task calendar/schedule — previously per-browser
// localStorage (frontend/src/context/TaskContext.jsx), now a real shared
// table so caretaker and manager see and work from the same list. See
// database/migration_caretaker_tasks.sql for the full rationale.
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Maps the API's camelCase field names to their actual column names.
const COLUMNS = {
  title: 'title',
  date: 'date',
  startTime: 'start_time',
  endTime: 'end_time',
  urgency: 'urgency',
  notes: 'notes',
  completed: 'completed',
};

const CaretakerTask = {
  async findAll() {
    const result = await pool.query(
      'SELECT * FROM caretaker_tasks ORDER BY date, start_time'
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM caretaker_tasks WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create({ title, date, startTime, endTime, urgency, notes, createdBy }) {
    const result = await pool.query(
      `INSERT INTO caretaker_tasks (title, date, start_time, end_time, urgency, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, date, startTime || null, endTime || null, urgency || 'medium', notes || null, createdBy || null]
    );
    return result.rows[0];
  },

  // Partial update — only the keys actually passed in `fields` are changed.
  async update(id, fields) {
    const sets = [];
    const values = [];
    let i = 1;
    for (const [key, column] of Object.entries(COLUMNS)) {
      if (fields[key] === undefined) continue;
      sets.push(`${column} = $${i}`);
      values.push(fields[key]);
      i += 1;
    }

    if (sets.length === 0) {
      return this.findById(id);
    }

    sets.push('updated_at = NOW()');
    values.push(id);
    const result = await pool.query(
      `UPDATE caretaker_tasks SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async setCompleted(id, completed) {
    const result = await pool.query(
      'UPDATE caretaker_tasks SET completed = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [completed, id]
    );
    return result.rows[0] || null;
  },

  async delete(id) {
    await pool.query('DELETE FROM caretaker_tasks WHERE id = $1', [id]);
  },
};

module.exports = CaretakerTask;
