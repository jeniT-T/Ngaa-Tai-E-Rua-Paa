const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mailpit',
  port: Number(process.env.SMTP_PORT) || 1025,
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

const FROM_ADDRESS = process.env.EMAIL_FROM || 'Manage My Marae <no-reply@marae.local>';

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
