// const { CartItem, Product, Service } = require('../models');

const { CartItem, Product, Service, Seller } = require('../models');

exports.getCart = async (customerId) => {
  return CartItem.findAll({
    where: { customer_id: customerId },
    include: [
      {
        model: Product,
        as: 'product',
        include: [{ model: Seller, as: 'seller', attributes: ['id', 'full_name', 'store_name'] }],
      },
      {
        model: Service,
        as: 'service',
        include: [{ model: Seller, as: 'seller', attributes: ['id', 'full_name', 'store_name'] }],
      },
    ],
    order: [['created_at', 'DESC']],
  });
};

exports.addItem = async (customerId, { item_type = 'product', product_id, service_id, quantity = 1 }) => {
  const where = { customer_id: customerId, item_type };
  if (item_type === 'product') where.product_id = product_id;
  else where.service_id = service_id;

  const existing = await CartItem.findOne({ where });
  if (existing) {
    existing.quantity += quantity;
    await existing.save();
    return existing;
  }

  return CartItem.create({ customer_id: customerId, item_type, product_id, service_id, quantity });
};

exports.updateQuantity = async (customerId, itemId, quantity) => {
  const item = await CartItem.findOne({ where: { id: itemId, customer_id: customerId } });
  if (!item) {
    const err = new Error('Cart item not found.');
    err.status = 404;
    throw err;
  }
  if (quantity <= 0) {
    await item.destroy();
    return null;
  }
  item.quantity = quantity;
  await item.save();
  return item;
};

exports.removeItem = async (customerId, itemId) => {
  await CartItem.destroy({ where: { id: itemId, customer_id: customerId } });
};

exports.clearCart = async (customerId) => {
  await CartItem.destroy({ where: { customer_id: customerId } });
};