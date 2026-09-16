const CustomerAuthService = require('../services/customerAuthService');
const CommonService = require('../services/commonService');

exports.signup = async (req, res) => {
  try {
    const user = await CustomerAuthService.signup(req.body);
    CommonService.sendResponse(res, 201, true, 'Signup successful. Please check your email for the OTP.', { user });
  } catch (err) {
    console.error('Customer signup error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error during signup.');
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await CustomerAuthService.verifyOtp(email, otp, res);
    CommonService.sendResponse(res, 200, true, 'Account verified successfully.', { user });
  } catch (err) {
    console.error('Verify OTP error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'OTP verification failed.');
  }
};

exports.resendOtp = async (req, res) => {
  try {
    await CustomerAuthService.resendOtp(req.body.email);
    CommonService.sendResponse(res, 200, true, 'OTP resent successfully.');
  } catch (err) {
    console.error('Resend OTP error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Failed to resend OTP.');
  }
};

exports.login = async (req, res) => {
  try {
    const user = await CustomerAuthService.login(req.body, res);
    CommonService.sendResponse(res, 200, true, 'Login successful.', { user });
  } catch (err) {
    console.error('Customer login error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error during login.');
  }
};

exports.logout = (req, res) => {
  res.clearCookie('customer_token');
  CommonService.sendResponse(res, 200, true, 'Logged out successfully.');
};

exports.me = async (req, res) => {
  try {
    const user = await CustomerAuthService.me(req.customerId);
    CommonService.sendResponse(res, 200, true, 'Customer fetched successfully', { user });
  } catch (err) {
    console.error('Customer me error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error.');
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const customer = await CustomerAuthService.updateProfile(req.customerId, req.body);
    CommonService.sendResponse(res, 200, true, 'Profile updated successfully.', { user: customer });
  } catch (err) {
    console.error('Update profile error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error updating profile.');
  }
};