const Order = require("../models/Order");
const styles = `<link rel="stylesheet" href="/css/shopping-cart.css" />`;
const scripts = `<script src="/js/script.js"></script>`;

const escapeRegex = (text = "") => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getOrdersHistory = async (req, res) => {
  const locals = {
    title: "View Orders Page",
    description:
      "View all your past and current orders in one place on GameVault.",
  };

  try {
    const userId = req.session.userId;

    const { game: gameTitle } = req.query;

    let query = { userId };
    if (gameTitle) {
      const regex = new RegExp(`^${escapeRegex(gameTitle)}$`, "i");
      query = { ...query, "items.title": regex };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    res.render("shopping-cart/orders", {
      locals,
      orders,
      styles: styles,
      scripts: scripts,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error: getting orders history!");
  }
};

module.exports = { getOrdersHistory };
