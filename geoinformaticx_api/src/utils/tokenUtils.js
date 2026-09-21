const jwt = require('jsonwebtoken');

exports.generateToken = (account, role) =>
  jwt.sign(
    { id: account.id, email: account.email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

exports.setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

exports.generateCustomerToken = (customer) =>
  jwt.sign(
    { id: customer.id, email: customer.email, role: 'CUSTOMER' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );

exports.setCustomerAuthCookie = (res, token) => {
  res.cookie('customer_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};