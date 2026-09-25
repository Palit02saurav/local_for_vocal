const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const verifyToken = require('../middlewares/auth');

router.get('/requests', verifyToken, vendorController.listRequests);
router.patch('/:id/approve', verifyToken, vendorController.approve);
router.patch('/:id/reject', verifyToken, vendorController.reject);

router.get('/', verifyToken, vendorController.list);
router.get('/me', verifyToken, vendorController.getMe);
router.patch('/me/password', verifyToken, vendorController.changePassword);

module.exports = router;