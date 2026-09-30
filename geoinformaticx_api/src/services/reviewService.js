const { Review, OrderItem, Order, Customer, Product, Seller } = require('../models');

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

exports.listForSeller = async (sellerId) => {
  const reviews = await Review.findAll({
    include: [
      {
        model: Product,
        as: 'product',
        required: true,
        where: { seller_id: sellerId },
        attributes: ['id', 'name', 'image_url'],
      },
    ],
    order: [['created_at', 'DESC']],
  });
  return reviews;
};