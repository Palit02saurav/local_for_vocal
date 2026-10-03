const OrderService = require('../services/orderService');
const CommonService = require('../services/commonService');

exports.create = async (req, res) => {
  try {
    const { items, ...form } = req.body;
    const result = await OrderService.createOrder(req.customerId, items, form);
    CommonService.sendResponse(res, 201, true, 'Order placed successfully.', result);
  } catch (err) {
    console.error('Create order error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error placing order.');
  }
};

exports.listProductOrders = async (req, res) => {
  try {
    const orders = await OrderService.listProductOrders(req.customerId);
    CommonService.sendResponse(res, 200, true, 'Orders fetched successfully', { orders });
  } catch (err) {
    console.error('List product orders error:', err);
    CommonService.sendResponse(res, 500, false, 'Server error fetching orders.');
  }
};

exports.listServiceOrders = async (req, res) => {
  try {
    const orders = await OrderService.listServiceOrders(req.customerId);
    CommonService.sendResponse(res, 200, true, 'Orders fetched successfully', { orders });
  } catch (err) {
    console.error('List service orders error:', err);
    CommonService.sendResponse(res, 500, false, 'Server error fetching orders.');
  }
};


exports.listAll = async (req, res) => {
  try {
    let orders;
    if (req.userRole === 'SELLER') {
      orders = await OrderService.listSellerOrders(req.userId);
    } else if (req.userRole === 'VENDOR') {
      orders = await OrderService.listVendorOrders(req.userId);
    } else if (req.userRole === 'SUPER_ADMIN') {
      orders = await OrderService.listAllOrders();
    } else {
      return CommonService.sendResponse(res, 403, false, 'Not authorized.');
    }
    CommonService.sendResponse(res, 200, true, 'Orders fetched successfully', { orders });
  } catch (err) {
    console.error('List all orders error:', err);
    CommonService.sendResponse(res, 500, false, 'Server error fetching orders.');
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await OrderService.updateOrderStatus(req.params.id, status);
    CommonService.sendResponse(res, 200, true, 'Order status updated.', { order });
  } catch (err) {
    console.error('Update order status error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error updating order status.');
  }
};


exports.cancel = async (req, res) => {
  try {
    const order = await OrderService.cancelOrder(req.params.id, req.customerId);
    CommonService.sendResponse(res, 200, true, 'Order cancelled.', { order });
  } catch (err) {
    console.error('Cancel order error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error cancelling order.');
  }
};


exports.verifyPayment = async (req, res) => {
  try {
    await OrderService.verifyPayment(req.customerId, req.body);
    CommonService.sendResponse(res, 200, true, 'Payment verified.');
  } catch (err) {
    console.error('Verify payment error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Payment verification failed.');
  }
};

exports.abortPayment = async (req, res) => {
  try {
    await OrderService.abortPayment(req.customerId, req.body?.razorpay_order_id);
    CommonService.sendResponse(res, 200, true, 'Payment cancelled.');
  } catch (err) {
    console.error('Abort payment error:', err);
    CommonService.sendResponse(res, 500, false, 'Server error.');
  }
};