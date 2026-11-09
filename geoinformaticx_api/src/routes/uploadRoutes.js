const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth");
const CommonService = require("../services/commonService");
const upload = require("../middlewares/upload");

router.post("/", verifyToken, upload.single("image"), (req, res) => {
  if (!req.file) {
    return CommonService.sendResponse(
      res,
      400,
      false,
      "No image file received.",
    );
  }
  const base = (
    process.env.IMAGE_PUBLIC_URL || `${req.protocol}://${req.get("host")}`
  ).replace(/\/$/, "");
  const url = `${base}/images/${req.file.filename}`;
  CommonService.sendResponse(res, 200, true, "Image uploaded successfully.", {
    url,
  });
});

// Multer errors (bad file type, over size limit) land here instead of the
// generic error handler, so the message stays specific.
router.use((err, req, res, next) => {
  CommonService.sendResponse(
    res,
    400,
    false,
    err.message || "Image upload failed.",
  );
});

module.exports = router;
