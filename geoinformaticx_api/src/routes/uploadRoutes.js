const express = require('express');
const path = require('path');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const router = express.Router();
const verifyToken = require('../middlewares/auth');
const CommonService = require('../services/commonService');

const s3 = new S3Client({ region: process.env.AWS_REGION });

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, or WEBP images are allowed.'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return CommonService.sendResponse(res, 400, false, 'No image file received.');
  }
  try {
    const ext = path.extname(req.file.originalname).toLowerCase();
    const key = `uploads/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        CacheControl: 'public, max-age=31536000',
      })
    );
    const base =
      process.env.AWS_S3_PUBLIC_URL ||
      `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;
    CommonService.sendResponse(res, 200, true, 'Image uploaded successfully.', { url: `${base}/${key}` });
  } catch (err) {
    console.error('S3 upload error:', err);
    CommonService.sendResponse(res, 500, false, 'Image upload to S3 failed.');
  }
});

// Multer errors (bad file type, over size limit) land here instead of the
// generic error handler, so the message stays specific.
router.use((err, req, res, next) => {
  CommonService.sendResponse(res, 400, false, err.message || 'Image upload failed.');
});

module.exports = router;