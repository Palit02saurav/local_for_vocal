const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const verifyCustomerToken = require('../middlewares/customerAuth');

router.use(verifyCustomerToken);

router.get('/', cartController.getCart);
router.post('/', cartController.addItem);
router.patch('/:id', cartController.updateQuantity);
router.delete('/:id', cartController.removeItem);
router.delete('/', cartController.clearCart);

module.exports = router;