const express = require('express');
const router = express.Router();
const customerAuthController = require('../controllers/customerAuthController');
const verifyCustomerToken = require('../middlewares/customerAuth');

router.post('/signup', customerAuthController.signup);
router.post('/login', customerAuthController.login);
router.post('/logout', customerAuthController.logout);
router.post('/verify-otp', customerAuthController.verifyOtp);
router.post('/resend-otp', customerAuthController.resendOtp);
router.get('/me', verifyCustomerToken, customerAuthController.me);
router.patch('/me', verifyCustomerToken, customerAuthController.updateProfile);
module.exports = router;    