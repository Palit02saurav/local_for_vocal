const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const verifyCustomerToken = require('../middlewares/customerAuth');
const verifyToken = require('../middlewares/auth');

router.post('/', verifyCustomerToken, returnController.create);
router.get('/', verifyToken, returnController.list);
router.patch('/:id/status', verifyToken, returnController.updateStatus);

module.exports = router;