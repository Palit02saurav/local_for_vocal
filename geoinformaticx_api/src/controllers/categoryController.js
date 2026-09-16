const CategoryService = require('../services/categoryService');
const CommonService = require('../services/commonService');

exports.list = async (req, res) => {
  try {
    const categories = await CategoryService.listCategories(req.userRole, req.query.type);
    CommonService.sendResponse(res, 200, true, 'Categories fetched successfully', { categories });
  } catch (err) {
    console.error('List categories error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching categories.');
  }
};

exports.create = async (req, res) => {
  try {
    const category = await CategoryService.createCategory(req.body, req.userRole);
    CommonService.sendResponse(res, 201, true, 'Category created successfully', { category });
  } catch (err) {
    console.error('Create category error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error creating category.');
  }
};

exports.update = async (req, res) => {
  try {
    const category = await CategoryService.updateCategory(req.params.id, req.body, req.userRole);
    CommonService.sendResponse(res, 200, true, 'Category updated successfully', { category });
  } catch (err) {
    console.error('Update category error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error updating category.');
  }
};

exports.remove = async (req, res) => {
  try {
    await CategoryService.removeCategory(req.params.id, req.userRole);
    CommonService.sendResponse(res, 200, true, 'Category deleted.');
  } catch (err) {
    console.error('Delete category error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error deleting category.');
  }
};