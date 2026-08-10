const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const VALID_GROUPS = ['equipment', 'cleaning', 'facilities'];

const ArrivalItem = {
  VALID_GROUPS,

  async ensureTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS arrival_items (
        id SERIAL PRIMARY KEY,
        item_key VARCHAR(100) UNIQUE NOT NULL,
        group_key VARCHAR(20) NOT NULL
          CHECK (group_key IN ('equipment', 'cleaning', 'facilities')),
        title VARCHAR(255) NOT NULL,
        color VARCHAR(20) NOT NULL DEFAULT '#2c3e50',
        body TEXT NOT NULL DEFAULT '',
        youtube_url TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_arrival_items_group ON arrival_items(group_key, sort_order);
    `);
  },

  async seedIfEmpty(items) {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM arrival_items');
    if (rows[0].count > 0) return;

    for (const item of items) {
      await pool.query(
        `INSERT INTO arrival_items (item_key, group_key, title, color, body, youtube_url, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (item_key) DO NOTHING`,
        [item.itemKey, item.groupKey, item.title, item.color, item.body, item.youtubeUrl || null, item.sortOrder || 0]
      );
    }
  },

  async findAll() {
    const result = await pool.query(
      'SELECT id, item_key, group_key, title, color, body, youtube_url, sort_order, created_at, updated_at FROM arrival_items ORDER BY group_key, sort_order, id'
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query(
      'SELECT id, item_key, group_key, title, color, body, youtube_url, sort_order, created_at, updated_at FROM arrival_items WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async create({ itemKey, groupKey, title, color, body, youtubeUrl, sortOrder }) {
    const result = await pool.query(
      `INSERT INTO arrival_items (item_key, group_key, title, color, body, youtube_url, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, item_key, group_key, title, color, body, youtube_url, sort_order, created_at, updated_at`,
      [itemKey, groupKey, title, color || '#2c3e50', body || '', youtubeUrl || null, sortOrder || 0]
    );
    return result.rows[0];
  },

  async update(id, { title, color, body, youtubeUrl, groupKey, sortOrder }) {
    const result = await pool.query(
      `UPDATE arrival_items
       SET title = COALESCE($1, title),
           color = COALESCE($2, color),
           body = COALESCE($3, body),
           youtube_url = $4,
           group_key = COALESCE($5, group_key),
           sort_order = COALESCE($6, sort_order),
           updated_at = NOW()
       WHERE id = $7
       RETURNING id, item_key, group_key, title, color, body, youtube_url, sort_order, created_at, updated_at`,
      [title, color, body, youtubeUrl || null, groupKey, sortOrder, id]
    );
    return result.rows[0] || null;
  },

  async remove(id) {
    const result = await pool.query('DELETE FROM arrival_items WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  },
};

module.exports = ArrivalItem;
