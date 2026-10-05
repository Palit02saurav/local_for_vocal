const { Op } = require('sequelize');
const { SellerPayoutAccount, Seller, Order, OrderItem, Product, Service } = require('../models');

const COMMISSION_RATE = 0.10;            
const COUNTED_STATUSES = ['Delivered'];  
const paidOrCod = {
  [Op.or]: [{ payment_method: { [Op.ne]: 'razorpay' } }, { payment_status: 'Paid' }],
};
const r2 = (n) => Math.round(n * 100) / 100;

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const assertSeller = (role) => {
  if (role !== 'SELLER') throw httpError(403, 'Not authorized.');
};

const assertSuperAdmin = (role) => {
  if (role !== 'SUPER_ADMIN') throw httpError(403, 'Not authorized.');
};

// Which column identifies the logged-in owner of the account
const ownerWhere = (userId, role) => {
  if (role === 'SELLER') return { seller_id: userId };
  if (role === 'VENDOR') return { vendor_id: userId };
  throw httpError(403, 'Not authorized.');
};

const toAdmin = (a) => ({
  id: a.id,
  account_holder_name: a.account_holder_name,
  bank_name: a.bank_name,
  branch_name: a.branch_name,
  account_number: a.account_number,
  ifsc_code: a.ifsc_code,
  account_type: a.account_type,
  upi_id: a.upi_id,
  status: a.status,
  created_at: a.created_at,
  updated_at: a.updated_at,
  seller: a.seller
    ? {
        id: a.seller.id,
        full_name: a.seller.full_name,
        store_name: a.seller.store_name,
        email: a.seller.email,
        phone: a.seller.phone,
        seller_type: a.seller.seller_type,
      }
    : null,
});

const mask = (num) => (num ? `XXXXXX${String(num).slice(-4)}` : null);

// Never send the full account number back to the browser.
const toPublic = (a) =>
  a
    ? {
        account_holder_name: a.account_holder_name,
        bank_name: a.bank_name,
        branch_name: a.branch_name,
        account_number_masked: mask(a.account_number),
        ifsc_code: a.ifsc_code,
        account_type: a.account_type,
        upi_id: a.upi_id,
        status: a.status,
        updated_at: a.updated_at,
      }
    : null;
exports.getMine = async (userId, role) => {
  const account = await SellerPayoutAccount.findOne({ where: ownerWhere(userId, role) });
  return toPublic(account);
};

exports.saveMine = async (userId, role, body) => {
  const owner = ownerWhere(userId, role);

  const existing = await SellerPayoutAccount.findOne({ where: owner });
  if (existing && existing.status !== 'Rejected') {
    throw httpError(409, 'Payout details are already submitted and cannot be changed. Please contact support.');
  }

  const account_holder_name = String(body.account_holder_name || '').trim();
  const bank_name = String(body.bank_name || '').trim();
  const branch_name = String(body.branch_name || '').trim() || null;
  const account_number = String(body.account_number || '').replace(/\s+/g, '');
  const confirm = String(body.confirm_account_number || '').replace(/\s+/g, '');
  const ifsc_code = String(body.ifsc_code || '').trim().toUpperCase();
  const account_type = body.account_type === 'Current' ? 'Current' : 'Savings';
  const upi_id = String(body.upi_id || '').trim() || null;

  if (!account_holder_name) throw httpError(400, 'Account holder name is required.');
  if (!bank_name) throw httpError(400, 'Bank name is required.');
  if (!/^\d{9,18}$/.test(account_number)) throw httpError(400, 'Account number must be 9 to 18 digits.');
  if (account_number !== confirm) throw httpError(400, 'Account numbers do not match.');
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc_code)) throw httpError(400, 'Enter a valid IFSC code (e.g. SBIN0001234).');
  if (upi_id && !/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/.test(upi_id)) throw httpError(400, 'Enter a valid UPI ID (e.g. name@bank).');

  const payload = {
    account_holder_name,
    bank_name,
    branch_name,
    account_number,
    ifsc_code,
    account_type,
    upi_id,
    status: 'Pending', 
  };

  let account = existing;
  if (account) {
    await account.update(payload); 
  } else {
    account = await SellerPayoutAccount.create({ ...owner, ...payload });
  }
  return toPublic(account);
};

exports.listAll = async (role, query = {}) => {
  assertSuperAdmin(role);

  const where = {};
  if (['Pending', 'Verified', 'Rejected'].includes(query.status)) where.status = query.status;

  const sellerWhere = ['product', 'service'].includes(query.seller_type)
    ? { seller_type: query.seller_type }
    : undefined;

  const accounts = await SellerPayoutAccount.findAll({
    where,
    include: [{
      model: Seller,
      as: 'seller',
      attributes: ['id', 'full_name', 'store_name', 'email', 'phone', 'seller_type'],
      where: sellerWhere,
      required: true,
    }],
    order: [['updated_at', 'DESC']],
  });
  return accounts.map(toAdmin);
};

exports.decide = async (role, id, status) => {
  assertSuperAdmin(role);
  const account = await SellerPayoutAccount.findByPk(id);
  if (!account) throw httpError(404, 'Payout account not found.');
  await account.update({ status });
  return { id: account.id, status: account.status };
};

exports.monthlyEarnings = async (role, query = {}) => {
  assertSuperAdmin(role);

  const m = /^(\d{4})-(\d{2})$/.exec(query.month || '');
  const now = new Date();
  const year = m ? Number(m[1]) : now.getFullYear();
  const month = m ? Number(m[2]) : now.getMonth() + 1;
  if (month < 1 || month > 12) throw httpError(400, 'Invalid month.');

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const items = await OrderItem.findAll({
    include: [
      {
        model: Order,
        as: 'order',
        required: true,
        attributes: ['id'],
        where: {
          ...paidOrCod,
          status: { [Op.in]: COUNTED_STATUSES },
          created_at: { [Op.gte]: start, [Op.lt]: end },
        },
      },
      { model: Product, as: 'product', required: false, attributes: ['seller_id'] },
      { model: Service, as: 'service', required: false, attributes: ['seller_id'] },
    ],
  });

  const totals = {};
  for (const it of items) {
    const sellerId = it.product?.seller_id || it.service?.seller_id;
    if (!sellerId) continue;
    if (!totals[sellerId]) totals[sellerId] = { gross: 0, orders: new Set() };
    totals[sellerId].gross += Number(it.price) * it.quantity;
    totals[sellerId].orders.add(it.order_id);
  }

  const sellerIds = Object.keys(totals).map(Number);
  const sellerWhere = { id: sellerIds };
  if (['product', 'service'].includes(query.seller_type)) sellerWhere.seller_type = query.seller_type;

  const [sellers, bankAccounts] = await Promise.all([
    Seller.findAll({
      where: sellerWhere,
      attributes: ['id', 'full_name', 'store_name', 'email', 'seller_type'],
    }),
    SellerPayoutAccount.findAll({ where: { seller_id: sellerIds }, attributes: ['seller_id', 'status'] }),
  ]);
  const bankStatus = Object.fromEntries(bankAccounts.map((b) => [b.seller_id, b.status]));

  const rows = sellers
    .map((s) => {
      const gross = r2(totals[s.id].gross);
      const commission = r2(gross * COMMISSION_RATE);
      return {
        seller_id: s.id,
        store_name: s.store_name,
        full_name: s.full_name,
        email: s.email,
        seller_type: s.seller_type,
        orders: totals[s.id].orders.size,
        gross_sales: gross,
        commission,
        seller_amount: r2(gross - commission),
        bank_status: bankStatus[s.id] || null,
      };
    })
    .sort((a, b) => b.gross_sales - a.gross_sales);

  const summary = rows.reduce(
    (acc, r) => ({
      gross_sales: r2(acc.gross_sales + r.gross_sales),
      commission: r2(acc.commission + r.commission),
      seller_amount: r2(acc.seller_amount + r.seller_amount),
      orders: acc.orders + r.orders,
    }),
    { gross_sales: 0, commission: 0, seller_amount: 0, orders: 0 }
  );

  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    commission_rate: COMMISSION_RATE * 100,
    rows,
    summary,
  };
};