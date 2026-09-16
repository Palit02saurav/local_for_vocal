const { Notification } = require('../models');

/**
 * Create a notification for a given recipient role (e.g. SUPER_ADMIN).
 * Called internally by other services (e.g. when a seller signs up).
 */
exports.create = async ({ type, title, message, link, recipientRole = 'SUPER_ADMIN' }) => {
  return Notification.create({
    type,
    title,
    message,
    link,
    recipient_role: recipientRole,
  });
};

exports.list = async (role) => {
  const notifications = await Notification.findAll({
    where: { recipient_role: role },
    order: [['created_at', 'DESC']],
    limit: 30,
  });

  const unreadCount = await Notification.count({
    where: { recipient_role: role, is_read: false },
  });

  return { notifications, unreadCount };
};

exports.markRead = async (id, role) => {
  const notification = await Notification.findOne({ where: { id, recipient_role: role } });
  if (!notification) {
    const err = new Error('Notification not found.');
    err.status = 404;
    throw err;
  }
  notification.is_read = true;
  await notification.save();
  return notification;
};

exports.markAllRead = async (role) => {
  await Notification.update(
    { is_read: true },
    { where: { recipient_role: role, is_read: false } }
  );
};