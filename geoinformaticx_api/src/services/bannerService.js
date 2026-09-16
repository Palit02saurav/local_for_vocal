const { Banner, Seller } = require('../models');
const { Op } = require('sequelize');

exports.listBanners = async (userId, userRole) => {
  const where = {};

  if (userRole === 'SELLER') {
    where.seller_id = userId;
    where.approval_status = 'Approved';
  } else if (userRole === 'SUPER_ADMIN') {
    where[Op.or] = [
      { created_by_role: 'ADMIN' },
      { created_by_role: 'SELLER', approval_status: 'Approved' },
    ];
  } else {
    const err = new Error('Not authorized to view banners.');
    err.status = 403;
    throw err;
  }

  return Banner.findAll({
    where,
    include: [{ model: Seller, as: 'seller', attributes: ['id', 'full_name', 'store_name'] }],
    order: [['created_at', 'DESC']],
  });
};

exports.listMyBanners = async (userId, userRole) => {
  if (userRole !== 'SELLER') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }
  return Banner.findAll({
    where: { seller_id: userId },
    order: [['created_at', 'DESC']],
  });
};

exports.createBanner = async (body, userId, userRole) => {
  const { title, image_url, link_url } = body;
  if (!title?.trim() || !image_url) {
    const err = new Error('Title and image are required.');
    err.status = 400;
    throw err;
  }

  const created_by_role = userRole === 'SUPER_ADMIN' ? 'ADMIN' : 'SELLER';
  const seller_id = userRole === 'SELLER' ? userId : null;
  const admin_id = userRole === 'SUPER_ADMIN' ? userId : null;
  const approval_status = created_by_role === 'ADMIN' ? 'Approved' : 'Pending';

  const payment_status = created_by_role === 'ADMIN' ? 'Paid' : 'Unpaid';
  const is_published = created_by_role === 'ADMIN';

  return Banner.create({
    title: title.trim(),
    image_url,
    link_url: link_url || null,
    seller_id,
    admin_id,
    created_by_role,
    approval_status,
    payment_status,
    is_published,
  });
};


const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/banners/:id/create-payment-order — Seller only
exports.createPaymentOrder = async (id, userId, userRole) => {
  if (userRole !== 'SELLER') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }

  const banner = await Banner.findByPk(id);
  if (!banner) {
    const err = new Error('Banner not found.');
    err.status = 404;
    throw err;
  }
  if (banner.seller_id !== userId) {
    const err = new Error('This banner does not belong to you.');
    err.status = 403;
    throw err;
  }
  if (banner.approval_status !== 'Approved') {
    const err = new Error('This banner has not been approved by admin yet.');
    err.status = 400;
    throw err;
  }
  if (banner.payment_status === 'Paid') {
    const err = new Error('This banner is already paid and published.');
    err.status = 400;
    throw err;
  }

  const order = await razorpay.orders.create({
    amount: Math.round(Number(banner.payment_amount) * 100), // paise
    currency: 'INR',
    receipt: `banner_${banner.id}`,
  });

  banner.razorpay_order_id = order.id;
  await banner.save();

  return { orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID };
};

exports.verifyPayment = async (id, userId, userRole, body) => {
  if (userRole !== 'SELLER') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  const banner = await Banner.findByPk(id);
  if (!banner || banner.seller_id !== userId) {
    const err = new Error('Banner not found.');
    err.status = 404;
    throw err;
  }

  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    const err = new Error('Payment verification failed.');
    err.status = 400;
    throw err;
  }

  banner.payment_status = 'Paid';
  banner.razorpay_payment_id = razorpay_payment_id;
  banner.is_published = true;
  await banner.save();

  return banner;
};
exports.listRequests = async (userRole) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }
  return Banner.findAll({
    where: { created_by_role: 'SELLER', approval_status: 'Pending' },
    include: [{ model: Seller, as: 'seller', attributes: ['id', 'full_name', 'store_name'] }],
    order: [['created_at', 'DESC']],
  });
};

exports.approveBanner = async (id, userRole) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }
  const banner = await Banner.findByPk(id);
  if (!banner) {
    const err = new Error('Banner not found.');
    err.status = 404;
    throw err;
  }
  banner.approval_status = 'Approved';
  await banner.save();
  return banner;
};

exports.rejectBanner = async (id, userRole) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }
  const banner = await Banner.findByPk(id);
  if (!banner) {
    const err = new Error('Banner not found.');
    err.status = 404;
    throw err;
  }
  banner.approval_status = 'Rejected';
  await banner.save();
  return banner;
};