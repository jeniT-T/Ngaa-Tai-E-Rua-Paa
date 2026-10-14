const nodemailer = require('nodemailer');

// Email is sent through the SMTP server named in the SMTP_* variables (see
// .env.example). If SMTP_HOST is not set, nothing is sent: outside production
// the message is printed in the backend terminal instead, so a password-reset
// link can be copied while developing without any mail server.
const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    })
  : null;

const FROM_ADDRESS = process.env.EMAIL_FROM || 'Manage My Marae <no-reply@example.com>';

async function sendEmail({ to, subject, text, html }) {
  if (!transporter) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`[mailer] SMTP_HOST is not set, so no email was sent to ${to}`);
    } else {
      console.log(`[mailer] SMTP_HOST is not set; email not sent.\nTo: ${to}\nSubject: ${subject}\n${text || '(HTML-only message)'}`);
    }
    return;
  }
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
