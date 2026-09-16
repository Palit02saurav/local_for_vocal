const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const verifyCustomerToken = require('../middlewares/customerAuth');
const verifyToken = require('../middlewares/auth');

router.get('/', verifyToken, orderController.listAll);
router.post('/', verifyCustomerToken, orderController.create);
router.get('/products', verifyCustomerToken, orderController.listProductOrders);
router.get('/services', verifyCustomerToken, orderController.listServiceOrders);
router.patch('/:id/status', verifyToken, orderController.updateStatus);
router.patch('/:id/cancel', verifyCustomerToken, orderController.cancel);

module.exports = router;