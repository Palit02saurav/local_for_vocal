const GeoService = require('../services/geoService');
const CommonService = require('../services/commonService');

exports.listStates = async (req, res) => {
  try {
    const states = await GeoService.listStates(req.query.geometry === '1');
    res.set('Cache-Control', 'no-cache');
    CommonService.sendResponse(res, 200, true, 'States fetched successfully', { states });
  } catch (err) {
    console.error('List geo states error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching states.');
  }
};

exports.listDistricts = async (req, res) => {
  try {
    const districts = await GeoService.listDistricts({
      state: req.query.state,
      famous: req.query.famous,
    });
    res.set('Cache-Control', 'no-cache');
    CommonService.sendResponse(res, 200, true, 'Districts fetched successfully', { districts });
  } catch (err) {
    console.error('List geo districts error:', err);
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error fetching districts.');
  }
};


const adminOnly = (req, res) => {
  if (req.userRole === 'SUPER_ADMIN') return false;
  CommonService.sendResponse(res, 403, false, 'Only the super admin can do this.');
  return true;
};

exports.districtNames = async (req, res) => {
  if (adminOnly(req, res)) return;
  try {
    const names = await GeoService.listDistrictNames();
    CommonService.sendResponse(res, 200, true, 'District names fetched successfully', { names });
  } catch (err) {
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error.');
  }
};

exports.listDistrictImages = async (req, res) => {
  try {
    const images = await GeoService.listDistrictImages();
    res.set('Cache-Control', 'no-cache');
    CommonService.sendResponse(res, 200, true, 'District images fetched successfully', { images });
  } catch (err) {
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error.');
  }
};

exports.saveDistrictImage = async (req, res) => {
  if (adminOnly(req, res)) return;
  try {
    await GeoService.saveDistrictImage(req.body);
    CommonService.sendResponse(res, 200, true, 'District image saved successfully');
  } catch (err) {
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error.');
  }
};

exports.deleteDistrictImage = async (req, res) => {
  if (adminOnly(req, res)) return;
  try {
    await GeoService.deleteDistrictImage(req.query.state, req.query.district);
    CommonService.sendResponse(res, 200, true, 'District image removed successfully');
  } catch (err) {
    CommonService.sendResponse(res, err.status || 500, false, err.message || 'Server error.');
  }
};