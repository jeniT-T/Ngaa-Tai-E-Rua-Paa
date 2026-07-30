// backend/server.js
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const requireAuth = require('./middleware/requireAuth');
const requireRole = require('./middleware/requireRole');
const initDb = require('./scripts/initDb');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Allow the frontend app to call this backend during development.
// The app is served from localhost:3000 in the current setup,
// but we also keep localhost:5173 for Vite defaults or alternate dev ports.
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // If the request has no origin (server-to-server or same-origin), allow it.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy does not allow this origin'));
      }
    },
    credentials: true, // allows the httpOnly cookie to be sent/received
  })
);

// --- Auth routes (login, logout, register, me) ---
app.use('/api/auth', authRoutes);

// --- Admin routes (list/create users, change roles) ---
// requireAuth + requireRole('admin') are applied inside admin.js itself
app.use('/api/admin', adminRoutes);

// Booking API
app.use('/api/bookings', require('./routes/bookings'));

// Caretakers (and admins) can view/update checklists
app.get('/api/caretaker/checklists', requireAuth, requireRole('caretaker', 'admin'), (req, res) => {
  // TODO: replace with real checklist controller
  res.json({ message: `Checklists for ${req.user.name}` });
});

const PORT = process.env.PORT || 4000;

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to initialize database', err);
    process.exit(1);
  });

