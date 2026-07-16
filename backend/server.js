// backend/server.js
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const requireAuth = require('./middleware/requireAuth');
const requireRole = require('./middleware/requireRole');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite default port
    credentials: true, // allows the httpOnly cookie to be sent/received
  })
);

// --- Auth routes (login, logout, register, me) ---
app.use('/api/auth', authRoutes);

// --- Admin routes (list/create users, change roles) ---
// requireAuth + requireRole('admin') are applied inside admin.js itself
app.use('/api/admin', adminRoutes);

// --- Example protected routes, showing the pattern for each role ---

// Members (and admins) can create bookings
app.post('/api/bookings', requireAuth, requireRole('member', 'admin'), (req, res) => {
  // TODO: replace with real bookings controller
  res.json({ message: `Booking created by ${req.user.name}` });
});

// Caretakers (and admins) can view/update checklists
app.get('/api/caretaker/checklists', requireAuth, requireRole('caretaker', 'admin'), (req, res) => {
  // TODO: replace with real checklist controller
  res.json({ message: `Checklists for ${req.user.name}` });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));

