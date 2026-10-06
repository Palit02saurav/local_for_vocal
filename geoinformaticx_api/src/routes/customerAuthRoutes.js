const express = require('express');
const router = express.Router();
const customerAuthController = require('../controllers/customerAuthController');
const verifyCustomerToken = require('../middlewares/customerAuth');
const upload = require('../middlewares/upload');
const CommonService = require('../services/commonService');

router.post('/signup', customerAuthController.signup);
router.post('/login', customerAuthController.login);
router.post('/logout', customerAuthController.logout);
router.post('/verify-otp', customerAuthController.verifyOtp);
router.post('/skip-otp', customerAuthController.skipOtp);
router.post('/resend-otp', customerAuthController.resendOtp);
router.get('/me', verifyCustomerToken, customerAuthController.me);
router.patch('/me', verifyCustomerToken, customerAuthController.updateProfile);
router.post('/me/avatar', verifyCustomerToken, upload.single('image'), customerAuthController.uploadAvatar);
router.patch('/me/password', verifyCustomerToken, customerAuthController.changePassword);

router.use((err, req, res, next) => {
  CommonService.sendResponse(res, 400, false, err.message || 'Image upload failed.');
});

module.exports = router; 