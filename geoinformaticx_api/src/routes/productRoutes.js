const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const verifyToken = require('../middlewares/auth');

router.get('/', verifyToken, productController.list);
router.post('/', verifyToken, productController.create);

router.get('/requests', verifyToken, productController.listRequests);
router.patch('/:id/approve', verifyToken, productController.approve);
router.patch('/:id/reject', verifyToken, productController.reject);
router.get('/public', productController.listPublic);

module.exports = router;