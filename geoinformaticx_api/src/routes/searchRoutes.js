const express = require('express');
const { Op } = require('sequelize');
const { Product, Service, Seller } = require('../models');

const router = express.Router();
const notEmpty = { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] };

router.get('/suggestions', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().slice(0, 60);
    if (!q) return res.json({ success: true, data: { suggestions: [] } });

    const like = { [Op.like]: `%${q}%` }; // MySQL LIKE is case-insensitive by default

    const [products, services, stores] = await Promise.all([
      Product.findAll({
        where: {
          approval_status: 'Approved',
          status: { [Op.ne]: 'Out of Stock' },
          [Op.or]: [{ name: like }, { category: like }],
        },
        attributes: ['id', 'name', 'sku'],
        limit: 6,
      }),
      Service.findAll({
        where: {
          approval_status: 'Approved',
          status: 'Active',
          [Op.or]: [{ name: like }, { category: like }],
        },
        attributes: ['id', 'name', 'sku'],
        limit: 4,
      }),
      Seller.findAll({
        where: {
          approval_status: 'Approved',
          is_active: true,
          business_address: notEmpty,
          profile_image_url: notEmpty,
          [Op.or]: [{ store_name: like }, { full_name: like }],
        },
        attributes: ['id', 'store_name', 'full_name'],
        limit: 4,
      }),
    ]);

    const lq = q.toLowerCase();
    const all = [
      ...products.map((p) => ({ type: 'product', label: p.name, sku: p.sku })),
      ...services.map((s) => ({ type: 'service', label: s.name, sku: s.sku })),
      ...stores.map((s) => ({ type: 'store', label: s.store_name || s.full_name, id: s.id })),
    ];

    // names that START with the text come first, then the rest
    all.sort(
      (a, b) =>
        Number(b.label.toLowerCase().startsWith(lq)) -
        Number(a.label.toLowerCase().startsWith(lq))
    );

    // remove duplicates, keep 8
    const seen = new Set();
    const suggestions = all
      .filter((x) => {
        const k = `${x.type}:${x.label.toLowerCase()}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, 8);

    res.json({ success: true, data: { suggestions } });
  } catch (err) {
    console.error('Search suggestions error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching suggestions.' });
  }
});

module.exports = router;