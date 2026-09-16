const bcrypt = require('bcrypt');
const { Admin, Seller } = require('../models');
const { generateToken, setAuthCookie } = require('../utils/tokenUtils');
const NotificationService = require('./notificationService');

exports.signup = async (body) => {
  const {
    full_name, email, store_name, phone, location, seller_type,
    gst_number, business_registration_number, pan_number,
    latitude, longitude,
  } = body;

  if (!full_name || !email || !store_name || !phone || !location || !seller_type) {
    const err = new Error('All fields are required.');
    err.status = 400;
    throw err;
  }

  if (!['product', 'service'].includes(seller_type)) {
    const err = new Error('Invalid seller type.');
    err.status = 400;
    throw err;
  }

  if (!/^\d{10}$/.test(phone)) {
    const err = new Error('Mobile number must be exactly 10 digits.');
    err.status = 400;
    throw err;
  }

  if (gst_number && !/^[0-9A-Z]{15}$/.test(gst_number)) {
    const err = new Error('GST number must be 15 characters.');
    err.status = 400;
    throw err;
  }

  if (pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan_number)) {
    const err = new Error('Enter a valid PAN number.');
    err.status = 400;
    throw err;
  }

  const existing = await Seller.findOne({ where: { email } });
  if (existing) {
    const err = new Error('An account with this email already exists.');
    err.status = 409;
    throw err;
  }

  const seller = await Seller.create({
    full_name,
    email,
    store_name,
    phone,
    location,
    latitude: latitude || null,
    longitude: longitude || null,
    seller_type,
    gst_number: gst_number || null,
    business_registration_number: business_registration_number || null,
    pan_number: pan_number || null,
    password_hash: null,
    approval_status: 'Pending',
  });

  await NotificationService.create({
    type: 'SELLER_SIGNUP',
    title: 'New seller signup request',
    message: `${seller.full_name} applied to sell ${seller.seller_type === 'service' ? 'services' : 'products'} as "${seller.store_name}".`,
    link: '/sellers/requests',
    recipientRole: 'SUPER_ADMIN',
  });

  return { id: seller.id, full_name: seller.full_name, email: seller.email };
};

exports.login = async (body, res) => {
  const { email, password } = body;

  if (!email || !password) {
    const err = new Error('Email and password are required.');
    err.status = 400;
    throw err;
  }

  let account = await Admin.findOne({ where: { email } });
  let resolvedRole = account ? account.role : null;

  if (!account) {
    account = await Seller.findOne({ where: { email } });
    resolvedRole = 'SELLER';
  }

  if (!account) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, account.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  const token = generateToken(account, resolvedRole);
  setAuthCookie(res, token);

  return {
    id: account.id,
    full_name: account.full_name,
    email: account.email,
    role: resolvedRole,
    seller_type: resolvedRole === 'SELLER' ? account.seller_type : null,
  };
};

exports.me = async (userId, userRole) => {
  const Model = userRole === 'SUPER_ADMIN' ? Admin : Seller;
  const attrs = userRole === 'SUPER_ADMIN'
    ? ['id', 'full_name', 'email']
    : ['id', 'full_name', 'email', 'seller_type', 'store_name', 'phone', 'location', 'business_address'];

  const account = await Model.findByPk(userId, { attributes: attrs });
  if (!account) {
    const err = new Error('Account not found.');
    err.status = 404;
    throw err;
  }
  return { ...account.toJSON(), role: userRole };
};