const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const verifyToken = require('../middlewares/auth');

router.get('/public', sellerController.listPublic);

router.get('/requests', verifyToken, sellerController.listRequests);
router.patch('/:id/approve', verifyToken, sellerController.approve);
router.patch('/:id/reject', verifyToken, sellerController.reject);

router.get('/', verifyToken, sellerController.list);
router.get('/me', verifyToken, sellerController.getMe);
router.patch('/me', verifyToken, sellerController.updateMe);
router.patch('/me/password', verifyToken, sellerController.changePassword);
module.exports = router;