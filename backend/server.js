// backend/server.js
const fs = require('fs');
const path = require('path');
// The .env file lives in the project root (next to README.md), so load it from
// there no matter which folder node is started from.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
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
const equipmentRoutes = require('./routes/equipment');
const rateLimit = require('express-rate-limit');


const app = express();

app.set('trust proxy', 1);

const DEV_ORIGIN_PATTERN = /^http:\/\/(localhost|127\.0\.0\.1|(10|172\.(1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}):3000$/;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // same-origin / non-browser requests (curl, server-to-server)
      if (origin === process.env.FRONTEND_URL) return callback(null, true);
      
      if (DEV_ORIGIN_PATTERN.test(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     limit: 20,
     standardHeaders: true,
     legacyHeaders: false,
     message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
   });
   app.use(
     ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password'],
     authLimiter
   );

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/caretaker-tasks', caretakerTaskRoutes);
app.use('/api/equipment', equipmentRoutes);

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
  app.use(express.static(frontendDist));
  // Any other GET that isn't an API/upload call is a client-side route
  // (e.g. /arrival, /manager/bookings): hand it to React Router.
  app.get(/^\/(?!api\/|uploads\/).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
