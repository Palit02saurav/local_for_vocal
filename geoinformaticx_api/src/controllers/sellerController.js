const SellerService = require('../services/sellerService');
const CommonService = require('../services/commonService');

exports.list = async (req, res) => {
  try {
    const sellers = await SellerService.listSellers();
    CommonService.sendResponse(res, 200, true, 'Sellers fetched successfully', { sellers });
  } catch (err) {
    console.error('List sellers error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching sellers.');
  }
};

exports.listPublic = async (req, res) => {
  try {
    const sellers = await SellerService.listPublicSellers();
    CommonService.sendResponse(res, 200, true, 'Sellers fetched successfully', { sellers });
  } catch (err) {
    console.error('List public sellers error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching sellers.');
  }
};

exports.listRequests = async (req, res) => {
  try {
    const sellers = await SellerService.listRequests(req.userRole);
    CommonService.sendResponse(res, 200, true, 'Seller requests fetched successfully', { sellers });
  } catch (err) {
    console.error('List seller requests error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching seller requests.');
  }
};

exports.approve = async (req, res) => {
  try {
    const seller = await SellerService.approveSeller(req.params.id, req.userRole);
    CommonService.sendResponse(res, 200, true, 'Seller approved. Default password set.', { seller });
  } catch (err) {
    console.error('Approve seller error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error approving seller.');
  }
};

exports.reject = async (req, res) => {
  try {
    const seller = await SellerService.rejectSeller(req.params.id, req.userRole);
    CommonService.sendResponse(res, 200, true, 'Seller request rejected.', { seller });
  } catch (err) {
    console.error('Reject seller error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error rejecting seller.');
  }
};

exports.getMe = async (req, res) => {
  try {
    const seller = await SellerService.getMe(req.userId, req.userRole);
    CommonService.sendResponse(res, 200, true, 'Profile fetched successfully', { seller });
  } catch (err) {
    console.error('Get seller profile error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching profile.');
  }
};

exports.changePassword = async (req, res) => {
  try {
    await SellerService.changePassword(req.userId, req.userRole, req.body);
    CommonService.sendResponse(res, 200, true, 'Password updated successfully.');
  } catch (err) {
    console.error('Change seller password error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error updating password.');
  }
};

exports.updateMe = async (req, res) => {
  try {
    const seller = await SellerService.updateMe(req.userId, req.userRole, req.body);
    CommonService.sendResponse(res, 200, true, 'Store updated.', { seller });
  } catch (err) {
    console.error('Update seller profile error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error updating store.');
  }
};