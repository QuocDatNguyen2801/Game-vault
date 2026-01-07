// Helper calculating function
const calculateCartTotals = (items) => {
  let subtotal = 0;
  items.forEach((item) => {
    // Use item.price if available (guest), else fallback to item.productId.price (logged-in)
    let itemPrice =
      typeof item.price === "number"
        ? item.price
        : item.productId && typeof item.productId.price === "number"
        ? item.productId.price
        : 0;

    if (item.edition === "Deluxe") {
      itemPrice += 10.0;
    } else if (item.edition === "Ultimate") {
      itemPrice += 20.0;
    }

    subtotal += itemPrice * item.quantity;
  });

  const taxRate = 0.1;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return {
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2),
  };
};

module.exports = { calculateCartTotals };
