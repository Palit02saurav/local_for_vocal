const CouponService = require('../services/couponService');
const CommonService = require('../services/commonService');

const handle = (fn, okStatus, okMessage, key) => async (req, res) => {
  try {
    const result = await fn(req);
    CommonService.sendResponse(res, okStatus, true, okMessage, key ? { [key]: result } : null);
  } catch (err) {
    if (!err.status || err.status >= 500) {
      console.error('Coupon error:', err);
    }
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error.');
  }
};

exports.list = handle((req) => CouponService.listCoupons(req.userId, req.userRole), 200, 'Coupons fetched successfully', 'coupons');
exports.create = handle((req) => CouponService.createCoupon(req.body, req.userId, req.userRole), 201, 'Coupon created successfully', 'coupon');
exports.setStatus = handle((req) => CouponService.setStatus(req.params.id, req.body.status, req.userId, req.userRole), 200, 'Coupon updated.', 'coupon');
exports.remove = handle((req) => CouponService.deleteCoupon(req.params.id, req.userId, req.userRole), 200, 'Coupon deleted.');
exports.listPublic = handle((req) => CouponService.listPublicBySeller(req.query.seller_id), 200, 'Coupons fetched successfully', 'coupons');
exports.validate = handle((req) => CouponService.validate(req.body.code, req.body.items), 200, 'Coupon applied.', 'coupon');