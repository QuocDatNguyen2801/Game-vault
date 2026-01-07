const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { calculateCartTotals } = require("../middlewares/calculateCartTotals");

const styles = `<link rel="stylesheet" href="/css/shopping-cart.css" />`;
const scripts = `<script src="/js/script.js"></script>`;

const getCheckout = async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/user/signin?next=/cart');
    }
    const locals = {
        title: 'Checkout Page',
        description: 'The checkout in the GameVault web app allows users to securely complete their game purchases and finalize transactions with multiple payment options.'
    };

    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.render('shopping-cart/checkout', { locals, totals: null, styles: styles, scripts: scripts });
        }

        const cart = await Cart.findOne({ userId }).populate('items.productId');

        let totals = { subtotal: '0.00', tax: '0.00', total: '0.00' };

        if (cart && cart.items.length > 0) {
            totals = calculateCartTotals(cart.items);
        }

        res.render('shopping-cart/checkout', { locals, totals: totals, styles: styles, scripts: scripts });
    } catch(err) {
        console.log(err);
        res.status(500).send('Error: loading checkout process!');
    }
};

const postCheckout = async (req, res) => {
    try {
        const userId = req.session.userId;

        const cart = await Cart.findOne({ userId }).populate('items.productId');

        const calcTotals = calculateCartTotals(cart.items);

        const orderItems = cart.items.map(item => {
            let itemPrice = item.productId.price;
            if (item.edition === 'Deluxe') itemPrice += 10.00;
            if (item.edition === 'Ultimate') itemPrice += 20.00;

            return {
                productId: item.productId._id,
                title: item.productId.title,      
                price: itemPrice,                  
                edition: item.edition,
                quantity: item.quantity,
                image: item.productId.image     
            };
        });

        const order = new Order({
            userId: userId,
            items: orderItems,
            paymentDetails: {
                cardNumber: req.body['card-number'],
                cardName: req.body['card-name'],
                expiryDate: req.body['card-expiry-date'],
                cvv: req.body.cvv
            },
            shippingDetails: {
                address: req.body['street-address'],
                city: req.body.city,
                zip: req.body.zip,
                country: req.body.country
            },
            totals: {
                subtotal: calcTotals.subtotal,
                tax: calcTotals.tax,
                total: calcTotals.total
            }
        });

        await order.save();
        await Cart.deleteOne({ userId });

        res.redirect('/order-confirmation');
    } catch(err) {
        console.log(err);
        res.status(500).send('Error: posting checkout process!');
    }
};

module.exports = {
    getCheckout,
    postCheckout
};