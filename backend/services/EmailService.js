const nodemailer = require('nodemailer');

let cachedTransporter = null;
let warnedMissingConfig = false;

function buildTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '0', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    if (!warnedMissingConfig) {
      warnedMissingConfig = true;
      console.warn('[EmailService] SMTP is not configured. OTP emails will be logged to the backend console instead of being sent.');
    }
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  return cachedTransporter;
}

async function sendEmail({ to, subject, text, html }) {
  const transporter = buildTransporter();
  if (!transporter) {
    // Fallback for dev environments where SMTP isn't configured.
    console.log(`[EmailService] Email to ${to} (${subject})`);
    console.log(text || html || '');
    return { delivered: false, preview: true };
  }

  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html
  });
}

async function sendOtpEmail(email, otpCode, purpose) {
  const purposeLabel = {
    signup: 'Sign up verification',
    login: 'Login verification',
    reset: 'Password reset'
  }[purpose] || 'Verification';

  const text = `Your ${purposeLabel} OTP is ${otpCode}. It expires in ${process.env.OTP_TTL_MINUTES || 10} minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
      <h2 style="margin: 0 0 12px;">${purposeLabel}</h2>
      <p style="margin: 0 0 12px;">Use the OTP below to continue:</p>
      <div style="font-size: 24px; font-weight: 700; letter-spacing: 4px; background: #f3f4f6; padding: 12px 18px; display: inline-block; border-radius: 8px;">
        ${otpCode}
      </div>
      <p style="margin: 16px 0 0;">This code expires in ${process.env.OTP_TTL_MINUTES || 10} minutes.</p>
    </div>
  `;

  return sendEmail({ to: email, subject: `${purposeLabel} OTP`, text, html });
}

module.exports = {
  sendEmail,
  sendOtpEmail
};
