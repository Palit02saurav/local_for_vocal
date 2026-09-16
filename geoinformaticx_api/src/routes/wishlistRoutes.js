const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const verifyCustomerToken = require('../middlewares/customerAuth');

router.use(verifyCustomerToken);

router.get('/', wishlistController.getWishlist);
router.post('/', wishlistController.addItem);
router.delete('/:id', wishlistController.removeItem);
router.delete('/by-product', wishlistController.removeByProduct);
router.delete('/', wishlistController.clearWishlist);

module.exports = router;