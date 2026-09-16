const CartService = require('../services/cartService');
const CommonService = require('../services/commonService');

exports.getCart = async (req, res) => {
  try {
    const items = await CartService.getCart(req.customerId);
    CommonService.sendResponse(res, 200, true, 'Cart fetched.', { items });
  } catch (err) {
    console.error('Get cart error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching cart.');
  }
};

exports.addItem = async (req, res) => {
  try {
    const item = await CartService.addItem(req.customerId, req.body);
    CommonService.sendResponse(res, 201, true, 'Item added to cart.', { item });
  } catch (err) {
    console.error('Add cart item error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error adding item.');
  }
};

exports.updateQuantity = async (req, res) => {
  try {
    const item = await CartService.updateQuantity(req.customerId, req.params.id, req.body.quantity);
    CommonService.sendResponse(res, 200, true, 'Cart updated.', { item });
  } catch (err) {
    console.error('Update cart item error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error updating item.');
  }
};

exports.removeItem = async (req, res) => {
  try {
    await CartService.removeItem(req.customerId, req.params.id);
    CommonService.sendResponse(res, 200, true, 'Item removed.');
  } catch (err) {
    console.error('Remove cart item error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error removing item.');
  }
};

exports.clearCart = async (req, res) => {
  try {
    await CartService.clearCart(req.customerId);
    CommonService.sendResponse(res, 200, true, 'Cart cleared.');
  } catch (err) {
    console.error('Clear cart error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error clearing cart.');
  }
};