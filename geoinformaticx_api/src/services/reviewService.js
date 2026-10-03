const { Review, OrderItem, Order, Customer, Product, Seller, Vendor } = require('../models');

exports.createReview = async (customerId, orderItemId, rating, comment) => {
  if (!rating || rating < 1 || rating > 5) {
    const err = new Error('Rating must be between 1 and 5.');
    err.status = 400;
    throw err;
  }

  const orderItem = await OrderItem.findOne({
    where: { id: orderItemId, item_type: 'product' },
    include: [{ model: Order, as: 'order', where: { customer_id: customerId } }],
  });
  if (!orderItem) {
    const err = new Error('Order item not found.');
    err.status = 404;
    throw err;
  }
  if (orderItem.order.status !== 'Delivered') {
    const err = new Error('You can only rate an item after it has been delivered.');
    err.status = 400;
    throw err;
  }

  const existing = await Review.findOne({ where: { order_item_id: orderItemId } });
  if (existing) {
    const err = new Error('You have already rated this order.');
    err.status = 400;
    throw err;
  }

  const customer = await Customer.findByPk(customerId);

  const review = await Review.create({
    order_item_id: orderItemId,
    product_id: orderItem.product_id,
    customer_id: customerId,
    customer_name: customer?.name || 'Customer',
    rating,
    comment: comment || null,
  });

  return review;
};

exports.listForSeller = async (userId, role) => {
  let productWhere;
  if (role === 'SELLER') productWhere = { seller_id: userId };
  else if (role === 'VENDOR') productWhere = { vendor_id: userId };
  else if (role === 'SUPER_ADMIN') productWhere = undefined; // admin sees all reviews
  else {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }

  const reviews = await Review.findAll({
    include: [
      {
        model: Product,
        as: 'product',
        required: true,
        ...(productWhere && { where: productWhere }),
        attributes: ['id', 'name', 'image_url'],
        include: [
          { model: Seller, as: 'seller', attributes: ['id', 'full_name', 'store_name'] },
          { model: Vendor, as: 'vendor', attributes: ['id', 'full_name'] },
        ],
      },
    ],
    order: [['created_at', 'DESC']],
  });
  return reviews;
};



exports.listForProduct = async (productId) => {
  const rows = await Review.findAll({
    where: { product_id: productId },
    attributes: ['id', 'customer_name', 'rating', 'comment', 'created_at'],
    order: [['created_at', 'DESC']],
  });

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  rows.forEach((r) => {
    breakdown[r.rating] = (breakdown[r.rating] || 0) + 1;
    total += r.rating;
  });
  const count = rows.length;

  return {
    reviews: rows.slice(0, 6),
    summary: { average: count ? Number((total / count).toFixed(1)) : 0, count, breakdown },
  };
};
exports.listForCustomer = async (customerId) => {
  const reviews = await Review.findAll({
    where: { customer_id: customerId },
    include: [
      {
        model: Product,
        as: 'product',
        required: false,
        attributes: ['id', 'name', 'image_url', 'sku'],
      },
    ],
    order: [['created_at', 'DESC']],
  });
  return reviews;
};