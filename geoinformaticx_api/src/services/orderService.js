const { Order, OrderItem, Customer, Product, Service } = require('../models');
const { Op } = require('sequelize');

exports.createOrder = async (customerId, cartItems, form) => {
  if (!cartItems || cartItems.length === 0) {
    const err = new Error('Cart is empty.');
    err.status = 400;
    throw err;
  }

  const total = cartItems.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

  const order = await Order.create({
    customer_id: customerId,
    full_name: form.name,
    phone: form.phone,
    email: form.email,
    address: form.address,
    payment_method: form.paymentMethod || 'cod',
    status: 'Processing',
    total,
  });

  const itemsToCreate = cartItems.map((item) => ({
    order_id: order.id,
    item_type: item.type || 'product',
    product_id: item.type === 'service' ? null : item.id,
    service_id: item.type === 'service' ? item.id : null,
    name: item.name,
    seller_name: item.seller || null,
    image_url: item.image || null,
    price: Number(item.price),
    quantity: item.quantity,
  }));

  await OrderItem.bulkCreate(itemsToCreate);

  const hasProducts = cartItems.some((i) => (i.type || 'product') === 'product');
  const hasServices = cartItems.some((i) => i.type === 'service');

  return { order, hasProducts, hasServices };
};

exports.listProductOrders = async (customerId) => {
  const items = await OrderItem.findAll({
    where: { item_type: 'product' },
    include: [{
      model: Order,
      as: 'order',
      where: { customer_id: customerId },
      attributes: ['id', 'status', 'created_at'],
    }],
    order: [['created_at', 'DESC']],
  });
  return items;
};

exports.listServiceOrders = async (customerId) => {
  const items = await OrderItem.findAll({
    where: { item_type: 'service' },
    include: [{
      model: Order,
      as: 'order',
      where: { customer_id: customerId },
      attributes: ['id', 'status', 'created_at'],
    }],
    order: [['created_at', 'DESC']],
  });
  return items;
};

exports.listAllOrders = async () => {
  const orders = await Order.findAll({
    include: [
      { model: Customer, as: 'customer' },
      { model: OrderItem, as: 'items' },
    ],
    order: [['created_at', 'DESC']],
  });
  return orders;
};


exports.updateOrderStatus = async (orderId, status) => {
  const order = await Order.findByPk(orderId);
  if (!order) {
    const err = new Error('Order not found.');
    err.status = 404;
    throw err;
  }
  order.status = status;
  await order.save();
  return order;
};

exports.listSellerOrders = async (sellerId) => {
  const items = await OrderItem.findAll({
    include: [
      {
        model: Order,
        as: 'order',
        include: [{ model: Customer, as: 'customer' }],
      },
      {
        model: Product,
        as: 'product',
        required: false,
        where: { seller_id: sellerId },
      },
      {
        model: Service,
        as: 'service',
        required: false,
        where: { seller_id: sellerId },
      },
    ],
    where: {
      [Op.or]: [
        { '$product.id$': { [Op.ne]: null } },
        { '$service.id$': { [Op.ne]: null } },
      ],
    },
    order: [['created_at', 'DESC']],
  });
  return items;
};

exports.cancelOrder = async (orderId, customerId) => {
  const order = await Order.findOne({ where: { id: orderId, customer_id: customerId } });
  if (!order) {
    const err = new Error('Order not found.');
    err.status = 404;
    throw err;
  }
  if (['Shipped', 'Out for Delivery', 'Delivered'].includes(order.status)) {
    const err = new Error('This order can no longer be cancelled.');
    err.status = 400;
    throw err;
  }
  order.status = 'Cancelled';
  await order.save();
  return order;
};


exports.listSellerOrders = async (sellerId) => {
  const items = await OrderItem.findAll({
    include: [
      {
        model: Order,
        as: 'order',
        include: [{ model: Customer, as: 'customer' }],
      },
      {
        model: Product,
        as: 'product',
        required: false,
      },
      {
        model: Service,
        as: 'service',
        required: false,
      },
    ],
    order: [['created_at', 'DESC']],
  });

  // Filter in JS: keep only items whose underlying product/service belongs to this seller.
  return items.filter((item) => {
    if (item.item_type === 'product') return item.product?.seller_id === sellerId;
    if (item.item_type === 'service') return item.service?.seller_id === sellerId;
    return false;
  });
};