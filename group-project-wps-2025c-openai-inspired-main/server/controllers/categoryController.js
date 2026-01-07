const Product = require("../models/Product");
const categoryList = [
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

const styles = `<link rel="stylesheet" href="/css/shopping-cart.css" />`;
const scripts = `<script src="/js/script.js"></script>`;

// Get All Categories
const getAllCategories = async (req, res) => {
  const locals = {
    title: "Categories Page",
    description:
      "GameVault is a web app that categorizes and showcases games by genre, platform, and popularity, allowing users to explore, organize, and discover new titles efficiently.",
  };

  try {
    const categoryCounts = {};

    for (const category of categoryList) {
      const count = await Product.countDocuments({
        categories: category,
        isDisabled: { $ne: true },
      });
      categoryCounts[category] = count;
    }

    res.render("shopping-cart/categories", {
      locals,
      categoryCounts,
      styles: styles,
      scripts: scripts,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error: cannot get all categories!");
  }
};

// Get Specific Category By Name
const getSpecificCategory = async (req, res) => {
  try {
    const categoryName = req.params.name;

    const locals = {
      title: `${categoryName} Games`,
      description: `GameVault is a web app that allows users to view detailed information about a specific ${categoryName} game, including its category, genre, platform, and related titles.`,
    };

    const products = await Product.find({
      categories: categoryName,
      isDisabled: { $ne: true },
    });

    res.render("shopping-cart/category", {
      locals,
      products,
      categoryName,
      styles: styles,
      scripts: scripts,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error: cannot get specific category!");
  }
};

module.exports = {
  getAllCategories,
  getSpecificCategory,
};
