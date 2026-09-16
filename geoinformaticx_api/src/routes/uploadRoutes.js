const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const verifyToken = require('../middlewares/auth');
const CommonService = require('../services/commonService');

router.post('/', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return CommonService.sendResponse(res, 400, false, 'No image file received.');
  }
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  CommonService.sendResponse(res, 200, true, 'Image uploaded successfully.', { url });
});

// Multer errors (bad file type, over size limit) land here instead of the
// generic error handler, so the message stays specific.
router.use((err, req, res, next) => {
  CommonService.sendResponse(res, 400, false, err.message || 'Image upload failed.');
});

module.exports = router;