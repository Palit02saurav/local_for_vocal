const VendorService = require('../services/vendorService');
const CommonService = require('../services/commonService');

exports.list = async (req, res) => {
  try {
    const vendors = await VendorService.listVendors();
    CommonService.sendResponse(res, 200, true, 'Vendors fetched successfully', { vendors });
  } catch (err) {
    console.error('List vendors error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching vendors.');
  }
};

exports.listRequests = async (req, res) => {
  try {
    const vendors = await VendorService.listRequests(req.userRole);
    CommonService.sendResponse(res, 200, true, 'Vendor requests fetched successfully', { vendors });
  } catch (err) {
    console.error('List vendor requests error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching vendor requests.');
  }
};

exports.approve = async (req, res) => {
  try {
    const vendor = await VendorService.approveVendor(req.params.id, req.userRole);
    CommonService.sendResponse(res, 200, true, 'Vendor approved. Default password set.', { vendor });
  } catch (err) {
    console.error('Approve vendor error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error approving vendor.');
  }
};

exports.reject = async (req, res) => {
  try {
    const vendor = await VendorService.rejectVendor(req.params.id, req.userRole);
    CommonService.sendResponse(res, 200, true, 'Vendor request rejected.', { vendor });
  } catch (err) {
    console.error('Reject vendor error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error rejecting vendor.');
  }
};

exports.getMe = async (req, res) => {
  try {
    const vendor = await VendorService.getMe(req.userId, req.userRole);
    CommonService.sendResponse(res, 200, true, 'Profile fetched successfully', { vendor });
  } catch (err) {
    console.error('Get vendor profile error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching profile.');
  }
};

exports.changePassword = async (req, res) => {
  try {
    await VendorService.changePassword(req.userId, req.userRole, req.body);
    CommonService.sendResponse(res, 200, true, 'Password updated successfully.');
  } catch (err) {
    console.error('Change vendor password error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error updating password.');
  }
};