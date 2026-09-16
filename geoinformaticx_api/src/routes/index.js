const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/customer/auth', require('./customerAuthRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/sellers', require('./sellerRoutes'));
router.use('/categories', require('./categoryRoutes'));
router.use('/services', require('./serviceRoutes'));
router.use('/banners', require('./bannerRoutes'));
router.use('/customers', require('./customerRoutes'));
const cartRoutes = require('./cartRoutes');
router.use('/cart', cartRoutes);
const wishlistRoutes = require('./wishlistRoutes');
router.use('/wishlist', wishlistRoutes);
module.exports = router;

router.use('/orders', require('./orderRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/mails', require('./mailRoutes'));
router.use('/uploads', require('./uploadRoutes'));