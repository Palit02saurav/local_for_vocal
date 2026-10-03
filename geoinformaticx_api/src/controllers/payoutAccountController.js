const PayoutAccountService = require('../services/payoutAccountService');
const CommonService = require('../services/commonService');

exports.getMine = async (req, res) => {
  try {
    const account = await PayoutAccountService.getMine(req.userId, req.userRole);
    CommonService.sendResponse(res, 200, true, 'Payout account fetched.', { account });
  } catch (err) {
    console.error('Get payout account error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching payout account.');
  }
};

exports.saveMine = async (req, res) => {
  try {
    const account = await PayoutAccountService.saveMine(req.userId, req.userRole, req.body);
    CommonService.sendResponse(res, 200, true, 'Payout details saved. Pending verification.', { account });
  } catch (err) {
    console.error('Save payout account error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error saving payout account.');
  }
};

exports.listAll = async (req, res) => {
  try {
    const accounts = await PayoutAccountService.listAll(req.userRole, req.query);
    CommonService.sendResponse(res, 200, true, 'Payout accounts fetched.', { accounts });
  } catch (err) {
    console.error('List payout accounts error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching payout accounts.');
  }
};

const decide = (status) => async (req, res) => {
  try {
    const result = await PayoutAccountService.decide(req.userRole, req.params.id, status);
    CommonService.sendResponse(res, 200, true, `Payout account ${status.toLowerCase()}.`, result);
  } catch (err) {
    console.error('Payout decision error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error updating payout account.');
  }
};



exports.monthlyEarnings = async (req, res) => {
  try {
    const data = await PayoutAccountService.monthlyEarnings(req.userRole, req.query);
    CommonService.sendResponse(res, 200, true, 'Monthly earnings fetched.', data);
  } catch (err) {
    console.error('Monthly earnings error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching earnings.');
  }
};
exports.verify = decide('Verified');
exports.reject = decide('Rejected');