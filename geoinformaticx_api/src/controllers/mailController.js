const MailService = require('../services/mailService');
const CommonService = require('../services/commonService');

exports.send = async (req, res) => {
  try {
    const mail = await MailService.send(req.body, req.userRole);
    CommonService.sendResponse(res, 201, true, 'Mail sent to all sellers.', { mail });
  } catch (err) {
    console.error('Send mail error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error sending mail.');
  }
};

exports.list = async (req, res) => {
  try {
    const mails = await MailService.list();
    CommonService.sendResponse(res, 200, true, 'Mails fetched successfully', { mails });
  } catch (err) {
    console.error('List mails error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching mails.');
  }
};