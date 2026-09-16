const { Product, Seller } = require('../models');
const { Op } = require('sequelize');

function resolveStatus(stock) {
  if (stock <= 0) return 'Out of Stock';
  if (stock <= 10) return 'Low Stock';
  return 'Active';
}

exports.listProducts = async (userId, userRole, productType, approvalStatus) => {
  const where = {};

  if (userRole === 'SELLER') {
    where.seller_id = userId;
    where.approval_status = approvalStatus === 'Pending' ? 'Pending' : 'Approved';
  } else if (userRole === 'SUPER_ADMIN') {
    where[Op.or] = [
      { created_by_role: 'ADMIN' },
      { created_by_role: 'SELLER', approval_status: 'Approved' },
    ];
  } else {
    const err = new Error('Not authorized to view products.');
    err.status = 403;
    throw err;
  }

  where.product_type = productType || 'Regular';

  return Product.findAll({
    where,
    include: [{ model: Seller, as: 'seller', attributes: ['id', 'full_name', 'store_name'] }],
    order: [['created_at', 'DESC']],
  });
};

exports.createProduct = async (body, userId, userRole) => {
  const { name, sku, category, price, stock, image_url, description, product_type } = body;
  let { seller_id } = body;

  let admin_id = null;
  let created_by_role;

  if (userRole === 'SELLER') {
    created_by_role = 'SELLER';
    seller_id = userId;
  } else if (userRole === 'SUPER_ADMIN') {
    created_by_role = 'ADMIN';
    admin_id = userId;
    seller_id = null;
  } else {
    const err = new Error('Not authorized to create products.');
    err.status = 403;
    throw err;
  }

  if (!name || !sku || !category || price == null) {
    const err = new Error('Name, SKU, category, and price are required.');
    err.status = 400;
    throw err;
  }

  const existingSku = await Product.findOne({ where: { sku } });
  if (existingSku) {
    const err = new Error('A product with this SKU already exists.');
    err.status = 409;
    throw err;
  }

  if (created_by_role === 'SELLER') {
    const seller = await Seller.findByPk(seller_id);
    if (!seller) {
      const err = new Error('Seller account not found.');
      err.status = 400;
      throw err;
    }
  }

  const stockNum = Number(stock) || 0;
  const approval_status = created_by_role === 'ADMIN' ? 'Approved' : 'Pending';

  return Product.create({
    name,
    sku,
    category,
    seller_id,
    admin_id,
    created_by_role,
    product_type: product_type === 'Regional Famous' ? 'Regional Famous' : 'Regular',
    approval_status,
    price: Number(price),
    stock: stockNum,
    status: resolveStatus(stockNum),
    image_url: image_url || null,
    description: description || null,
  });
};

exports.listRequests = async (userRole, productType) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }
  const where = {
    created_by_role: 'SELLER',
    approval_status: 'Pending',
    product_type: productType || 'Regular',
  };
  return Product.findAll({
    where,
    include: [{ model: Seller, as: 'seller', attributes: ['id', 'full_name', 'store_name'] }],
    order: [['created_at', 'DESC']],
  });
};

exports.approveProduct = async (id, userRole) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }
  const product = await Product.findByPk(id);
  if (!product) {
    const err = new Error('Product not found.');
    err.status = 404;
    throw err;
  }
  product.approval_status = 'Approved';
  await product.save();
  return product;
};

exports.rejectProduct = async (id, userRole) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }
  const product = await Product.findByPk(id);
  if (!product) {
    const err = new Error('Product not found.');
    err.status = 404;
    throw err;
  }
  product.approval_status = 'Rejected';
  await product.save();
  return product;
};

exports.listPublicProducts = () => {
  return Product.findAll({
    where: {
      approval_status: 'Approved',
      status: { [Op.ne]: 'Out of Stock' }, 
    },
    include: [{ model: Seller, as: 'seller', attributes: ['id', 'full_name', 'store_name', 'location', 'latitude', 'longitude'] }],
    order: [['created_at', 'DESC']],
  });
};