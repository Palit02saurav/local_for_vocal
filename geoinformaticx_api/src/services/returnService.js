const { ReturnRequest, Order, OrderItem, Product, Customer } = require('../models');

const fail = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// What a request is allowed to move to next
const NEXT_STATUS = {
  Requested: ['Initiated', 'Rejected'],
  Initiated: ['Shipped'],
  Shipped: ['Out for Delivery'],
  'Out for Delivery': ['Delivered'],
};

exports.createRequest = async (customerId, { orderItemId, type, reason }) => {
  console.log('CREATE RETURN v2 – new code running');
  if (!['return', 'replace', 'refund'].includes(type)) {
    throw fail(400, 'Choose return, replace or refund.');
  }
  const text = (reason || '').trim();
  if (text.length < 10) throw fail(400, 'Please describe the issue (at least 10 characters).');
  if (text.length > 1000) throw fail(400, 'Issue description is too long (max 1000 characters).');

  const item = await OrderItem.findOne({
    where: { id: orderItemId, item_type: 'product' },
    include: [
      { model: Order, as: 'order', where: { customer_id: customerId } },
      { model: Product, as: 'product', required: false },
    ],
  });
  if (!item) throw fail(404, 'Order item not found.');
  if (item.order.status !== 'Delivered') throw fail(400, 'Only delivered items can be returned.');
  if (!item.product?.return_replace_accepted) {
    throw fail(400, 'This product is not eligible for return or replacement.');
  }

  const days = item.product.return_replace_days || 7;
  const deliveredAt = new Date(item.order.updated_at).getTime();
  if (Date.now() - deliveredAt > days * 24 * 60 * 60 * 1000) {
    throw fail(400, `The ${days}-day return window has passed.`);
  }

  const existing = await ReturnRequest.findOne({ where: { order_item_id: item.id } });

  if (existing && existing.status !== 'Rejected') {
    throw fail(409, 'A request already exists for this item.');
  }
  if (existing) await existing.destroy();

  return ReturnRequest.create({
    order_id: item.order_id,
    order_item_id: item.id,
    customer_id: customerId,
    type,
    reason: text,
  });
};

exports.listForOwner = async (role, userId, type) => {
  let productWhere = null;
  if (role === 'SELLER') productWhere = { seller_id: userId };
  else if (role === 'VENDOR') productWhere = { vendor_id: userId };
  else if (role !== 'SUPER_ADMIN') throw fail(403, 'Not authorized.');

  return ReturnRequest.findAll({
    where: ['return', 'replace', 'refund'].includes(type) ? { type } : {},
    include: [
      {
        model: OrderItem,
        as: 'orderItem',
        required: true,
        include: [
          {
            model: Product,
            as: 'product',
            required: !!productWhere,
            ...(productWhere ? { where: productWhere } : {}),
          },
        ],
      },
      { model: Order, as: 'order', attributes: ['id', 'address', 'phone', 'payment_method'] },
      { model: Customer, as: 'customer', attributes: ['id', 'name', 'email'] },
    ],
    order: [['created_at', 'DESC']],
  });
};

exports.updateStatus = async (role, userId, id, status) => {
  if (!['SELLER', 'VENDOR', 'SUPER_ADMIN'].includes(role)) throw fail(403, 'Not authorized.');

  const request = await ReturnRequest.findByPk(id, {
    include: [{ model: OrderItem, as: 'orderItem', include: [{ model: Product, as: 'product' }] }],
  });
  if (!request) throw fail(404, 'Request not found.');

  const product = request.orderItem?.product;
  if (role === 'SELLER' && product?.seller_id !== userId) throw fail(403, 'Not your product.');
  if (role === 'VENDOR' && product?.vendor_id !== userId) throw fail(403, 'Not your product.');

  if (!(NEXT_STATUS[request.status] || []).includes(status)) {
    throw fail(400, `Cannot move from "${request.status}" to "${status}".`);
  }
  request.status = status;
  await request.save();
  return request;
};