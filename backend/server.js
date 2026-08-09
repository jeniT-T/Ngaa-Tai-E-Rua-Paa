// backend/server.js
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const bookingRoutes = require('./routes/bookings');
const contentRoutes = require('./routes/content');
const issueRoutes = require('./routes/issues');
const arrivalItemsRoutes = require('./routes/arrivalItems');
const requireAuth = require('./middleware/requireAuth');
const requireRole = require('./middleware/requireRole');
const ArrivalItem = require('./models/ArrivalItem');
const arrivalSeed = require('./scripts/arrivalSeed');

const app = express();

app.use(express.json());
app.use(cookieParser());
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy does not allow access from origin ${origin}`));
      }
    },
    credentials: true,
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/issues', issueRoutes);

// --- Arrival items (editable content shown on /arrival) ---
// No access control currently - open to anyone.
app.use('/api/arrival-items', arrivalItemsRoutes);

// --- Example protected routes, showing the pattern for each role ---

// Caretakers (and admins) can view/update checklists
app.get('/api/caretaker/checklists', requireAuth, requireRole('caretaker', 'admin'), (req, res) => {
  // TODO: replace with real checklist controller
  res.json({ message: `Checklists for ${req.user.name}` });
});

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await ArrivalItem.ensureTable();
    await ArrivalItem.seedIfEmpty(arrivalSeed);
  } catch (err) {
    console.error('Failed to initialize arrival_items table:', err);
  }

  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
}

start();
