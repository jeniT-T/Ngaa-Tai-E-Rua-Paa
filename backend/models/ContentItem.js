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

  // Public, unauthenticated content for a marketing page (home/history/
  // facilities/events/...). No role filtering — anyone can see these.
  // Heading blocks (the page's title/intro) come first, then sections in
  // the order they were created.
  async findByPlacement(page) {
    const result = await pool.query(
      `SELECT * FROM content_items
       WHERE placement = $1
       ORDER BY CASE block_type WHEN 'heading' THEN 0 ELSE 1 END, created_at ASC`,
      [page]
    );
    return result.rows;
  },

  async findAll() {
    const result = await pool.query('SELECT * FROM content_items ORDER BY category, title');
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM content_items WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  // placement: null/undefined = internal content library item (unchanged
  // existing behaviour). A page slug ('home' | 'history' | 'facilities' |
  // 'events') = a block rendered on that public page instead.
  // blockType: 'heading' (the page's title/intro, at most one really makes
  // sense per page) or 'section' (a card in the list below it).
  async create({ title, body, category, visibleToRoles, createdBy, placement, blockType }) {
    const result = await pool.query(
      `INSERT INTO content_items
         (title, body, category, visible_to_roles, created_by, placement, block_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        title,
        body,
        category || 'general',
        visibleToRoles || ['member', 'caretaker', 'admin'],
        createdBy,
        placement || null,
        blockType || 'section',
      ]
    );
    return result.rows[0];
  },

  // Note: placement is always written as-given (not COALESCEd) — the route
  // layer always resolves it to either a page slug or null before calling
  // this, so admins can explicitly move an item back to "library only".
  async update(id, { title, body, category, visibleToRoles, placement, blockType }) {
    const result = await pool.query(
      `UPDATE content_items SET
         title = COALESCE($1, title),
         body = COALESCE($2, body),
         category = COALESCE($3, category),
         visible_to_roles = COALESCE($4, visible_to_roles),
         placement = $5,
         block_type = COALESCE($6, block_type),
         updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [title, body, category, visibleToRoles, placement, blockType, id]
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
      `INSERT INTO content_items
         (title, body, category, visible_to_roles, created_by, placement, block_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        `${original.title} (Copy)`,
        original.body,
        category || original.category,
        original.visible_to_roles,
        original.created_by,
        original.placement,
        original.block_type,
      ]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM content_items WHERE id = $1', [id]);
  },
};

module.exports = ContentItem;