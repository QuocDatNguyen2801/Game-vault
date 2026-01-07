const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const Post = require("../../models/Post");
const Thread = require("../../models/Thread");
const Product = require("../../models/Product");
const multer = require("multer");
const path = require("path");
const slugify = require("../../utils/slugify");

const ADMIN_STYLES = [
  `<link rel="stylesheet" href="/css/admin-dashboard.css">`,
];
const ADMIN_SCRIPTS = [`<script src="/js/admin-dashboard.js"></script>`];

const PRODUCT_CATEGORIES = [
  "Action",
  "Adventure",
  "FPS",
  "Horror",
  "Puzzle",
  "Racing",
  "RPG",
  "Simulation",
  "Sports",
  "Strategy",
];

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

const baseView = (title, description) => ({
  layout: "layouts/main",
  styles: ADMIN_STYLES,
  scripts: ADMIN_SCRIPTS,
  locals: {
    title,
    description: description || title,
  },
});

// Render admin dashboard overview
router.get("/", async (req, res, next) => {
  try {
    const [userCount, postCount, threadCount, productCount, lockedUsers] =
      await Promise.all([
        User.countDocuments(),
        Post.countDocuments(),
        Thread.countDocuments(),
        Product.countDocuments(),
        User.countDocuments({ isLocked: true }),
      ]);

    res.render("dashboard/admin/index", {
      ...baseView("Admin Dashboard", "Admin overview"),
      stats: {
        userCount,
        postCount,
        threadCount,
        productCount,
        lockedUsers,
      },
      styles: ADMIN_STYLES,
      scripts: ADMIN_SCRIPTS,
    });
  } catch (err) {
    next(err);
  }
});

// Users management list
router.get("/users", async (req, res, next) => {
  try {
    const users = await User.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean();
    const viewUsers = users.map((user) => {
      const username = user.username || "";
      const displayUsername = username.toLowerCase().includes("deleted")
        ? "Deleted account"
        : username;
      return { ...user, displayUsername, idStr: String(user._id) };
    });
    res.render("dashboard/admin/users", {
      ...baseView("Manage Users", "Lock or unlock user accounts"),
      users: viewUsers,
      currentUserId: String(req.session.userId || ""),
    });
  } catch (err) {
    next(err);
  }
});

// Lock a user
router.post("/users/:id/lock", async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id).lean();
    const currentUserId = String(req.session.userId || "");

    if (!target) {
      return res.redirect("/dashboard/admin/users");
    }

    const isSelf = String(target._id) === currentUserId;
    const isTargetAdmin = Boolean(target.isAdmin);

    if (isSelf || isTargetAdmin) {
      return res.redirect("/dashboard/admin/users");
    }

    await User.findByIdAndUpdate(req.params.id, { isLocked: true });
    res.redirect("/dashboard/admin/users");
  } catch (err) {
    next(err);
  }
});

// Unlock a user
router.post("/users/:id/unlock", async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isLocked: false });
    res.redirect("/dashboard/admin/users");
  } catch (err) {
    next(err);
  }
});

// Posts management
router.get("/posts", async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).lean();
    res.render("dashboard/admin/posts", {
      ...baseView("Manage Posts", "Hide or unhide blog posts"),
      posts,
    });
  } catch (err) {
    next(err);
  }
});

// Toggle post hidden
router.post("/posts/:id/toggle", async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post) {
      post.isHidden = !post.isHidden;
      await post.save();
    }
    res.redirect("/dashboard/admin/posts");
  } catch (err) {
    next(err);
  }
});

// Threads management
router.get("/threads", async (req, res, next) => {
  try {
    const threads = await Thread.find().sort({ createdAt: -1 }).lean();
    res.render("dashboard/admin/threads", {
      ...baseView("Manage Threads", "Hide or unhide forum threads"),
      threads,
    });
  } catch (err) {
    next(err);
  }
});

// Toggle thread hidden
router.post("/threads/:id/toggle", async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.id);
    if (thread) {
      thread.isHidden = !thread.isHidden;
      await thread.save();
    }
    res.redirect("/dashboard/admin/threads");
  } catch (err) {
    next(err);
  }
});

// Products management
router.get("/products", async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    res.render("dashboard/admin/products", {
      ...baseView("Manage Products", "Enable or disable products"),
      styles: [
        ...ADMIN_STYLES,
        `<link rel="stylesheet" href="/css/shopping-cart.css">`,
      ],
      products,
      categories: PRODUCT_CATEGORIES,
    });
  } catch (err) {
    next(err);
  }
});

// Create product (admin only)
router.post(
  "/products/create",
  upload.single("product-image"),
  async (req, res, next) => {
    try {
      let categories = req.body.categories || [];
      if (!Array.isArray(categories)) {
        categories = [categories];
      }

      const title = (req.body["product-title"] || "").trim();
      if (!title) {
        return res.redirect("/dashboard/admin/products");
      }

      const newProduct = new Product({
        title,
        slug: slugify(title),
        description: req.body["product-description"],
        price: parseFloat(req.body["product-price"]) || 0,
        stock: parseInt(req.body["product-stock"], 10) || 0,
        developer: req.body["product-developer"],
        publisher: req.body["product-publisher"],
        releaseDate: req.body["product-release-date"] || new Date(),
        categories,
        image: req.file ? "/uploads/" + req.file.filename : "/img/image_1.jpeg",
        ownerId: req.session.userId,
        createdAt: new Date(),
      });

      await newProduct.save();
      res.redirect("/dashboard/admin/products");
    } catch (err) {
      next(err);
    }
  }
);

// Toggle product disabled
router.post("/products/:id/toggle", async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      product.isDisabled = !product.isDisabled;
      await product.save();
    }
    res.redirect("/dashboard/admin/products");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
