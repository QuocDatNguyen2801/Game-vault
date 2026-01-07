const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const BlogController = require("../../controllers/blogController");
const { requireSignin } = require("../../middlewares/authMiddleware");
const router = express.Router();
const blogController = new BlogController();

// Multer storage for blog images
const uploadDir = path.join(__dirname, "..", "..", "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const base = path
      .basename(file.originalname || "upload", ext)
      .replace(/[^a-z0-9-_]/gi, "_");
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});
const upload = multer({ storage });

router.get("/", blogController.getAllPosts.bind(blogController));
router.post(
  "/create",
  requireSignin,
  upload.single("imageFile"),
  blogController.createPost.bind(blogController)
);
router.get("/:id", blogController.getPostById.bind(blogController));
router.post(
  "/:id/like",
  requireSignin,
  blogController.likePost.bind(blogController)
);
router.post(
  "/:id/like-toggle",
  requireSignin,
  blogController.toggleLike.bind(blogController)
);
// Update/Delete via HTML forms
router.post("/:id/update", blogController.updatePost.bind(blogController));
router.post("/:id/delete", blogController.deletePost.bind(blogController));

// JSON API routes (for decoupled front-end)
router.get("/api/posts", blogController.apiListPosts.bind(blogController));
router.get(
  "/api/features",
  blogController.apiListFeatures.bind(blogController)
);
router.get("/api/posts/:id", async (req, res) => {
  try {
    const post = blogController.service.getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: "Error fetching post" });
  }
});
router.post(
  "/api/posts/:id/like-toggle",
  requireSignin,
  blogController.toggleLike.bind(blogController)
);
router.put("/api/posts/:id", blogController.updatePost.bind(blogController));
router.delete("/api/posts/:id", blogController.deletePost.bind(blogController));

module.exports = router;
