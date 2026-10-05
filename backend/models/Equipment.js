// backend/models/Equipment.js
//
// Equipment inventory (S36) — deliberately lean: just name + condition per
// item. See database/migration_equipment.sql for the full rationale.
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Maps the API's camelCase field names to their actual column names.
const COLUMNS = {
  name: 'name',
  condition: 'condition',
};

const Equipment = {
  async findAll() {
    const result = await pool.query(
      'SELECT * FROM equipment_items ORDER BY name'
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM equipment_items WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create({ name, condition, createdBy }) {
    const result = await pool.query(
      `INSERT INTO equipment_items (name, condition, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, condition || 'Good', createdBy || null]
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
      `UPDATE equipment_items SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id) {
    await pool.query('DELETE FROM equipment_items WHERE id = $1', [id]);
  },
};

module.exports = Equipment;
