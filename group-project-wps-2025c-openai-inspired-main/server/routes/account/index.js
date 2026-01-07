const router = require("express").Router();
const accountController = require("../../controllers/accountController");
const multer = require("multer"); //for file uploads
const path = require("path");
const fs = require("fs");
const { requireSignin } = require("../../middlewares/authMiddleware");

// Ensure uploads directory exists relative to project root
const uploadDir = path.join(__dirname, "../../..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer storage to keep file extensions and correct path
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
  },
});
router.use(require("./my-profile"));
router.use(require("./my-games"));
router.use(require("./security"));
router.post(
  "/upload-avatar",
  requireSignin,
  upload.single("avatar"),
  accountController.uploadAvatar
);
module.exports = router;
