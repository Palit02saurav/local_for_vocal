const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const verifyToken = require('../middlewares/auth');

router.get('/', verifyToken, notificationController.list);
router.patch('/read-all', verifyToken, notificationController.markAllRead);
router.patch('/:id/read', verifyToken, notificationController.markRead);

module.exports = router;