const ServiceService = require('../services/serviceService');
const CommonService = require('../services/commonService');

exports.list = async (req, res) => {
  try {
    const services = await ServiceService.listServices(req.userId, req.userRole);
    CommonService.sendResponse(res, 200, true, 'Services fetched successfully', { services });
  } catch (err) {
    console.error('List services error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching services.');
  }
};

exports.listPublic = async (req, res) => {
  try {
    const services = await ServiceService.listPublicServices();
    CommonService.sendResponse(res, 200, true, 'Services fetched successfully', { services });
  } catch (err) {
    console.error('List public services error:', err);
    CommonService.sendResponse(res, 500, false, 'Server error fetching services.');
  }
};

exports.listPublic = async (req, res) => {
  try {
    const services = await ServiceService.listPublicServices();
    CommonService.sendResponse(res, 200, true, 'Services fetched successfully', { services });
  } catch (err) {
    console.error('List public services error:', err);
    CommonService.sendResponse(res, 500, false, 'Server error fetching services.');
  }
};

exports.create = async (req, res) => {
  try {
    const service = await ServiceService.createService(req.body, req.userId, req.userRole);
    CommonService.sendResponse(res, 201, true, 'Service created successfully', { service });
  } catch (err) {
    console.error('Create service error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error creating service.');
  }
};

exports.listRequests = async (req, res) => {
  try {
    const services = await ServiceService.listRequests(req.userRole);
    CommonService.sendResponse(res, 200, true, 'Service requests fetched successfully', { services });
  } catch (err) {
    console.error('List service requests error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching service requests.');
  }
};

exports.approve = async (req, res) => {
  try {
    const service = await ServiceService.approveService(req.params.id, req.userRole);
    CommonService.sendResponse(res, 200, true, 'Service approved.', { service });
  } catch (err) {
    console.error('Approve service error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error approving service.');
  }
};

exports.reject = async (req, res) => {
  try {
    const service = await ServiceService.rejectService(req.params.id, req.userRole);
    CommonService.sendResponse(res, 200, true, 'Service rejected.', { service });
  } catch (err) {
    console.error('Reject service error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error rejecting service.');
  }
};

exports.getPublicBySlug = async (req, res) => {
  try {
    const service = await ServiceService.getPublicServiceBySku(req.params.sku);
    CommonService.sendResponse(res, 200, true, 'Service fetched successfully', { service });
  } catch (err) {
    console.error('Get public service error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching service.');
  }
};