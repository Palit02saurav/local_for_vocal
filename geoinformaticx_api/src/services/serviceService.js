const { Service, Seller } = require('../models');
const { Op } = require('sequelize');

// function resolveStatus(stock) {
//   if (stock === 0) return 'Out of Stock';
//   if (stock <= 10) return 'Low Stock';
//   return 'Active';
// }

exports.listServices = async (userId, userRole) => {
  const where = {};

  if (userRole === 'SELLER') {
    where.seller_id = userId;
    where.approval_status = 'Approved';
  } else if (userRole === 'VENDOR') {
    where.vendor_id = userId;
  } else if (userRole === 'SUPER_ADMIN') {
    where[Op.or] = [
      { created_by_role: 'ADMIN' },
      { created_by_role: 'SELLER', approval_status: 'Approved' },
    ];
  } else {
    const err = new Error('Not authorized to view services.');
    err.status = 403;
    throw err;
  }

  return Service.findAll({
    where,
    include: [{ model: Seller, as: 'seller', attributes: ['id', 'full_name', 'store_name'] }],
    order: [['created_at', 'DESC']],
  });
};

exports.createService = async (body, userId, userRole) => {
  const {
    name, category, price, status, image_url, description,
    price_type, price_unit, duration, coverage_areas, requirements,
  } = body;

  if (!name || !category || !price) {
    const err = new Error('Required fields are missing.');
    err.status = 400;
    throw err;
  }

  const sku = `SRV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const created_by_role = userRole === 'SUPER_ADMIN' ? 'ADMIN' : 'SELLER';
  const seller_id = userRole === 'SELLER' ? userId : (body.seller_id || null);
  const admin_id = userRole === 'SUPER_ADMIN' ? userId : null;
  const approval_status = created_by_role === 'ADMIN' ? 'Approved' : 'Pending';

  return Service.create({
    name,
    sku,
    category,
    seller_id,
    admin_id,
    created_by_role,
    approval_status,
    price: Number(price),
    status: status || 'Active',
    image_url: image_url || null,
    description: description || null,
    price_type: price_type || 'Fixed',
    price_unit: price_unit || null,
    duration: duration || null,
    coverage_areas: coverage_areas || null,
    requirements: requirements || null,
  });
};

exports.listRequests = async (userRole) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }
  return Service.findAll({
    where: { created_by_role: 'SELLER', approval_status: 'Pending' },
    include: [{ model: Seller, as: 'seller', attributes: ['id', 'full_name', 'store_name'] }],
    order: [['created_at', 'DESC']],
  });
};

exports.approveService = async (id, userRole) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }
  const service = await Service.findByPk(id);
  if (!service) {
    const err = new Error('Service not found.');
    err.status = 404;
    throw err;
  }
  service.approval_status = 'Approved';
  await service.save();
  return service;
};

exports.rejectService = async (id, userRole) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }
  const service = await Service.findByPk(id);
  if (!service) {
    const err = new Error('Service not found.');
    err.status = 404;
    throw err;
  }
  service.approval_status = 'Rejected';
  await service.save();
  return service;
};

exports.listPublicServices = () => {
  return Service.findAll({
    where: { approval_status: 'Approved', status: 'Active' },
    include: [{ model: Seller, as: 'seller', attributes: ['id', 'full_name', 'store_name', 'location', 'latitude', 'longitude'] }],
    order: [['created_at', 'DESC']],
  });
};


exports.getPublicServiceBySku = async (sku) => {
  const service = await Service.findOne({
    where: { sku, approval_status: 'Approved', status: 'Active' },
    include: [{ model: Seller, as: 'seller', attributes: ['id', 'full_name', 'store_name', 'location'] }],
  });
  if (!service) {
    const err = new Error('Service not found.');
    err.status = 404;
    throw err;
  }
  return service;
};