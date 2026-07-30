require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function waitForDatabase(maxRetries = 20, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      console.log(`Database not ready yet (attempt ${attempt}/${maxRetries}). Retrying...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function ensureUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'member',
      name VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

async function ensureBookingsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      start_datetime TIMESTAMP NOT NULL,
      end_datetime TIMESTAMP NOT NULL,
      purpose TEXT NOT NULL,
      booking_type VARCHAR(20) NOT NULL DEFAULT 'standard',
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      admin_notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT valid_date_range CHECK (end_datetime > start_datetime)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_datetime, end_datetime);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON bookings(user_id, status);
  `);
}

async function ensureDefaultAdmin() {
  const email = process.env.CREATE_ADMIN_EMAIL;
  const password = process.env.CREATE_ADMIN_PASSWORD;
  const name = process.env.CREATE_ADMIN_NAME || 'Admin';

  if (!email || !password) {
    return;
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rowCount > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO users (email, password_hash, role, name)
     VALUES ($1, $2, $3, $4)`,
    [email, passwordHash, 'admin', name]
  );
}

async function initDb() {
  await waitForDatabase();
  await ensureUsersTable();
  await ensureBookingsTable();
  await ensureDefaultAdmin();
}

if (require.main === module) {
  initDb()
    .then(() => {
      console.log('Database initialized successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database initialization failed', err);
      process.exit(1);
    });
}

module.exports = initDb;
