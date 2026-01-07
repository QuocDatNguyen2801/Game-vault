const Cart = require("../models/Cart");

// Merge guest cart into user cart after login
async function mergeGuestCartIntoUser(req, userId) {
  if (
    !req.session.guestCart ||
    !Array.isArray(req.session.guestCart) ||
    req.session.guestCart.length === 0
  )
    return;

  let userCart = await Cart.findOne({ userId });
  if (!userCart) {
    userCart = new Cart({ userId, items: [] });
  }

  req.session.guestCart.forEach((guestItem) => {
    const existingIndex = userCart.items.findIndex(
      (item) =>
        item.productId.toString() === guestItem.productId &&
        item.edition === guestItem.edition
    );
    if (existingIndex > -1) {
      userCart.items[existingIndex].quantity += guestItem.quantity;
    } else {
      userCart.items.push({
        productId: guestItem.productId,
        edition: guestItem.edition,
        quantity: guestItem.quantity,
      });
    }
  });

  await userCart.save();
  req.session.guestCart = [];
}

module.exports = { mergeGuestCartIntoUser };
