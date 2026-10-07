
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const DEFAULT_ASSIGNED_ROLES = ['member', 'caretaker', 'manager', 'admin'];

const Checklist = {
  async defaultTemplate() {
    const result = await pool.query('SELECT body FROM default_booking_checklist WHERE id = 1');
    return result.rows[0] || { body: '' };
  },
  async saveDefaultTemplate(body) {
    const result = await pool.query('UPDATE default_booking_checklist SET body = $1, updated_at = NOW() WHERE id = 1 RETURNING body', [body]);
    return result.rows[0];
  },
  async completionBookings(user) {
    const result = await pool.query(
      `SELECT b.id, b.start_date, b.end_date, b.purpose, u.name AS requester_name
       FROM bookings b JOIN users u ON u.id = b.user_id
       WHERE b.status = 'approved' AND ($1::boolean OR
         (b.user_id = $2 AND b.end_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Pacific/Auckland')::date))
       ORDER BY b.end_date DESC`, [user.role !== 'member', user.id]);
    return result.rows;
  },

  async completions(bookingId) {
    const result = await pool.query('SELECT * FROM checklist_completions WHERE booking_id = $1 ORDER BY completed_at DESC', [bookingId]);
    return result.rows;
  },

  async complete({ bookingId, checklist, user }) {
    const result = await pool.query(
      `INSERT INTO checklist_completions (booking_id, checklist_id, checklist_title, completed_by, completed_by_name, items)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       ON CONFLICT (booking_id, checklist_id) DO NOTHING RETURNING *`,
      [bookingId, checklist.id, checklist.title, user.id, user.name,
       JSON.stringify(checklist.items.map(({ id, text }) => ({ id, text })))]);
    return result.rows[0] || null;
  },

  async findAll(roles, userId = null, bookingId = null) {
    const result = await pool.query(
      `SELECT
         c.id, c.title, c.description, c.booking_id, c.assigned_roles, c.created_by, c.created_at, c.updated_at,
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
       WHERE ($1::text[] IS NULL OR c.assigned_roles && $1::text[])
         AND (c.booking_id IS NULL OR ($3::integer IS NOT NULL AND c.booking_id = $3) OR
           ($3::integer IS NULL AND ($2::integer IS NULL OR EXISTS (
             SELECT 1 FROM bookings b WHERE b.id = c.booking_id AND b.user_id = $2))))
       GROUP BY c.id, u.name
       ORDER BY c.created_at DESC`,
      [roles || null, userId, bookingId]
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
         c.id, c.title, c.description, c.booking_id, c.assigned_roles, c.created_by, c.created_at, c.updated_at,
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

  async create({ title, description, assignedRoles = DEFAULT_ASSIGNED_ROLES, createdBy, items = [] }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const checklistResult = await client.query(
        `INSERT INTO checklists (title, description, assigned_roles, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [title, description || null, assignedRoles, createdBy]
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

  async update(id, { title, description, assignedRoles }) {
    const result = await pool.query(
      `UPDATE checklists SET
         title = $1,
         description = $2,
         assigned_roles = COALESCE($3::text[], assigned_roles),
         updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [title, description || null, assignedRoles ?? null, id]
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
