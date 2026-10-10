const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const verifyToken = require('../middlewares/auth');
const verifyCustomerToken = require('../middlewares/customerAuth');

router.get('/public', couponController.listPublic);
router.post('/validate', verifyCustomerToken, couponController.validate);
router.get('/', verifyToken, couponController.list);
router.post('/', verifyToken, couponController.create);
router.patch('/:id/status', verifyToken, couponController.setStatus);
router.delete('/:id', verifyToken, couponController.remove);

module.exports = router;