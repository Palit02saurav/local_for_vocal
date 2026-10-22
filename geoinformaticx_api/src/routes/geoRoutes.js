const express = require('express');
const router = express.Router();
const geoController = require('../controllers/geoController');
const verifyToken = require('../middlewares/auth');

router.get('/states', geoController.listStates);
router.get('/districts', geoController.listDistricts);
router.get('/district-names', verifyToken, geoController.districtNames);
router.get('/district-images', geoController.listDistrictImages);
router.put('/district-images', verifyToken, geoController.saveDistrictImage);
router.delete('/district-images', verifyToken, geoController.deleteDistrictImage);

module.exports = router;