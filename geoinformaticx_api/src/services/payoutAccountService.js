const { Op } = require('sequelize');
const { SellerPayoutAccount, Seller, Vendor, Order, OrderItem, Product, Service } = require('../models');

const COMMISSION_RATE = 0.10;            
const COUNTED_STATUSES = ['Delivered'];
const COUNTED_SERVICE_STATUSES = ['Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
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
    : a.vendor
    ? {
        id: a.vendor.id,
        full_name: a.vendor.full_name,
        store_name: null,
        email: null,
        phone: a.vendor.phone,
        seller_type: 'vendor',
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

  // Street vendors keep their accounts under vendor_id, not seller_id
  if (query.seller_type === 'vendor') {
    const vendorAccounts = await SellerPayoutAccount.findAll({
      where,
      include: [{
        model: Vendor,
        as: 'vendor',
        attributes: ['id', 'full_name', 'phone'],
        required: true,
      }],
      order: [['updated_at', 'DESC']],
    });
    return vendorAccounts.map(toAdmin);
  }

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
        attributes: ['id', 'status'],
        where: {
          ...paidOrCod,
          status: { [Op.in]: COUNTED_SERVICE_STATUSES },
          created_at: { [Op.gte]: start, [Op.lt]: end },
        },
      },
      { model: Product, as: 'product', required: false, attributes: ['seller_id', 'vendor_id'] },
      { model: Service, as: 'service', required: false, attributes: ['seller_id'] },
    ],
  });

  const totals = {};
  for (const it of items) {
    const counted = it.item_type === 'service' ? COUNTED_SERVICE_STATUSES : COUNTED_STATUSES;
    if (!counted.includes(it.order.status)) continue;

    let key = null;
    if (it.product?.seller_id) key = `s:${it.product.seller_id}`;
    else if (it.service?.seller_id) key = `s:${it.service.seller_id}`;
    else if (it.product?.vendor_id) key = `v:${it.product.vendor_id}`;
    if (!key) continue;

    if (!totals[key]) totals[key] = { gross: 0, orders: new Set() };
    totals[key].gross += Number(it.price) * it.quantity;
    totals[key].orders.add(it.order_id);
  }

  const sellerIds = Object.keys(totals).filter((k) => k.startsWith('s:')).map((k) => Number(k.slice(2)));
  const vendorIds = Object.keys(totals).filter((k) => k.startsWith('v:')).map((k) => Number(k.slice(2)));

  const wantSellers = query.seller_type !== 'vendor';
  const wantVendors = !['product', 'service'].includes(query.seller_type);

  const sellerWhere = { id: sellerIds };
  if (['product', 'service'].includes(query.seller_type)) sellerWhere.seller_type = query.seller_type;

  const [sellers, vendors, sellerBanks, vendorBanks] = await Promise.all([
    wantSellers && sellerIds.length
      ? Seller.findAll({ where: sellerWhere, attributes: ['id', 'full_name', 'store_name', 'email', 'seller_type'] })
      : [],
    wantVendors && vendorIds.length
      ? Vendor.findAll({ where: { id: vendorIds }, attributes: ['id', 'full_name', 'phone'] })
      : [],
    sellerIds.length
      ? SellerPayoutAccount.findAll({ where: { seller_id: sellerIds }, attributes: ['seller_id', 'status'] })
      : [],
    vendorIds.length
      ? SellerPayoutAccount.findAll({ where: { vendor_id: vendorIds }, attributes: ['vendor_id', 'status'] })
      : [],
  ]);
  const sellerBankStatus = Object.fromEntries(sellerBanks.map((b) => [b.seller_id, b.status]));
  const vendorBankStatus = Object.fromEntries(vendorBanks.map((b) => [b.vendor_id, b.status]));

  const buildRow = (key, base, bank) => {
    const gross = r2(totals[key].gross);
    const commission = r2(gross * COMMISSION_RATE);
    return {
      ...base,
      orders: totals[key].orders.size,
      gross_sales: gross,
      commission,
      seller_amount: r2(gross - commission),
      bank_status: bank || null,
    };
  };

  const rows = [
    ...sellers.map((s) =>
      buildRow(`s:${s.id}`, {
        row_key: `s-${s.id}`,
        seller_id: s.id,
        store_name: s.store_name,
        full_name: s.full_name,
        email: s.email,
        seller_type: s.seller_type,
      }, sellerBankStatus[s.id])
    ),
    ...vendors.map((v) =>
      buildRow(`v:${v.id}`, {
        row_key: `v-${v.id}`,
        seller_id: v.id,
        store_name: null,
        full_name: v.full_name,
        email: v.phone, // vendors have no email, show phone instead
        seller_type: 'vendor',
      }, vendorBankStatus[v.id])
    ),
  ].sort((a, b) => b.gross_sales - a.gross_sales);

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