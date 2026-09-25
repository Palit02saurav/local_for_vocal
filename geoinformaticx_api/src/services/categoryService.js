const { Category } = require('../models');

exports.listCategories = (userRole, queryType) => {
  const where = userRole === 'SUPER_ADMIN' ? {} : { status: 'Active' };
  if (['product', 'service', 'fresh'].includes(queryType)) {
    where.type = queryType;
  }
  return Category.findAll({
    where,
    order: [['name', 'ASC']],
  });
};

exports.createCategory = async (body, userRole) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }

  const { name, description, image_url, type } = body;
  if (!name?.trim()) {
    const err = new Error('Category name is required.');
    err.status = 400;
    throw err;
  }

  const existing = await Category.findOne({ where: { name: name.trim() } });
  if (existing) {
    const err = new Error('This category already exists.');
    err.status = 409;
    throw err;
  }

  return Category.create({
    name: name.trim(),
    description: description?.trim() || null,
    image_url: image_url || null,
    type: ['service', 'fresh'].includes(type) ? type : 'product',
  });
};

exports.updateCategory = async (id, body, userRole) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }

  const category = await Category.findByPk(id);
  if (!category) {
    const err = new Error('Category not found.');
    err.status = 404;
    throw err;
  }

  const { name, status, description, image_url } = body;
  if (name?.trim()) category.name = name.trim();
  if (status) category.status = status;
  if (description !== undefined) category.description = description?.trim() || null;
  if (image_url !== undefined) category.image_url = image_url || null;
  await category.save();

  return category;
};

exports.removeCategory = async (id, userRole) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }

  const category = await Category.findByPk(id);
  if (!category) {
    const err = new Error('Category not found.');
    err.status = 404;
    throw err;
  }

  await category.destroy();
};