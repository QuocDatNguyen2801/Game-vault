const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { calculateCartTotals } = require("../middlewares/calculateCartTotals");
const styles = `<link rel="stylesheet" href="/css/shopping-cart.css" />`;
const scripts = `<script src="/js/script.js"></script>`;

const getGuestCart = (req) =>
  Array.isArray(req.session.guestCart)
    ? req.session.guestCart
    : (req.session.guestCart = []);
const saveGuestCart = (req, cartItems) => {
  req.session.guestCart = cartItems;
};

// Get Shopping Cart View
const getCart = async (req, res) => {
  const locals = {
    title: "Shopping Cart Page",
    description:
      "GameVault is a web app that streamlines game shopping with secure payments and an easy-to-use cart system.",
  };

  try {
    const userId = req.session.userId;

    if (!userId) {
      const guestCart = getGuestCart(req);
      const itemsWithProducts = await Promise.all(
        guestCart.map(async (item) => {
          const product = await Product.findOne({
            _id: item.productId,
            isDisabled: { $ne: true },
          }).lean();
          return {
            ...item,
            price:
              product && typeof product.price === "number" ? product.price : 0,
            title: product ? product.title : "",
            image: product ? product.image : "",
            _id: product ? product._id : item.productId, // for form actions
          };
        })
      );
      let totals = { subtotal: "0.00", tax: "0.00", total: "0.00" };
      if (itemsWithProducts.length > 0) {
        totals = calculateCartTotals(itemsWithProducts);
      }
      return res.render("shopping-cart/cart", {
        locals,
        cart: { items: itemsWithProducts },
        totals,
        styles: styles,
        scripts: scripts,
      });
    }

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      match: { isDisabled: { $ne: true } },
    });
    let totals = { subtotal: "0.00", tax: "0.00", total: "0.00" };

    let itemsWithProductFields = [];
    if (cart && cart.items.length > 0) {
      // Attach product fields for EJS rendering and drop disabled/missing products
      itemsWithProductFields = cart.items
        .filter((item) => item.productId)
        .map((item) => ({
          ...item.toObject(),
          price:
            item.productId && typeof item.productId.price === "number"
              ? item.productId.price
              : 0,
          title: item.productId ? item.productId.title : "",
          image: item.productId ? item.productId.image : "",
          _id: item._id, // keep cart item _id for update/delete
        }));
      totals = calculateCartTotals(itemsWithProductFields);
    }

    res.render("shopping-cart/cart", {
      locals,
      cart: { items: itemsWithProductFields },
      totals: totals,
      styles: styles,
      scripts: scripts,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error: getting shopping cart view!");
  }
};

// Add to Cart
const addToCart = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { edition, quantity } = req.body;

    const productId = req.params.id;

    const product = await Product.findOne({
      _id: productId,
      isDisabled: { $ne: true },
    });
    if (!product) {
      return res.status(404).send("Product not found!");
    }

    if (!userId) {
      let guestCart = getGuestCart(req);
      const existingItemIndex = guestCart.findIndex(
        (item) => item.productId == productId && item.edition == edition
      );
      if (existingItemIndex > -1) {
        guestCart[existingItemIndex].quantity += parseInt(quantity);
      } else {
        guestCart.push({ productId, edition, quantity: parseInt(quantity) });
      }
      saveGuestCart(req, guestCart);
      return res.redirect("/cart");
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [{ productId, edition, quantity: parseInt(quantity) }],
      });
    } else {
      const existingItemIndex = cart.items.findIndex(
        (item) => item.productId == productId && item.edition == edition
      );

      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += parseInt(quantity);
      } else {
        cart.items.push({ productId, edition, quantity: parseInt(quantity) });
      }
    }

    await cart.save();
    res.redirect("/cart");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error: adding to shopping cart!");
  }
};

// Update Cart
const updateCart = async (req, res) => {
  try {
    const userId = req.session.userId;

    const { quantity } = req.body;
    const itemId = req.params.id;

    const cart = await Cart.findOne({ userId });

    if (!userId) {
      let guestCart = getGuestCart(req);
      // For guest, productId is a string, so compare directly
      const item = guestCart.find((item) => item.productId == itemId);
      if (item) item.quantity = Math.max(1, parseInt(quantity));
      saveGuestCart(req, guestCart);
      return res.redirect("/cart");
    }

    if (cart) {
      let newQuantity = parseInt(quantity);
      if (newQuantity < 1) {
        newQuantity = 1;
      }

      await Cart.updateOne(
        { userId, "items._id": itemId },
        { $set: { "items.$.quantity": newQuantity } }
      );
    }

    res.redirect("/cart");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error: editing shopping cart!");
  }
};

const deleteItem = async (req, res) => {
  try {
    const userId = req.session.userId;
    const itemId = req.params.id;

    if (!userId) {
      let guestCart = getGuestCart(req);
      // For guest, productId is a string, so compare directly
      guestCart = guestCart.filter((item) => item.productId != itemId);
      saveGuestCart(req, guestCart);
      return res.redirect("/cart");
    }

    await Cart.updateOne({ userId }, { $pull: { items: { _id: itemId } } });

    res.redirect("/cart");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error: deleting item in shopping cart!");
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCart,
  deleteItem,
};
