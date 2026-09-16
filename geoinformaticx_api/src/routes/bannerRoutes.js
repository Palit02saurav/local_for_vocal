const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const verifyToken = require('../middlewares/auth');

router.get('/requests', verifyToken, bannerController.listRequests);
router.patch('/:id/approve', verifyToken, bannerController.approve);
router.patch('/:id/reject', verifyToken, bannerController.reject);
router.get('/mine', verifyToken, bannerController.listMine);

router.get('/', verifyToken, bannerController.list);
router.post('/', verifyToken, bannerController.create);
router.post('/:id/create-payment-order', verifyToken, bannerController.createPaymentOrder);
router.post('/:id/verify-payment', verifyToken, bannerController.verifyPayment);
module.exports = router;