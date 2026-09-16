const BannerService = require('../services/bannerService');
const CommonService = require('../services/commonService');

exports.list = async (req, res) => {
  try {
    const banners = await BannerService.listBanners(req.userId, req.userRole);
    CommonService.sendResponse(res, 200, true, 'Banners fetched successfully', { banners });
  } catch (err) {
    console.error('List banners error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching banners.');
  }
};

exports.listMine = async (req, res) => {
  try {
    const banners = await BannerService.listMyBanners(req.userId, req.userRole);
    CommonService.sendResponse(res, 200, true, 'Your banners fetched successfully', { banners });
  } catch (err) {
    console.error('List my banners error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching your banners.');
  }
};

exports.create = async (req, res) => {
  try {
    const banner = await BannerService.createBanner(req.body, req.userId, req.userRole);
    CommonService.sendResponse(res, 201, true, 'Banner created successfully', { banner });
  } catch (err) {
    console.error('Create banner error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error creating banner.');
  }
};

exports.listRequests = async (req, res) => {
  try {
    const banners = await BannerService.listRequests(req.userRole);
    CommonService.sendResponse(res, 200, true, 'Banner requests fetched successfully', { banners });
  } catch (err) {
    console.error('List banner requests error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching banner requests.');
  }
};

exports.approve = async (req, res) => {
  try {
    const banner = await BannerService.approveBanner(req.params.id, req.userRole);
    CommonService.sendResponse(res, 200, true, 'Banner approved.', { banner });
  } catch (err) {
    console.error('Approve banner error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error approving banner.');
  }
};

exports.reject = async (req, res) => {
  try {
    const banner = await BannerService.rejectBanner(req.params.id, req.userRole);
    CommonService.sendResponse(res, 200, true, 'Banner rejected.', { banner });
  } catch (err) {
    console.error('Reject banner error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error rejecting banner.');
  }
};

exports.createPaymentOrder = async (req, res) => {
  try {
    const order = await BannerService.createPaymentOrder(req.params.id, req.userId, req.userRole);
    CommonService.sendResponse(res, 200, true, 'Payment order created.', order);
  } catch (err) {
    console.error('Create payment order error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error creating payment order.');
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const banner = await BannerService.verifyPayment(req.params.id, req.userId, req.userRole, req.body);
    CommonService.sendResponse(res, 200, true, 'Payment verified. Banner published!', { banner });
  } catch (err) {
    console.error('Verify payment error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Payment verification failed.');
  }
};