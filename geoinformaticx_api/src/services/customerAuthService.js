const bcrypt = require('bcrypt');
const { Customer, Review } = require('../models');
const { generateCustomerToken, setCustomerAuthCookie } = require('../utils/tokenUtils');
const { generateOtp, sendOtpEmail, sendOtpSms } = require('../utils/otpUtils');

// Temporary in-memory store for unverified signups.
// Key: email → { name, phone, password_hash, otp, expiresAt }
const pendingSignups = new Map();

const PENDING_TTL_MS = 10 * 60 * 1000; // 10 minutes

exports.signup = async (body) => {
  const { name, email, phone, password } = body;
  if (!name?.trim() || !email?.trim() || !phone?.trim() || !password?.trim()) {
    const err = new Error('All fields are required.');
    err.status = 400;
    throw err;
  }

  if (!/^\d{10}$/.test(phone)) {
    const err = new Error('Mobile number must be exactly 10 digits.');
    err.status = 400;
    throw err;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Only block if a REAL, already-verified account exists with this email.
  const existing = await Customer.findOne({ where: { email: normalizedEmail } });
  if (existing) {
    const err = new Error('An account with this email already exists.');
    err.status = 409;
    throw err;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const otp = generateOtp();

  // Store pending signup — nothing written to the customers table yet.
  pendingSignups.set(normalizedEmail, {
    name: name.trim(),
    email: normalizedEmail,
    phone,
    password_hash,
    otp,
    expiresAt: Date.now() + PENDING_TTL_MS,
  });

  sendOtpEmail(normalizedEmail, name.trim(), otp).catch((err) =>
    console.error('Failed to send OTP email:', err)
  );
  sendOtpSms(phone, otp).catch((err) =>
    console.error('Failed to send OTP SMS:', err)
  );

  return { email: normalizedEmail };
};

exports.login = async (body, res) => {
  const { email, password } = body;
  if (!email?.trim() || !password?.trim()) {
    const err = new Error('Email and password are required.');
    err.status = 400;
    throw err;
  }

  const customer = await Customer.findOne({ where: { email: email.trim().toLowerCase() } });
  if (!customer || !customer.is_active) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, customer.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  const token = generateCustomerToken(customer);
  setCustomerAuthCookie(res, token);

  return { id: customer.id, name: customer.name, email: customer.email };
};
exports.updateProfile = async (customerId, body) => {
  const customer = await Customer.findByPk(customerId);
  if (!customer) {
    const err = new Error('Account not found.');
    err.status = 404;
    throw err;
  }

  const { name, phone, dob, address, city, state, pincode } = body;
  if (name !== undefined) customer.name = name;
  if (phone !== undefined) customer.phone = phone;
  if (dob !== undefined) customer.dob = dob === "" ? null : dob;
  if (address !== undefined) customer.address = address;
  if (city !== undefined) customer.city = city;
  if (state !== undefined) customer.state = state;
  if (pincode !== undefined) customer.pincode = pincode;

  await customer.save();
  return customer;
};

exports.updateAvatar = async (customerId, url) => {
  const customer = await Customer.findByPk(customerId);
  if (!customer) {
    const err = new Error('Account not found.');
    err.status = 404;
    throw err;
  }
  customer.avatar_url = url;
  await customer.save();
  return { avatar_url: customer.avatar_url };
};


exports.changePassword = async (customerId, currentPassword, newPassword) => {
  if (!currentPassword?.trim() || !newPassword?.trim()) {
    const err = new Error('Current and new password are required.');
    err.status = 400;
    throw err;
  }
  if (newPassword.length < 6) {
    const err = new Error('New password must be at least 6 characters.');
    err.status = 400;
    throw err;
  }

  const customer = await Customer.findByPk(customerId);
  if (!customer) {
    const err = new Error('Account not found.');
    err.status = 404;
    throw err;
  }

  const isMatch = await bcrypt.compare(currentPassword, customer.password_hash);
  if (!isMatch) {
    const err = new Error('Current password is incorrect.');
    err.status = 400;
    throw err;
  }
  if (currentPassword === newPassword) {
    const err = new Error('New password must be different from the current password.');
    err.status = 400;
    throw err;
  }

  customer.password_hash = await bcrypt.hash(newPassword, 10);
  await customer.save();
};

exports.me = async (customerId) => {
  const customer = await Customer.findByPk(customerId, {
    attributes: ['id', 'name', 'email', 'phone', 'dob', 'address', 'city', 'state', 'pincode', 'avatar_url', 'is_active', 'created_at'],
  });
  if (!customer || !customer.is_active) {
    const err = new Error('Not authenticated.');
    err.status = 401;
    throw err;
  }
  const reviews_count= await Review.count({ where: { customer_id: customerId } });
  return { ...customer.toJSON(), reviews_count };
};
exports.verifyOtp = async (email, otp, res) => {
  const normalizedEmail = email.trim().toLowerCase();
  const pending = pendingSignups.get(normalizedEmail);

  if (!pending) {
    const err = new Error('No pending signup found for this email. Please sign up again.');
    err.status = 404;
    throw err;
  }

  if (Date.now() > pending.expiresAt) {
    pendingSignups.delete(normalizedEmail);
    const err = new Error('OTP has expired. Please sign up again.');
    err.status = 400;
    throw err;
  }

  if (pending.otp !== otp) {
    const err = new Error('Invalid OTP.');
    err.status = 400;
    throw err;
  }

  // OTP correct — NOW we actually create the real customer record.
  const customer = await Customer.create({
    name: pending.name,
    email: pending.email,
    phone: pending.phone,
    password_hash: pending.password_hash,
    is_active: true,
  });

  pendingSignups.delete(normalizedEmail);

  const token = generateCustomerToken(customer);
  setCustomerAuthCookie(res, token);

  return { id: customer.id, name: customer.name, email: customer.email };
};

exports.resendOtp = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();
  const pending = pendingSignups.get(normalizedEmail);

  if (!pending) {
    const err = new Error('No pending signup found for this email. Please sign up again.');
    err.status = 404;
    throw err;
  }

  const otp = generateOtp();
  pending.otp = otp;
  pending.expiresAt = Date.now() + PENDING_TTL_MS;
  pendingSignups.set(normalizedEmail, pending);   

  sendOtpEmail(pending.email, pending.name, otp).catch((err) =>
    console.error('Failed to send OTP email:', err)
  );
  sendOtpSms(pending.phone, otp).catch((err) =>
    console.error('Failed to send OTP SMS:', err)
  );
};

exports.skipOtp = async (email, res) => {
  if (process.env.ALLOW_SKIP_OTP !== 'true') {
    const err = new Error('Skipping verification is not available.');
    err.status = 403;
    throw err;
  }

  const normalizedEmail = (email || '').trim().toLowerCase();
  const pending = pendingSignups.get(normalizedEmail);

  if (!pending) {
    const err = new Error('No pending signup found for this email. Please sign up again.');
    err.status = 404;
    throw err;
  }

  if (Date.now() > pending.expiresAt) {
    pendingSignups.delete(normalizedEmail);
    const err = new Error('Signup has expired. Please sign up again.');
    err.status = 400;
    throw err;
  }

  const customer = await Customer.create({
    name: pending.name,
    email: pending.email,
    phone: pending.phone,
    password_hash: pending.password_hash,
    is_active: true,
  });

  pendingSignups.delete(normalizedEmail);

  const token = generateCustomerToken(customer);
  setCustomerAuthCookie(res, token);

  return { id: customer.id, name: customer.name, email: customer.email };
};

// exports.me = async (customerId) => {
//   const customer = await Customer.findByPk(customerId, {
//     attributes: ['id', 'name', 'email', 'phone', 'is_active'],
//   });
//   if (!customer || !customer.is_active) {
//     const err = new Error('Not authenticated.');
//     err.status = 401;
//     throw err;
//   }
//   return customer;
// };