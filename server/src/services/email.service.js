// ============================================================
// SafeED-UP — Email Service (Nodemailer)
// ============================================================
const nodemailer = require('nodemailer');
const env = require('../config/env');

// Create transporter (lazy init)
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

// ---- Email Templates ----

const emailBase = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SafeED-UP</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #1E3A5F; padding: 24px 32px; }
    .header h1 { color: #ffffff; margin: 0; font-size: 20px; }
    .header p { color: #a0b4c8; margin: 4px 0 0; font-size: 12px; }
    .body { padding: 32px; color: #1A2332; line-height: 1.6; }
    .btn { display: inline-block; background: #1E3A5F; color: #ffffff !important; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }
    .footer { background: #f4f6f9; padding: 16px 32px; text-align: center; font-size: 11px; color: #8A97A8; border-top: 1px solid #DDE3ED; }
    .alert { background: #fef3cd; border-left: 4px solid #D97706; padding: 12px 16px; border-radius: 4px; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SafeED-UP</h1>
      <p>Digital Safety &amp; Emergency Readiness Platform</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      This is an automated email from SafeED-UP. Do not reply to this email.<br>
      &copy; ${new Date().getFullYear()} SafeED-UP Government Digital Platform
    </div>
  </div>
</body>
</html>
`;

const sendEmail = async ({ to, subject, html }) => {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    console.warn('⚠️  SMTP not configured. Skipping email:', subject);
    return;
  }
  try {
    const info = await getTransporter().sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent: ${info.messageId} → ${to}`);
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err.message);
    throw err;
  }
};

const sendWelcomeEmail = async (user) => {
  const html = emailBase(`
    <h2>Welcome to SafeED-UP, ${user.name}!</h2>
    <p>Your account has been successfully created on the SafeED-UP Digital Safety & Emergency Readiness Platform.</p>
    <p><strong>Role:</strong> ${user.role.replace(/_/g, ' ')}</p>
    <p>You can now log in to your dashboard and begin managing safety compliance for your institution.</p>
    <a href="${env.CLIENT_URL}/auth/login" class="btn">Login to Dashboard</a>
    <div class="alert">
      <strong>Important:</strong> If you did not create this account, please contact the system administrator immediately.
    </div>
  `);
  await sendEmail({ to: user.email, subject: 'Welcome to SafeED-UP — Account Created', html });
};

const sendPasswordResetEmail = async (user, resetUrl) => {
  const html = emailBase(`
    <h2>Password Reset Request</h2>
    <p>Hello ${user.name},</p>
    <p>We received a request to reset your SafeED-UP account password. Click the button below to set a new password:</p>
    <a href="${resetUrl}" class="btn">Reset Password</a>
    <p>This link will expire in <strong>1 hour</strong>.</p>
    <div class="alert">
      <strong>Warning:</strong> If you did not request this, please ignore this email. Your password will remain unchanged.
    </div>
  `);
  await sendEmail({ to: user.email, subject: 'SafeED-UP — Password Reset Request', html });
};

const sendInspectionScheduledEmail = async (user, inspection, institution) => {
  const html = emailBase(`
    <h2>Inspection Scheduled</h2>
    <p>Hello ${user.name},</p>
    <p>An inspection has been scheduled for your institution:</p>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px;background:#f4f6f9;"><strong>Institution</strong></td><td style="padding:8px;">${institution.name}</td></tr>
      <tr><td style="padding:8px;background:#f4f6f9;"><strong>Inspection ID</strong></td><td style="padding:8px;">${inspection.inspectionId}</td></tr>
      <tr><td style="padding:8px;background:#f4f6f9;"><strong>Type</strong></td><td style="padding:8px;">${inspection.inspectionType.replace(/_/g, ' ')}</td></tr>
      <tr><td style="padding:8px;background:#f4f6f9;"><strong>Scheduled Date</strong></td><td style="padding:8px;">${new Date(inspection.scheduledDate).toLocaleDateString('en-IN')}</td></tr>
    </table>
    <p>Please ensure all documents and safety equipment are ready before the inspection date.</p>
    <a href="${env.CLIENT_URL}/dashboard/institution/compliance" class="btn">View Compliance Dashboard</a>
  `);
  await sendEmail({ to: user.email, subject: `SafeED-UP — Inspection Scheduled: ${inspection.inspectionId}`, html });
};

const sendDocumentExpiryReminderEmail = async (user, document, institution, daysLeft) => {
  const html = emailBase(`
    <h2>Document Expiry Reminder</h2>
    <p>Hello ${user.name},</p>
    <div class="alert">
      <strong>Action Required:</strong> A document for <strong>${institution.name}</strong> will expire in <strong>${daysLeft} days</strong>.
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px;background:#f4f6f9;"><strong>Document</strong></td><td style="padding:8px;">${document.title}</td></tr>
      <tr><td style="padding:8px;background:#f4f6f9;"><strong>Type</strong></td><td style="padding:8px;">${document.documentType.replace(/_/g, ' ')}</td></tr>
      <tr><td style="padding:8px;background:#f4f6f9;"><strong>Expiry Date</strong></td><td style="padding:8px;">${new Date(document.expiryDate).toLocaleDateString('en-IN')}</td></tr>
    </table>
    <p>Please upload the renewed document before it expires to maintain compliance.</p>
    <a href="${env.CLIENT_URL}/dashboard/institution/documents" class="btn">Manage Documents</a>
  `);
  await sendEmail({
    to: user.email,
    subject: `SafeED-UP — Document Expiry Alert: ${document.title} (${daysLeft} days remaining)`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendInspectionScheduledEmail,
  sendDocumentExpiryReminderEmail,
};
