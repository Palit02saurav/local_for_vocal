const { Order, OrderItem, Customer, Product, Service, Seller, Review, Vendor } = require('../models');
const { Op } = require('sequelize');
const { sendServiceBookingEmail } = require('../utils/otpUtils');


const Razorpay = require('razorpay');
const crypto = require('crypto');

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const err = new Error('Online payments are not configured.');
    err.status = 500;
    throw err;
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const paidOrCod = {
  [Op.or]: [{ payment_method: { [Op.ne]: 'razorpay' } }, { payment_status: 'Paid' }],
};
const notifyServiceSellers = async (serviceItems, order, form) => {
  const services = await Service.findAll({
    where: { id: serviceItems.map((i) => i.id) },
    include: [{ model: Seller, as: 'seller', attributes: ['id', 'full_name', 'email'] }],
  });

  const bySeller = {};
  for (const item of serviceItems) {
    const svc = services.find((s) => s.id === item.id);
    if (!svc?.seller?.email) {
      console.warn(`Service booking mail skipped: service ${item.id} has no seller with an email`);
      continue;
    }
    const key = svc.seller.id;
    if (!bySeller[key]) bySeller[key] = { seller: svc.seller, items: [] };
    bySeller[key].items.push(item);
  }

  for (const { seller, items } of Object.values(bySeller)) {
    await sendServiceBookingEmail({
      to: seller.email,
      sellerName: seller.full_name,
      orderId: order.id,
      customer: { name: form.name, phone: form.phone, email: form.email, address: form.address },
      items,
      total: items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0),
      paymentMethod: form.paymentMethod,
    });
    console.log(`Service booking mail sent to ${seller.email} for order ${order.id}`);
  }
};

// exports.createOrder = async (customerId, cartItems, form) => {
//   if (!cartItems || cartItems.length === 0) {
//     const err = new Error('Cart is empty.');
//     err.status = 400;
//     throw err;
//   }

//   const productItems = cartItems.filter((i) => (i.type || 'product') === 'product');
//   const serviceItems = cartItems.filter((i) => i.type === 'service');

//   const createGroup = async (items, status) => {
//     const total = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

//     const order = await Order.create({
//       customer_id: customerId,
//       full_name: form.name,
//       phone: form.phone,
//       email: form.email,
//       address: form.address,
//       payment_method: form.paymentMethod || 'cod',
//       status,
//       total,
//     });

//     await OrderItem.bulkCreate(
//       items.map((item) => ({
//         order_id: order.id,
//         item_type: item.type || 'product',
//         product_id: item.type === 'service' ? null : item.id,
//         service_id: item.type === 'service' ? item.id : null,
//         name: item.name,
//         seller_name: item.seller || null,
//         image_url: item.image || null,
//         price: Number(item.price),
//         quantity: item.quantity,
//       }))
//     );

//     return order;
//   };

//   const productOrder = productItems.length ? await createGroup(productItems, 'Processing') : null;
//   const serviceOrder = serviceItems.length ? await createGroup(serviceItems, 'Confirmed') : null;

//   if (serviceOrder) {
//     notifyServiceSellers(serviceItems, serviceOrder, form).catch((e) =>
//       console.error('Service booking mail error:', e.message)
//     );
//   }

//   return {
//     order: productOrder || serviceOrder,
//     hasProducts: productItems.length > 0,
//     hasServices: serviceItems.length > 0,
//   };
// };



exports.createOrder = async (customerId, rawItems, form) => {
  if (!rawItems || rawItems.length === 0) {
    const err = new Error('Cart is empty.');
    err.status = 400;
    throw err;
  }

  const isOnline = form.paymentMethod === 'razorpay';

  // NEW: take prices from the database, never from the browser
  const cartItems = await Promise.all(
    rawItems.map(async (item) => {
      const Model = item.type === 'service' ? Service : Product;
      const row = await Model.findByPk(item.id, { attributes: ['id', 'price'] });
      if (!row) {
        const err = new Error(`"${item.name}" is no longer available.`);
        err.status = 400;
        throw err;
      }
      return { ...item, price: Number(row.price) };
    })
  );

  const productItems = cartItems.filter((i) => (i.type || 'product') === 'product');
  const serviceItems = cartItems.filter((i) => i.type === 'service');

  const createGroup = async (items, status) => {
    const total = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

    const order = await Order.create({
      customer_id: customerId,
      full_name: form.name,
      phone: form.phone,
      email: form.email,
      address: form.address,
      payment_method: form.paymentMethod || 'cod',
      status,
      total,
    });

    await OrderItem.bulkCreate(
      items.map((item) => ({
        order_id: order.id,
        item_type: item.type || 'product',
        product_id: item.type === 'service' ? null : item.id,
        service_id: item.type === 'service' ? item.id : null,
        name: item.name,
        seller_name: item.seller || null,
        image_url: item.image || null,
        price: Number(item.price),
        quantity: item.quantity,
      }))
    );

    return order;
  };

  const productOrder = productItems.length ? await createGroup(productItems, isOnline ? 'Pending' : 'Processing') : null;
  const serviceOrder = serviceItems.length ? await createGroup(serviceItems, isOnline ? 'Pending' : 'Confirmed') : null;

  let razorpay = null;
  if (isOnline) {
    const orders = [productOrder, serviceOrder].filter(Boolean);
    try {
      const total = orders.reduce((s, o) => s + Number(o.total), 0);
      if (Math.round(total * 100) < 100) {
        const err = new Error('Minimum online payment is ₹1.');
        err.status = 400;
        throw err;
      }
      const rzpOrder = await getRazorpay().orders.create({
        amount: Math.round(total * 100), // paise
        currency: 'INR',
        receipt: `c${customerId}_${Date.now()}`,
      });
      await Order.update(
        { razorpay_order_id: rzpOrder.id },
        { where: { id: orders.map((o) => o.id) } }
      );
      razorpay = {
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      };
    } catch (e) {
      await Order.update(
        { status: 'Cancelled', payment_status: 'Failed' },
        { where: { id: orders.map((o) => o.id) } }
      );
      if (e.status) throw e; 
      const err = new Error(e?.error?.description || e.message || 'Could not start payment.');
      err.status = 500;
      throw err;
    }
  } else if (serviceOrder) {
    notifyServiceSellers(serviceItems, serviceOrder, form).catch((e) =>
      console.error('Service booking mail error:', e.message)
    );
  }

  return {
    order: productOrder || serviceOrder,
    hasProducts: productItems.length > 0,
    hasServices: serviceItems.length > 0,
    razorpay, 
  };
};

exports.verifyPayment = async (customerId, body) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body || {};
  if (!razorpay_order_id || !razorpay_payment_id || typeof razorpay_signature !== 'string') {
    const err = new Error('Missing payment details.');
    err.status = 400;
    throw err;
  }

  const orders = await Order.findAll({
    where: { razorpay_order_id, customer_id: customerId },
    include: [{ model: OrderItem, as: 'items' }],
  });
  if (!orders.length) {
    const err = new Error('Order not found.');
    err.status = 404;
    throw err;
  }

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  const valid =
    expected.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
  if (!valid) {
    const err = new Error('Payment verification failed.');
    err.status = 400;
    throw err;
  }

  for (const order of orders) {
    if (order.payment_status === 'Paid') continue; 
    const hasService = order.items.some((i) => i.item_type === 'service');
    order.payment_status = 'Paid';
    order.razorpay_payment_id = razorpay_payment_id;
    order.status = hasService ? 'Confirmed' : 'Processing';
    await order.save();

    if (hasService) {
      const serviceItems = order.items.map((i) => ({
        id: i.service_id, name: i.name, price: i.price, quantity: i.quantity,
      }));
      notifyServiceSellers(serviceItems, order, {
        name: order.full_name, phone: order.phone, email: order.email,
        address: order.address, paymentMethod: order.payment_method,
      }).catch((e) => console.error('Service booking mail error:', e.message));
    }
  }
  return orders;
};

exports.abortPayment = async (customerId, razorpayOrderId) => {
  await Order.update(
    { status: 'Cancelled', payment_status: 'Failed' },
    { where: { customer_id: customerId, razorpay_order_id: razorpayOrderId, payment_status: 'Unpaid' } }
  );
};

exports.listProductOrders = async (customerId) => {
  const items = await OrderItem.findAll({
    where: { item_type: 'product' },
    include: [
      {
        model: Order,
        as: 'order',
        where: { customer_id: customerId, ...paidOrCod },
        attributes: ['id', 'status', 'created_at', 'updated_at'],
      },
      {
        model: Product,
        as: 'product',
        required: false,
        attributes: ['id', 'delivery_type'],
      },
      {
        model: Review,
        as: 'review',
        required: false,
        attributes: ['id', 'rating'],
      },
    ],
    order: [['created_at', 'DESC']],
  });
  return items;
};

exports.listServiceOrders = async (customerId) => {
  const items = await OrderItem.findAll({
    where: { item_type: 'service' },
    include: [
      {
        model: Order,
        as: 'order',
        where: { customer_id: customerId, ...paidOrCod },
        attributes: ['id', 'status', 'address', 'created_at', 'updated_at'],
      },
      {
        model: Service,
        as: 'service',
        required: false,
        attributes: ['id', 'seller_id'],
        include: [{
          model: Seller,
          as: 'seller',
          required: false,
          attributes: ['id', 'store_name', 'phone', 'location'],
        }],
      },
      {
        model: Review,
        as: 'review',
        required: false,
        attributes: ['id', 'rating'],
      },
    ],
    order: [['created_at', 'DESC']],
  });
  return items;
};

exports.listAllOrders = async () => {
  const orders = await Order.findAll({
    where: paidOrCod,
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
        where: paidOrCod,
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







exports.listVendorOrders = async (vendorId) => {
  return OrderItem.findAll({
    where: { item_type: 'product' },
    include: [
      {
        model: Order,
        as: 'order',
        where: paidOrCod,
        include: [{ model: Customer, as: 'customer' }],
      },
      {
        model: Product,
        as: 'product',
        required: true,
        where: { vendor_id: vendorId },
        include: [{ model: Vendor, as: 'vendor', attributes: ['id', 'full_name'] }],
      },
    ],
    order: [['created_at', 'DESC']],
  });
};