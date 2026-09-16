const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const verifyToken = require('../middlewares/auth');

router.get('/requests', verifyToken, serviceController.listRequests);
router.patch('/:id/approve', verifyToken, serviceController.approve);
router.patch('/:id/reject', verifyToken, serviceController.reject);

router.get('/public', serviceController.listPublic);

router.get('/', verifyToken, serviceController.list);
router.post('/', verifyToken, serviceController.create);
router.get('/public/:sku', serviceController.getPublicBySlug);

module.exports = router;    