const CustomerService = require('../services/customerService');
const CommonService = require('../services/commonService');

exports.list = async (req, res) => {
  try {
    if (req.userRole !== 'SUPER_ADMIN') {
      return CommonService.sendResponse(res, 403, false, 'Not authorized.');
    }
    const customers = await CustomerService.listCustomers();
    CommonService.sendResponse(res, 200, true, 'Customers fetched successfully', { customers });
  } catch (err) {
    console.error('List customers error:', err);
    CommonService.sendResponse(res, 500, false, 'Server error fetching customers.');
  }
};