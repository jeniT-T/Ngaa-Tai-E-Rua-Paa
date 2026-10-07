// Bootstrap an Admin or Manager; role defaults to admin.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function main() {
  const [, , name, email, password, role = 'admin'] = process.argv;

  if (!name || !email || !password) {
    console.error('Usage: node scripts/createAdmin.js "Name" email password [admin|manager]');
    process.exit(1);
  }

  if (!['admin', 'manager'].includes(role)) {
    console.error('Bootstrap role must be admin or manager.');
    process.exit(1);
  }

  const existing = await User.findByEmail(email);
  if (existing) {
    console.error(`A user with email ${email} already exists (role: ${existing.role}).`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash, role, name });

  console.log(`${role} account created:`, user);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});