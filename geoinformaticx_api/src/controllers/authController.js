const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Admin, Seller } = require('../models');

const generateToken = (account, role) =>
  jwt.sign(
    { id: account.id, email: account.email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// POST /api/auth/signup — always creates a SELLER account.
// Admin accounts are never self-registered; they're seeded directly in the DB.
exports.signup = async (req, res) => {
  try {
    const { full_name, email, password, store_name, phone } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const existing = await Seller.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const seller = await Seller.create({
      full_name,
      email,
      password_hash,
      store_name: store_name || null,
      phone: phone || null,
    });

    const token = generateToken(seller, 'SELLER');
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Seller account created successfully.',
      user: { id: seller.id, full_name: seller.full_name, email: seller.email, role: 'SELLER' },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Server error during signup.' });
  }
};

// POST /api/auth/login — checks the correct table based on the role picked in the dropdown
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Email, password, and role are required.' });
    }

    const Model = role === 'SUPER_ADMIN' ? Admin : Seller;
    const account = await Model.findOne({ where: { email } });

    if (!account) {
      return res.status(401).json({
        success: false,
        message: `No ${role === 'SUPER_ADMIN' ? 'Admin' : 'Seller'} account found with this email.`,
      });
    }

    const isMatch = await bcrypt.compare(password, account.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const resolvedRole = role === 'SUPER_ADMIN' ? account.role : 'SELLER';
    const token = generateToken(account, resolvedRole);
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: 'Login successful.',
      user: { id: account.id, full_name: account.full_name, email: account.email, role: resolvedRole },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully.' });
};

exports.me = async (req, res) => {
  try {
    const Model = req.userRole === 'SUPER_ADMIN' ? Admin : Seller;
    const account = await Model.findByPk(req.userId, {
      attributes: ['id', 'full_name', 'email'],
    });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found.' });
    res.json({ success: true, user: { ...account.toJSON(), role: req.userRole } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};  