const ProductService = require('../services/productService');
const CommonService = require('../services/commonService');

exports.list = async (req, res) => {
  try {
    const products = await ProductService.listProducts(req.userId, req.userRole, req.query.productType, req.query.approvalStatus);
    CommonService.sendResponse(res, 200, true, 'Products fetched successfully', { products });
  } catch (err) {
    console.error('List products error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching products.');
  }
};

exports.listPublic = async (req, res) => {
  try {
    const products = await ProductService.listPublicProducts();
    CommonService.sendResponse(res, 200, true, 'Products fetched successfully', { products });
  } catch (err) {
    console.error('List public products error:', err);
    CommonService.sendResponse(res, 500, false, 'Server error fetching products.');
  }
};

exports.create = async (req, res) => {
  try {
    const product = await ProductService.createProduct(req.body, req.userId, req.userRole);
    CommonService.sendResponse(res, 201, true, 'Product created successfully.', { product });
  } catch (err) {
    console.error('Create product error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error creating product.');
  }
};

exports.listRequests = async (req, res) => {
  try {
    const products = await ProductService.listRequests(req.userRole, req.query.productType);
    CommonService.sendResponse(res, 200, true, 'Product requests fetched successfully', { products });
  } catch (err) {
    console.error('List product requests error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching product requests.');
  }
};

exports.approve = async (req, res) => {
  try {
    const product = await ProductService.approveProduct(req.params.id, req.userRole);
    CommonService.sendResponse(res, 200, true, 'Product approved.', { product });
  } catch (err) {
    console.error('Approve product error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error approving product.');
  }
};

exports.reject = async (req, res) => {
  try {
    const product = await ProductService.rejectProduct(req.params.id, req.userRole);
    CommonService.sendResponse(res, 200, true, 'Product rejected.', { product });
  } catch (err) {
    console.error('Reject product error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error rejecting product.');
  }
};