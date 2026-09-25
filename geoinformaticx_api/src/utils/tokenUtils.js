const jwt = require('jsonwebtoken');

const isProd = process.env.NODE_ENV === 'production';

// The SAME options must be used when setting and clearing a cookie.
// Prod (dashboard and API on different domains): SameSite=None + Secure
// Local dev (localhost, same-site): Lax works and needs no HTTPS
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
};

exports.generateToken = (account, role) =>
  jwt.sign(
    { id: account.id, email: account.email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

exports.setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

exports.clearAuthCookie = (res) => {
  res.clearCookie('token', cookieOptions);
};

exports.generateCustomerToken = (customer) =>
  jwt.sign(
    { id: customer.id, email: customer.email, role: 'CUSTOMER' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );

exports.setCustomerAuthCookie = (res, token) => {
  res.cookie('customer_token', token, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

exports.clearCustomerAuthCookie = (res) => {
  res.clearCookie('customer_token', cookieOptions);
};