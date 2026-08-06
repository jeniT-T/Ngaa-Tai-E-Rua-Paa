// backend/models/ContentItem.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const ContentItem = {
  // What a marae user sees: only items where their role is in visible_to_roles,
  // optionally filtered by search text and/or category.
  async findVisibleToRole(role, { search, category } = {}) {
    const conditions = ['$1 = ANY(visible_to_roles)'];
    const values = [role];

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(title ILIKE $${values.length} OR body ILIKE $${values.length})`);
    }
    if (category) {
      values.push(category);
      conditions.push(`category = $${values.length}`);
    }

    const result = await pool.query(
      `SELECT * FROM content_items WHERE ${conditions.join(' AND ')} ORDER BY category, title`,
      values
    );
    return result.rows;
  },

  async findDistinctCategories() {
    const result = await pool.query(
      'SELECT DISTINCT category FROM content_items ORDER BY category'
    );
    return result.rows.map((r) => r.category);
  },

  async findAll() {
    const result = await pool.query('SELECT * FROM content_items ORDER BY category, title');
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM content_items WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create({ title, body, category, visibleToRoles, createdBy }) {
    const result = await pool.query(
      `INSERT INTO content_items (title, body, category, visible_to_roles, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, body, category || 'general', visibleToRoles || ['member', 'caretaker', 'admin'], createdBy]
    );
    return result.rows[0];
  },

  async update(id, { title, body, category, visibleToRoles }) {
    const result = await pool.query(
      `UPDATE content_items SET
         title = COALESCE($1, title),
         body = COALESCE($2, body),
         category = COALESCE($3, category),
         visible_to_roles = COALESCE($4, visible_to_roles),
         updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title, body, category, visibleToRoles, id]
    );
    return result.rows[0] || null;
  },

  // "Move" = reassign category. Kept as its own method so the intent is explicit
  // in routes/logs, even though it's a subset of update().
  async move(id, category) {
    const result = await pool.query(
      `UPDATE content_items SET category = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [category, id]
    );
    return result.rows[0] || null;
  },

  // Duplicates an item, optionally into a different category. Title gets a
  // "(Copy)" suffix so it's obviously not the original in the list view.
  async copy(id, { category } = {}) {
    const original = await ContentItem.findById(id);
    if (!original) return null;

    const result = await pool.query(
      `INSERT INTO content_items (title, body, category, visible_to_roles, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        `${original.title} (Copy)`,
        original.body,
        category || original.category,
        original.visible_to_roles,
        original.created_by,
      ]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM content_items WHERE id = $1', [id]);
  },
};

module.exports = ContentItem;