const Product = require("../models/Product");
const slugify = require("../utils/slugify");
const styles = `<link rel="stylesheet" href="/css/shopping-cart.css" />`;
const scripts = `<script src="/js/script.js"></script>`;

const reviewIntegration = require("./reviewIntegration");
const { reviewStyles, reviewScripts } = reviewIntegration;

const reviewStylesIntegration = [
  `<link rel="stylesheet" href="/css/shopping-cart.css" />`,
  ...reviewStyles,
];
const reviewScriptsIntegration = [
  `<script src="/js/script.js"></script>`,
  ...reviewScripts,
];

// Shop Admin Layout
const shopAdmin = async (req, res) => {
  const locals = {
    title: "Shopping Page - Gaming Store (Admin Access)",
    description:
      "A seamless web app that lets gamers browse, add, and purchase their favorite titles with an intuitive shopping experience.",
  };

  try {
    let searchTerm = "";
    let searchObj = { isDisabled: { $ne: true } };
    let sortObj = {};
    const currentSort = req.query.sort || "";
    const currentUserId = req.session.userId;

    let page = req.query.page || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    if (req.query.searchGame) {
      searchTerm = req.query.searchGame;

      const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9\s]/g, "");

      searchObj = {
        $or: [
          { title: { $regex: new RegExp(searchNoSpecialChar, "i") } },
          { description: { $regex: new RegExp(searchNoSpecialChar, "i") } },
        ],
      };
    }

    if (currentSort) {
      switch (currentSort) {
        case "title_asc":
          sortObj = { title: 1 };
          break;
        case "title_desc":
          sortObj = { title: -1 };
          break;
        case "price_asc":
          sortObj = { price: 1 };
          break;
        case "price_desc":
          sortObj = { price: -1 };
          break;
        case "stock_asc":
          sortObj = { stock: 1 };
          break;
        case "stock_desc":
          sortObj = { stock: -1 };
          break;
        default:
          sortObj = {};
          break;
      }
    }

    const count = await Product.countDocuments(searchObj);

    const products = await Product.find(searchObj)
      .sort(sortObj)
      .skip(skip)
      .limit(limit);
    res.render("shopping-cart/admin_shop", {
      locals,
      products: products,
      searchTerm: searchTerm,
      currentSort: currentSort,
      current: parseInt(page),
      pages: Math.ceil(count / limit),
      currentUserId: currentUserId,
      styles: styles,
      scripts: scripts,
    });
  } catch (err) {
    console.log(err);
    res.redirect("/shop/admin");
  }
};

// Game Details
const gameDetails = async (req, res) => {
  const locals = {
    title: "Gaming Description",
    description:
      "GameVault is a web app that lets users explore a vast library of games, view detailed descriptions, and discover everything about their favorite titles in one place.",
  };

  try {
    const slug = req.params.slug;
    const productId = req.params.id;
    const product = await Product.findOne({
      slug: slug,
      isDisabled: { $ne: true },
    });

    if (!product) {
      return res.status(404).send("Product not found.");
    }

    const { reviewCount } = await reviewIntegration.getReviewDataForGame(
      req,
      product.title
    );

    // take the number of reviews for a specific game
    locals.reviewCount = reviewCount;

    res.render("shopping-cart/game", {
      locals,
      product: product,
      styles: reviewStylesIntegration,
      scripts: reviewScriptsIntegration,
      reviewCount,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error: cannot get game details!");
  }
};

// Create Product (Admin only)
const createProduct = async (req, res) => {
  try {
    let categories = req.body.categories || [];
    if (!Array.isArray(categories)) {
      categories = [categories];
    }

    const title = req.body["create-product-title"];
    const newProduct = new Product({
      title,
      slug: slugify(title),
      description: req.body["create-product-description"],
      price: parseFloat(req.body["create-product-price"]),
      stock: req.body["create-product-stock"],
      developer: req.body["create-product-developer"],
      publisher: req.body["create-product-publisher"],
      releaseDate: req.body["create-product-release-date"],
      categories: categories,
      image: req.file ? "/uploads/" + req.file.filename : "/img/image_1.jpeg",
      ownerId: req.session.userId,
      createdAt: new Date(),
    });

    await newProduct.save();
    res.redirect("/shop/admin");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error: creating product!");
  }
};

// Edit Product (Admin only)
const editProduct = async (req, res) => {
  try {
    let categories = req.body.categories || [];
    if (!Array.isArray(categories)) {
      categories = [categories];
    }

    const title = req.body["edit-product-title"];
    const updatedProduct = {
      title,
      slug: slugify(title),
      description: req.body["edit-product-description"],
      price: parseFloat(req.body["edit-product-price"]),
      stock: req.body["edit-product-stock"],
      developer: req.body["edit-product-developer"],
      publisher: req.body["edit-product-publisher"],
      releaseDate: req.body["edit-product-release-date"],
      categories: categories,
    };

    if (req.file) {
      updatedProduct.image = "/uploads/" + req.file.filename;
    }

    await Product.findByIdAndUpdate(
      { _id: req.params.id, ownerId: req.session.userId },
      updatedProduct,
      { new: true }
    );
    res.redirect("/shop/admin");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error: editing product!");
  }
};

// Delete Product (Admin only)
const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete({
      _id: req.params.id,
      ownerId: req.session.userId,
    });
    res.redirect("/shop/admin");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error: deleting product!");
  }
};

module.exports = {
  shopAdmin,
  createProduct,
  editProduct,
  gameDetails,
  deleteProduct,
};
