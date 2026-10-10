const { Coupon, Seller, Product, Service } = require('../models');
const { Op, literal, col } = require('sequelize');

const fail = (message, status = 400) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const canUseCoupons = (role) => role === 'SUPER_ADMIN' || role === 'SELLER';

exports.listCoupons = async (userId, userRole) => {
  if (!canUseCoupons(userRole)) throw fail('Not authorized to view coupons.', 403);

  const where = userRole === 'SELLER' ? { seller_id: userId } : {};

  return Coupon.findAll({
    where,
    include: [{ model: Seller, as: 'seller', attributes: ['id', 'full_name', 'store_name', 'seller_type'] }],
    order: [['created_at', 'DESC']],
  });
};

exports.createCoupon = async (body, userId, userRole) => {
  if (!canUseCoupons(userRole)) throw fail('Not authorized to create coupons.', 403);

  const code = String(body.code || '').trim().toUpperCase();
  const title = String(body.title || '').trim();
  const discount_type = body.discount_type === 'FLAT' ? 'FLAT' : 'PERCENT';
  const discount_value = Number(body.discount_value);

  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
    throw fail('Code must be 3–30 characters: letters, numbers, - or _ only.');
  }
  if (!title) throw fail('Title is required.');
  if (!(discount_value > 0)) throw fail('Discount value must be greater than 0.');
  if (discount_type === 'PERCENT' && discount_value > 100) {
    throw fail('Percentage discount cannot be more than 100.');
  }

  const min_order_amount = Number(body.min_order_amount) || 0;
  const max_discount_amount =
    discount_type === 'PERCENT' && body.max_discount_amount !== '' && body.max_discount_amount != null
      ? Number(body.max_discount_amount)
      : null;
  const usage_limit = body.usage_limit ? parseInt(body.usage_limit, 10) : null;
  const start_date = body.start_date || null;
  const end_date = body.end_date || null;

  if (start_date && end_date && end_date < start_date) {
    throw fail('End date cannot be before start date.');
  }

  const exists = await Coupon.findOne({ where: { code } });
  if (exists) throw fail('This coupon code already exists.', 409);

  return Coupon.create({
    code,
    title,
    description: body.description?.trim() || null,
    discount_type,
    discount_value,
    min_order_amount,
    max_discount_amount,
    usage_limit,
    start_date,
    end_date,
    created_by_role: userRole === 'SUPER_ADMIN' ? 'ADMIN' : 'SELLER',
    seller_id: userRole === 'SELLER' ? userId : null,
    admin_id: userRole === 'SUPER_ADMIN' ? userId : null,
  });
};

const findAllowed = async (id, userId, userRole) => {
  if (!canUseCoupons(userRole)) throw fail('Not authorized.', 403);
  const coupon = await Coupon.findByPk(id);
  if (!coupon) throw fail('Coupon not found.', 404);
  if (userRole === 'SELLER' && coupon.seller_id !== userId) {
    throw fail('This coupon does not belong to you.', 403);
  }
  return coupon;
};

exports.setStatus = async (id, status, userId, userRole) => {
  if (!['Active', 'Inactive'].includes(status)) throw fail('Invalid status.');
  const coupon = await findAllowed(id, userId, userRole);
  coupon.status = status;
  await coupon.save();
  return coupon;
};

exports.deleteCoupon = async (id, userId, userRole) => {
  const coupon = await findAllowed(id, userId, userRole);
  await coupon.destroy();
};

exports.listPublicBySeller = async (sellerId) => {
  const id = parseInt(sellerId, 10);
  if (!id) return [];

  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const coupons = await Coupon.findAll({
    where: {
      seller_id: id,
      created_by_role: 'SELLER',
      status: 'Active',
      [Op.and]: [
        { [Op.or]: [{ start_date: null }, { start_date: { [Op.lte]: today } }] },
        { [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: today } }] },
      ],
    },
    attributes: [
      'id', 'code', 'title', 'description', 'discount_type', 'discount_value',
      'min_order_amount', 'max_discount_amount', 'usage_limit', 'used_count',
      'start_date', 'end_date',
    ],
    order: [['created_at', 'DESC']],
  });

  // hide coupons whose usage limit is used up
  return coupons.filter((c) => !c.usage_limit || c.used_count < c.usage_limit);
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const round2 = (n) => Math.round(n * 100) / 100;

exports.priceItems = async (rawItems) => {
  if (!Array.isArray(rawItems)) return [];
  return Promise.all(
    rawItems.map(async (item) => {
      const Model = item.type === 'service' ? Service : Product;
      const row = await Model.findByPk(item.id, { attributes: ['id', 'price', 'seller_id'] });
      if (!row) throw fail('An item in your cart is no longer available.');
      return {
        ...item,
        quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
        price: Number(row.price),
        seller_id: row.seller_id,
      };
    })
  );
};

exports.evaluate = async (rawCode, items) => {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) throw fail('Enter a promo code.');

  const coupon = await Coupon.findOne({ where: { code } });
  if (!coupon || coupon.status !== 'Active') throw fail('Invalid or inactive promo code.');

  const today = todayStr();
  if (coupon.start_date && coupon.start_date > today) throw fail('This coupon is not active yet.');
  if (coupon.end_date && coupon.end_date < today) throw fail('This coupon has expired.');
  if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
    throw fail('This coupon has reached its usage limit.');
  }

  const eligibleItems = coupon.seller_id ? items.filter((i) => i.seller_id === coupon.seller_id) : items;
  if (eligibleItems.length === 0) {
    throw fail("This coupon is valid only on the issuing seller's products.");
  }

  const eligibleTotal = eligibleItems.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const minOrder = Number(coupon.min_order_amount) || 0;
  if (eligibleTotal < minOrder) {
    throw fail(`Add ₹${round2(minOrder - eligibleTotal)} more from this seller to use this coupon.`);
  }

  const value = Number(coupon.discount_value);
  let discount = coupon.discount_type === 'PERCENT' ? (eligibleTotal * value) / 100 : value;
  if (coupon.discount_type === 'PERCENT' && coupon.max_discount_amount) {
    discount = Math.min(discount, Number(coupon.max_discount_amount));
  }
  discount = round2(Math.min(discount, eligibleTotal));

  return { coupon, discount, eligibleItems, eligibleTotal };
};

exports.validate = async (code, rawItems) => {
  const items = await exports.priceItems(rawItems);
  const { coupon, discount } = await exports.evaluate(code, items);
  return { code: coupon.code, title: coupon.title, discount };
};

exports.reserve = async (couponId) => {
  const [affected] = await Coupon.update(
    { used_count: literal('used_count + 1') },
    {
      where: {
        id: couponId,
        [Op.or]: [{ usage_limit: null }, { used_count: { [Op.lt]: col('usage_limit') } }],
      },
    }
  );
  if (!affected) throw fail('This coupon has reached its usage limit.');
};

exports.release = async (code) => {
  await Coupon.update({ used_count: literal('GREATEST(used_count - 1, 0)') }, { where: { code } });
};