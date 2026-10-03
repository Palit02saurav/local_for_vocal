const { fn, col } = require('sequelize');
const { WishlistItem, Product, Service, Review } = require('../models');

exports.getWishlist = async (customerId) => {
  const items = await WishlistItem.findAll({
    where: { customer_id: customerId },
    include: [
      { model: Product, as: 'product' },
      { model: Service, as: 'service' },
    ],
    order: [['created_at', 'DESC']],
  });

  // average rating + review count for the wishlisted products
  const productIds = items.filter((i) => i.product_id).map((i) => i.product_id);
  const stats = productIds.length
    ? await Review.findAll({
        attributes: [
          'product_id',
          [fn('AVG', col('rating')), 'avg_rating'],
          [fn('COUNT', col('id')), 'review_count'],
        ],
        where: { product_id: productIds },
        group: ['product_id'],
        raw: true,
      })
    : [];

  const byProduct = {};
  stats.forEach((s) => {
    byProduct[s.product_id] = {
      avg_rating: Number(Number(s.avg_rating).toFixed(1)),
      review_count: Number(s.review_count),
    };
  });

  return items.map((i) => {
    const json = i.toJSON();
    if (json.product) {
      json.product.avg_rating = byProduct[json.product_id]?.avg_rating || 0;
      json.product.review_count = byProduct[json.product_id]?.review_count || 0;
    }
    return json;
  });
};

exports.addItem = async (customerId, { item_type = 'product', product_id, service_id }) => {
  const where = { customer_id: customerId, item_type };
  if (item_type === 'product') where.product_id = product_id;
  else where.service_id = service_id;

  const existing = await WishlistItem.findOne({ where });
  if (existing) return existing;

  return WishlistItem.create({ customer_id: customerId, item_type, product_id, service_id });
};

exports.removeItem = async (customerId, itemId) => {
  await WishlistItem.destroy({ where: { id: itemId, customer_id: customerId } });
};

exports.removeByProduct = async (customerId, { item_type = 'product', product_id, service_id }) => {
  const where = { customer_id: customerId, item_type };
  if (item_type === 'product') where.product_id = product_id;
  else where.service_id = service_id;
  await WishlistItem.destroy({ where });
};

exports.clearWishlist = async (customerId) => {
  await WishlistItem.destroy({ where: { customer_id: customerId } });
};