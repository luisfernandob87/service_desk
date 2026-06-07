const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025'),
  secure: false,
  ignoreTLS: true,
});

exports.sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_HOST) return;
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@servicedesk.local',
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Email send error:', err.message);
  }
};
