const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const multer = require("multer");
const path = require("path");
const uploadPath = path.join(__dirname, "../../uploads");
const reviewStorage = require('../data/reviewStorage');
const { requireSignin } = require('../middlewares/authMiddleware');
const {reviewStyles, reviewScripts} = require("../controllers/reviewIntegration");

const styles = [...reviewStyles, `<link rel="stylesheet" href="/css/shopping-cart.css" />`];
const scripts = [...reviewScripts];

// upload images from users
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPath),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

router.post("/api/review-image", upload.single("image"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// API endpoints
router.get("/api/products", reviewController.getAllProducts);
router.get("/api/reviews", reviewController.getAllReviews);
router.get("/api/reviews/:id", reviewController.getReviewById);
router.post("/api/reviews", requireSignin, reviewController.addReview);
router.put("/api/reviews/:id", requireSignin, reviewController.updateReview);
router.delete("/api/reviews/:id", requireSignin, reviewController.deleteReview);

// Page routes (EJS views)
router.get("/reviews", async (req, res) => {

    // take the name of game from querying param 
    const gameName = req.query.game;

    // default title of review page
    let pageTitle = "Customer Reviews";

    // if users click "See all reviews" in shop game
    if (gameName) {
        pageTitle = `Reviews of ${gameName}`;
    }

    res.render("review/customerReview", { 
        title: pageTitle,
        layout: './layouts/main.ejs',
        styles,
        scripts,
        currentUrl: req.originalUrl 
    });
});

router.get("/reviews/:id", async (req, res) => {
    const id = req.params.id;

    res.render("review/full-review", { 
        id,
        title: `Full Review`,
        layout: './layouts/main.ejs',
        styles,
        scripts,
        currentUrl: req.originalUrl
    });
});

module.exports = router;