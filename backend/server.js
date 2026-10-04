// backend/server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const bookingRoutes = require('./routes/bookings');
const contentRoutes = require('./routes/content');
const issueRoutes = require('./routes/issues');
const checklistRoutes = require('./routes/checklists');
const settingsRoutes = require('./routes/settings');
const caretakerTaskRoutes = require('./routes/caretakerTasks');

const app = express();

// Dev setups get opened from more than one address — localhost on the same
// machine, or a LAN IP (http://192.168.x.x:3000) when testing from another
// device on the network. Cookies only travel between requests that share
// the same host, so the frontend must be reached through the same
// host:port pair its own API calls use (frontend/src/**: API_BASE now
// follows window.location.hostname) — CORS has to allow whichever of those
// addresses the request is actually coming from, not just one fixed one.
// FRONTEND_URL is still honoured first for a real deployment; this regex
// only covers the dev-style addresses (localhost/127.0.0.1/private LAN IPs
// on port 3000) so it doesn't loosen anything for production.
const DEV_ORIGIN_PATTERN = /^http:\/\/(localhost|127\.0\.0\.1|(10|172\.(1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}):3000$/;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // same-origin / non-browser requests (curl, server-to-server)
      if (origin === process.env.FRONTEND_URL) return callback(null, true);
      // Always allow the dev-style pattern too, on top of FRONTEND_URL (not
      // instead of it) — the two act as a whitelist together, so switching
      // between "http://localhost:3000" and "http://192.168.x.x:3000"
      // never needs an env change. A real production FRONTEND_URL (a real
      // domain, not localhost/a private IP) will never match this regex,
      // so it doesn't loosen anything there.
      if (DEV_ORIGIN_PATTERN.test(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);

// Admin-uploaded content images (see backend/routes/content.js's POST
// /upload) — served as plain static files, referenced by content_items.
// image_url as "/uploads/<filename>".
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/caretaker-tasks', caretakerTaskRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
