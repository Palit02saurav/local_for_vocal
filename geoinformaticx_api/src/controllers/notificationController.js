const NotificationService = require('../services/notificationService');
const CommonService = require('../services/commonService');

exports.list = async (req, res) => {
  try {
    const { notifications, unreadCount } = await NotificationService.list(req.userRole);
    CommonService.sendResponse(res, 200, true, 'Notifications fetched successfully', {
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error('List notifications error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching notifications.');
  }
};

exports.markRead = async (req, res) => {
  try {
    const notification = await NotificationService.markRead(req.params.id, req.userRole);
    CommonService.sendResponse(res, 200, true, 'Notification marked as read.', { notification });
  } catch (err) {
    console.error('Mark notification read error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error updating notification.');
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await NotificationService.markAllRead(req.userRole);
    CommonService.sendResponse(res, 200, true, 'All notifications marked as read.');
  } catch (err) {
    console.error('Mark all notifications read error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error updating notifications.');
  }
};