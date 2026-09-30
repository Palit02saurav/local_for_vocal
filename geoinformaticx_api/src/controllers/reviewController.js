const ReviewService = require('../services/reviewService');
const CommonService = require('../services/commonService');

exports.create = async (req, res) => {
  try {
    const { orderItemId, rating, comment } = req.body;
    const review = await ReviewService.createReview(req.customerId, orderItemId, rating, comment);
    CommonService.sendResponse(res, 201, true, 'Review submitted successfully.', { review });
  } catch (err) {
    console.error('Create review error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error submitting review.');
  }
};

exports.listForSeller = async (req, res) => {
  try {
    const reviews = await ReviewService.listForSeller(req.userId);
    CommonService.sendResponse(res, 200, true, 'Reviews fetched successfully.', { reviews });
  } catch (err) {
    console.error('List seller reviews error:', err);
    CommonService.sendResponse(res, 500, false, 'Server error fetching reviews.');
  }
};