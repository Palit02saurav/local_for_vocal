const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const verifyToken = require('../middlewares/auth');

router.get('/', verifyToken, customerController.list);

module.exports = router;