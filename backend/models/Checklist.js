
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const Checklist = {

  async findAll() {
    const result = await pool.query(
      `SELECT
         c.id, c.title, c.description, c.created_by, c.created_at, c.updated_at,
         u.name AS created_by_name,
         COALESCE(
           json_agg(
             json_build_object(
               'id', i.id, 'text', i.text, 'position', i.position, 'is_done', i.is_done
             ) ORDER BY i.position, i.id
           ) FILTER (WHERE i.id IS NOT NULL),
           '[]'
         ) AS items
       FROM checklists c
       LEFT JOIN users u ON u.id = c.created_by
       LEFT JOIN checklist_items i ON i.checklist_id = c.id
       GROUP BY c.id, u.name
       ORDER BY c.created_at DESC`
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM checklists WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async getWithItems(id) {
    const result = await pool.query(
      `SELECT
         c.id, c.title, c.description, c.created_by, c.created_at, c.updated_at,
         u.name AS created_by_name,
         COALESCE(
           json_agg(
             json_build_object(
               'id', i.id, 'text', i.text, 'position', i.position, 'is_done', i.is_done
             ) ORDER BY i.position, i.id
           ) FILTER (WHERE i.id IS NOT NULL),
           '[]'
         ) AS items
       FROM checklists c
       LEFT JOIN users u ON u.id = c.created_by
       LEFT JOIN checklist_items i ON i.checklist_id = c.id
       WHERE c.id = $1
       GROUP BY c.id, u.name`,
      [id]
    );
    return result.rows[0] || null;
  },

  async create({ title, description, createdBy, items = [] }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const checklistResult = await client.query(
        `INSERT INTO checklists (title, description, created_by)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [title, description || null, createdBy]
      );
      const checklist = checklistResult.rows[0];

      for (let position = 0; position < items.length; position++) {
        const text = items[position];
        if (!text || !text.trim()) continue;
        await client.query(
          `INSERT INTO checklist_items (checklist_id, text, position)
           VALUES ($1, $2, $3)`,
          [checklist.id, text.trim(), position]
        );
      }

      await client.query('COMMIT');
      return checklist.id;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async update(id, { title, description }) {
    const result = await pool.query(
      `UPDATE checklists SET title = $1, description = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [title, description || null, id]
    );
    return result.rows[0] || null;
  },

  async delete(id) {
    const result = await pool.query('DELETE FROM checklists WHERE id = $1 RETURNING id', [id]);
    return result.rows.length > 0;
  },

  async addItem(checklistId, text) {
    const positionResult = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM checklist_items WHERE checklist_id = $1',
      [checklistId]
    );
    const result = await pool.query(
      `INSERT INTO checklist_items (checklist_id, text, position)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [checklistId, text.trim(), positionResult.rows[0].next]
    );
    return result.rows[0];
  },

  async updateItem(itemId, { text, isDone }) {
    const result = await pool.query(
      `UPDATE checklist_items SET
         text = COALESCE($1, text),
         is_done = COALESCE($2, is_done),
         updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [text !== undefined ? text : null, isDone !== undefined ? isDone : null, itemId]
    );
    return result.rows[0] || null;
  },

  async deleteItem(itemId) {
    const result = await pool.query(
      'DELETE FROM checklist_items WHERE id = $1 RETURNING id',
      [itemId]
    );
    return result.rows.length > 0;
  },

  async itemBelongsToChecklist(itemId, checklistId) {
    const result = await pool.query(
      'SELECT id FROM checklist_items WHERE id = $1 AND checklist_id = $2',
      [itemId, checklistId]
    );
    return result.rows.length > 0;
  },
};

module.exports = Checklist;
