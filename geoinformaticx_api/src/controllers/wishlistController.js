const WishlistService = require('../services/wishlistService');
const CommonService = require('../services/commonService');

exports.getWishlist = async (req, res) => {
  try {
    const items = await WishlistService.getWishlist(req.customerId);
    CommonService.sendResponse(res, 200, true, 'Wishlist fetched.', { items });
  } catch (err) {
    console.error('Get wishlist error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching wishlist.');
  }
};

exports.addItem = async (req, res) => {
  try {
    const item = await WishlistService.addItem(req.customerId, req.body);
    CommonService.sendResponse(res, 201, true, 'Item added to wishlist.', { item });
  } catch (err) {
    console.error('Add wishlist item error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error adding item.');
  }
};

exports.removeItem = async (req, res) => {
  try {
    await WishlistService.removeItem(req.customerId, req.params.id);
    CommonService.sendResponse(res, 200, true, 'Item removed.');
  } catch (err) {
    console.error('Remove wishlist item error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error removing item.');
  }
};

exports.removeByProduct = async (req, res) => {
  try {
    await WishlistService.removeByProduct(req.customerId, req.body);
    CommonService.sendResponse(res, 200, true, 'Item removed.');
  } catch (err) {
    console.error('Remove wishlist item error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error removing item.');
  }
};

exports.clearWishlist = async (req, res) => {
  try {
    await WishlistService.clearWishlist(req.customerId);
    CommonService.sendResponse(res, 200, true, 'Wishlist cleared.');
  } catch (err) {
    console.error('Clear wishlist error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error clearing wishlist.');
  }
};