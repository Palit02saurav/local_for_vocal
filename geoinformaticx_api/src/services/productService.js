const { Product, Seller, Vendor, Producteditrequest: ProductEditRequest } = require('../models');
const { Op } = require('sequelize');

const EDITABLE_FIELDS = ['category', 'price', 'stock', 'image_url', 'gallery_urls', 'description'];

function resolveStatus(stock) {
  if (stock <= 0) return 'Out of Stock';
  if (stock <= 10) return 'Low Stock';
  return 'Active';
}

exports.listProducts = async (userId, userRole, productType, approvalStatus, deliveryType) => {
  const where = {};

  if (userRole === 'SELLER') {
    where.seller_id = userId;
    where.approval_status = approvalStatus === 'Pending' ? 'Pending' : 'Approved';
  } else if (userRole === 'VENDOR') {
    where.vendor_id = userId;
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

  if (productType !== 'All') where.product_type = productType || 'Regular';
  if (deliveryType !== 'All') where.delivery_type = deliveryType === 'Fresh' ? 'Fresh' : 'Standard';  

  return Product.findAll({
    where,
    include: [
      { model: Seller, as: 'seller', attributes: ['id', 'full_name', 'store_name'] },
      { model: Vendor, as: 'vendor', attributes: ['id', 'full_name'] },
    ],
    order: [['created_at', 'DESC']],
  });
};

exports.createProduct= async (body, userId, userRole) => {
 const {
    name, sku, category, price, stock, image_url, gallery_urls, description, product_type,
    delivery_type, unit, shelf_life, prep_time_minutes,
  } = body;
  let { seller_id } = body;

  let admin_id = null;
  let created_by_role;

    let vendor_id = null;

  if (userRole === 'SELLER') {
    created_by_role = 'SELLER';
    seller_id = userId;
  } else if (userRole === 'VENDOR') {
    created_by_role = 'VENDOR';
    vendor_id = userId;
    seller_id = null;
  } else if (userRole === 'SUPER_ADMIN') {
    created_by_role = 'ADMIN';
    admin_id = userId;
    seller_id = null;
  } else {
    const err = new Error('Not authorized to create products.');
    err.status = 403;
    throw err;
  }

  if (!name || !category || price == null) {
    const err = new Error('Name, category, and price are required.');
    err.status = 400;
    throw err;
  }
  if (created_by_role !== 'VENDOR' && !sku) {
    const err = new Error('SKU is required.');
    err.status = 400;
    throw err;
  }

const isFresh = delivery_type === 'Fresh';
  if (isFresh) {
    if (!image_url) {
      const err = new Error('At least one image is required for Fresh Delivery products.');
      err.status = 400;
      throw err;
    }
    if (!unit) {
      const err = new Error('Unit is required for Fresh Delivery products.');
      err.status = 400;
      throw err;
    }
    if (created_by_role !== 'VENDOR' && !prep_time_minutes) {
      const err = new Error('Packing time is required for Fresh Delivery products.');
      err.status = 400;
      throw err;
    }
  }

  // Vendors don't enter a SKU on the form — generate one server-side.
  const finalSku = sku || `VND-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const existingSku = await Product.findOne({ where: { sku: finalSku } });
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

const VENDOR_DEFAULT_STOCK = 100; // change as you like
  const stockNum =
    created_by_role === 'VENDOR' && (stock === undefined || stock === null || stock === '')
      ? VENDOR_DEFAULT_STOCK
      : Number(stock) || 0;
  const approval_status = created_by_role === 'ADMIN' || created_by_role === 'VENDOR'
    ? 'Approved'
    : 'Pending';

  return Product.create({
    name,
    sku: finalSku,
    category,
    seller_id,
    admin_id,
    vendor_id,
    created_by_role,
  product_type: !isFresh && product_type === 'Regional Famous' ? 'Regional Famous' : 'Regular',
    delivery_type: isFresh ? 'Fresh' : 'Standard',
    unit: isFresh ? unit : null,
    shelf_life: isFresh ? shelf_life || null : null,
    prep_time_minutes: isFresh && prep_time_minutes ? Number(prep_time_minutes) : null,
    approval_status,
    price: Number(price),
    stock: stockNum,
    status: resolveStatus(stockNum),
    image_url: image_url || null,
    gallery_urls: gallery_urls || null,
    description: description || null,
  });
};

//   if (userRole === 'SELLER') {
//     created_by_role = 'SELLER';
//     seller_id = userId;
//   } else if (userRole === 'SUPER_ADMIN') {
//     created_by_role = 'ADMIN';
//     admin_id = userId;
//     seller_id = null;
//   } else {
//     const err = new Error('Not authorized to create products.');
//     err.status = 403;
//     throw err;
//   }

//   if (!name || !sku || !category || price == null) {
//     const err = new Error('Name, SKU, category, and price are required.');
//     err.status = 400;
//     throw err;
//   }

// const isFresh = delivery_type === 'Fresh';
//   if (isFresh) {
//     if (!image_url) {
//       const err = new Error('At least one image is required for Fresh Delivery products.');
//       err.status = 400;
//       throw err;
//     }
//     if (!unit || !prep_time_minutes) {
//       const err = new Error('Unit and packing time are required for Fresh Delivery products.');
//       err.status = 400;
//       throw err;
//     }
//   }

//   const existingSku = await Product.findOne({ where: { sku } });
//   if (existingSku) {
//     const err = new Error('A product with this SKU already exists.');
//     err.status = 409;
//     throw err;
//   }

//   if (created_by_role === 'SELLER') {
//     const seller = await Seller.findByPk(seller_id);
//     if (!seller) {
//       const err = new Error('Seller account not found.');
//       err.status = 400;
//       throw err;
//     }
//   }

//   const stockNum = Number(stock) || 0;
//   const approval_status = created_by_role === 'ADMIN' ? 'Approved' : 'Pending';

//   return Product.create({
//     name,
//     sku,
//     category,
//     seller_id,
//     admin_id,
//     created_by_role,
//   product_type: !isFresh && product_type === 'Regional Famous' ? 'Regional Famous' : 'Regular',
//     delivery_type: isFresh ? 'Fresh' : 'Standard',
//     unit: isFresh ? unit : null,
//     shelf_life: isFresh ? shelf_life || null : null,
//     prep_time_minutes: isFresh ? Number(prep_time_minutes) : null,
//     approval_status,
//     price: Number(price),
//     stock: stockNum,
//     status: resolveStatus(stockNum),
//     image_url: image_url || null,
//     gallery_urls: gallery_urls || null,
//     description: description || null,
//   });
// };

exports.listRequests = async (userRole, productType, deliveryType) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }
  const where = {
    created_by_role: 'SELLER',
    approval_status: 'Pending',
    product_type: productType || 'Regular',
    delivery_type: deliveryType === 'Fresh' ? 'Fresh' : 'Standard',
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

exports.deleteProduct = async (id, userId, userRole) => {
  const product = await Product.findByPk(id);
  if (!product) {
    const err = new Error('Product not found.');
    err.status = 404;
    throw err;
  }

  const isOwner =
    (userRole === 'VENDOR' && product.vendor_id === userId) ||
    (userRole === 'SELLER' && product.seller_id === userId);

  if (userRole !== 'SUPER_ADMIN' && !isOwner) {
    const err = new Error('You can only delete your own products.');
    err.status = 403;
    throw err;
  }

  await product.destroy();
};

exports.listPublicProducts = () => {
  return Product.findAll({
    where: {
      approval_status: 'Approved',
      status: { [Op.ne]: 'Out of Stock' },
    },
    include: [
      { model: Seller, as: 'seller', attributes: ['id', 'full_name', 'store_name', 'location', 'latitude', 'longitude'] },
      { model: Vendor, as: 'vendor', attributes: ['id', 'full_name', 'address', 'latitude', 'longitude'] },
    ],
    order: [['created_at', 'DESC']],
  });
};

// ── Seller edit requests for already-approved products ────────────────────

exports.submitEditRequest = async (productId, sellerId, body) => {
  const product = await Product.findByPk(productId);
  if (!product) {
    const err = new Error('Product not found.');
    err.status = 404;
    throw err;
  }
  if (product.seller_id !== sellerId) {
    const err = new Error('You can only edit your own products.');
    err.status = 403;
    throw err;
  }
  if (product.approval_status !== 'Approved') {
    const err = new Error('Only approved products can be edited.');
    err.status = 400;
    throw err;
  }

  const changes = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] === undefined) continue;
    const newValue = field === 'price' || field === 'stock' ? Number(body[field]) : body[field];
    const oldValue = product[field];
    if (String(newValue) !== String(oldValue)) {
      changes[field] = { old: oldValue, new: newValue };
    }
  }

  if (Object.keys(changes).length === 0) {
    const err = new Error('No changes detected.');
    err.status = 400;
    throw err;
  }

  // Only one pending edit request per product at a time — replace if one exists.
  const existing = await ProductEditRequest.findOne({
    where: { product_id: productId, status: 'Pending' },
  });
  if (existing) {
    existing.changes = changes;
    await existing.save();
    return existing;
  }

  return ProductEditRequest.create({
    product_id: productId,
    seller_id: sellerId,
    changes,
    status: 'Pending',
  });
};

exports.listEditRequests = async (userRole) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }
  return ProductEditRequest.findAll({
    where: { status: 'Pending' },
    include: [
      { model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'category', 'price', 'stock', 'image_url', 'gallery_urls', 'description'] },
      { model: Seller, as: 'seller', attributes: ['id', 'full_name', 'store_name'] },
    ],
    order: [['created_at', 'DESC']],
  });
};

exports.approveEditRequest = async (id, userRole) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }
  const request = await ProductEditRequest.findByPk(id, { include: [{ model: Product, as: 'product' }] });
  if (!request) {
    const err = new Error('Edit request not found.');
    err.status = 404;
    throw err;
  }
  if (request.status !== 'Pending') {
    const err = new Error('This request has already been reviewed.');
    err.status = 400;
    throw err;
  }

  const product = request.product;
  const updates = {};
  for (const [field, { new: newValue }] of Object.entries(request.changes)) {
    updates[field] = newValue;
  }
  if (updates.stock !== undefined) {
    updates.status = resolveStatus(Number(updates.stock));
  }
  await product.update(updates);

  request.status = 'Approved';
  await request.save();
  return { request, product };
};

exports.rejectEditRequest = async (id, userRole) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }
  const request = await ProductEditRequest.findByPk(id);
  if (!request) {
    const err = new Error('Edit request not found.');
    err.status = 404;
    throw err;
  }
  if (request.status !== 'Pending') {
    const err = new Error('This request has already been reviewed.');
    err.status = 400;
    throw err;
  }
  request.status = 'Rejected';
  await request.save();
  return request;
};