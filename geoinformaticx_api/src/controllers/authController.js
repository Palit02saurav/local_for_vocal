const AuthService = require('../services/authService');
const CommonService = require('../services/commonService');
const { clearAuthCookie } = require('../utils/tokenUtils');

exports.signup = async (req, res) => {
  try {
    const user = await AuthService.signup(req.body);
    CommonService.sendResponse(res, 201, true, 'Signup request submitted. You will be able to log in once an admin approves your account.', { user });
  } catch (err) {
    console.error('Signup error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error during signup.');
  }
};

exports.login = async (req, res) => {
  try {
    const user = await AuthService.login(req.body, res);
    CommonService.sendResponse(res, 200, true, 'Login successful.', { user });
  } catch (err) {
    console.error('Login error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error during login.');
  }
};

exports.logout = (req, res) => {
  clearAuthCookie(res);
  CommonService.sendResponse(res, 200, true, 'Logged out successfully.');
};

exports.me = async (req, res) => {
  try {
    const user = await AuthService.me(req.userId, req.userRole);
    CommonService.sendResponse(res, 200, true, 'User fetched successfully', { user });
  } catch (err) {
    console.error('Me error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error.');
  }
};