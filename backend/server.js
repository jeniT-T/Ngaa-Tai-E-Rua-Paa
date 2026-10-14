// backend/server.js
const path = require('path');
// The .env file lives in the project root (next to README.md), so load it from
// there no matter which folder node is started from.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { assertJwtSecret } = require('./utils/jwt');

// Stop at start-up if the login secret is missing (code review CR-10).
try {
  assertJwtSecret();
} catch (err) {
  console.error(`${err.message}. Copy .env.example to .env in the project root and set it (see README).`);
  process.exit(1);
}

const app = require('./app');

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
