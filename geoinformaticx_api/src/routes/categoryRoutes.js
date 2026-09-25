const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const verifyToken = require('../middlewares/auth');

router.get('/', verifyToken, categoryController.list);
router.get('/public', categoryController.listPublic);
router.post('/', verifyToken, categoryController.create);
router.patch('/:id', verifyToken, categoryController.update);
router.delete('/:id', verifyToken, categoryController.remove);

module.exports = router;