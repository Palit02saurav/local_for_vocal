const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const verifyCustomerToken = require('../middlewares/customerAuth');
const verifyToken = require('../middlewares/auth');

router.post('/', verifyCustomerToken, reviewController.create);
router.get('/mine', verifyCustomerToken, reviewController.listMine);
router.get('/seller', verifyToken, reviewController.listForSeller);
router.get('/product/:productId', reviewController.listForProduct); // public

module.exports = router;