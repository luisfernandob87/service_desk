const { Notification, User } = require('../models');
const emailService = require('./emailService');

exports.createNotification = async ({ user_id, type, title, message, link }) => {
  const notification = await Notification.create({ user_id, type, title, message, link });

  const user = await User.findByPk(user_id);
  if (user?.email) {
    await emailService.sendEmail({
      to: user.email,
      subject: `[Service Desk] ${title}`,
      html: `<p>${message || title}</p>${link ? `<p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}${link}">Ver más</a></p>` : ''}`,
    });
  }

  return notification;
};
