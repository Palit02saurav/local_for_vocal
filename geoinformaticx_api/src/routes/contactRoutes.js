const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

router.post('/', contactController.submit);
router.post('/seller-application', contactController.sellerApplication);
router.post('/subscribe', contactController.subscribe);

module.exports = router;