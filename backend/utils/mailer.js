// backend/utils/mailer.js
//
// Thin wrapper around Nodemailer so the rest of the app just calls
// sendEmail({ to, subject, text, html }) without caring where mail actually
// goes.
//
// Local dev: points at Mailpit (see docker-compose.yml), an open-source SMTP
// catcher that never sends anything to the real internet — it just captures
// mail in a web inbox at http://localhost:8025 so you can see it land.
//
// Production: point SMTP_HOST/PORT/USER/PASS at a real provider (Gmail SMTP
// with an app password, or a transactional service like Resend/Mailgun/SES).
// No code changes needed — just different env vars.
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mailpit',
  port: Number(process.env.SMTP_PORT) || 1025,
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

const FROM_ADDRESS = process.env.EMAIL_FROM || 'Marae System <no-reply@marae.local>';

async function sendEmail({ to, subject, text, html }) {
  try {
    await transporter.sendMail({ from: FROM_ADDRESS, to, subject, text, html });
  } catch (err) {
    // Email is best-effort — a delivery failure shouldn't fail the request
    // that triggered it (e.g. a booking approval should still succeed even
    // if the notification email couldn't go out).
    console.error(`[mailer] Failed to send email to ${to}:`, err.message);
  }
}

module.exports = { sendEmail };
