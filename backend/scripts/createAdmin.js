// backend/scripts/createAdmin.js
//
// Run this ONCE, manually, to create your very first admin account
// (since admin accounts are normally created by an existing admin,
// and you don't have one yet).
//
// Usage:
//   node scripts/createAdmin.js "Your Name" your@email.com yourPassword123
//
// After this runs, log in as this account and use the Manage Users page
// to promote/create further caretaker or admin accounts. You do not need
// to keep this script around, but it's safe to leave it — it will refuse
// to run if the email already exists.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function main() {
  const [, , name, email, password] = process.argv;

  if (!name || !email || !password) {
    console.error('Usage: node scripts/createAdmin.js "Name" email password');
    process.exit(1);
  }

  const existing = await User.findByEmail(email);
  if (existing) {
    console.error(`A user with email ${email} already exists (role: ${existing.role}).`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash, role: 'admin', name });

  console.log('Admin account created:', user);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});