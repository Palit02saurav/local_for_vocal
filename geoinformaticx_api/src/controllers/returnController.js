const ReturnService = require('../services/returnService');
const CommonService = require('../services/commonService');

exports.create = async (req, res) => {
  try {
    const request = await ReturnService.createRequest(req.customerId, req.body);
    CommonService.sendResponse(res, 201, true, 'Request submitted.', { request });
  } catch (err) {
    console.error('Create return request error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error.');
  }
};

exports.list = async (req, res) => {
  try {
    // console.log('RETURNS LIST', req.userRole, req.userId, req.query.type);
    const requests = await ReturnService.listForOwner(req.userRole, req.userId, req.query.type);  
    CommonService.sendResponse(res, 200, true, 'Requests fetched successfully', { requests });
  } catch (err) {
    console.error('List return requests error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error.');
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const request = await ReturnService.updateStatus(req.userRole, req.userId, req.params.id, req.body.status);
    CommonService.sendResponse(res, 200, true, 'Status updated.', { request });
  } catch (err) {
    console.error('Update return status error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error.');
  }
};