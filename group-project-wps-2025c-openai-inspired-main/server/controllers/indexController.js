const Product = require("../models/Product");
const styles = `<link rel="stylesheet" href="/css/shopping-cart.css" />`;
const scripts = `<script src="/js/script.js"></script>`;

// Home Page
const homepage = async (req, res) => {
  const locals = {
    title: "Home Page",
    description:
      "A sleek web app that lets users discover, organize, and track their favorite games all in one place.",
  };

  try {
    const products = await Product.find({ isDisabled: { $ne: true } })
      .sort({ rating: -1 })
      .limit(4);
    res.render("index", {
      locals,
      products: products,
      styles: styles,
      scripts: scripts,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error: cannot get top-rated games!");
  }
};

module.exports = { homepage };
