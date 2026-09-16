const express = require('express');
const router = express.Router();
const mailController = require('../controllers/mailController');
const verifyToken = require('../middlewares/auth');

router.get('/', verifyToken, mailController.list);
router.post('/', verifyToken, mailController.send);

module.exports = router;