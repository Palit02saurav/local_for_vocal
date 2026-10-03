const express = require('express');
const router = express.Router();
const controller = require('../controllers/payoutAccountController');
const verifyToken = require('../middlewares/auth');

router.get('/me', verifyToken, controller.getMine);
router.put('/me', verifyToken, controller.saveMine);

router.get('/', verifyToken, controller.listAll);
router.get('/earnings', verifyToken, controller.monthlyEarnings);
router.patch('/:id/verify', verifyToken, controller.verify);
router.patch('/:id/reject', verifyToken, controller.reject);

module.exports = router;