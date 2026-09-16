const { WishlistItem, Product, Service } = require('../models');

exports.getWishlist = async (customerId) => {
  return WishlistItem.findAll({
    where: { customer_id: customerId },
    include: [
      { model: Product, as: 'product' },
      { model: Service, as: 'service' },
    ],
    order: [['created_at', 'DESC']],
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