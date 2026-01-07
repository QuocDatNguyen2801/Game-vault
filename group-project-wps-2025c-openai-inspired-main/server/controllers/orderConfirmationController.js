const Order = require('../models/Order');
const styles = `<link rel="stylesheet" href="/css/shopping-cart.css" />`;
const scripts = `<script src="/js/script.js"></script>`;

const getOrderConfirmation = async (req, res) => {
    const locals = {
        title: 'Order Confirmation Page',
        description: 'The order confirmation in the GameVault web app displays a summary of the completed purchase, confirming payment and providing order details to the user.'
    };

    try {
        const userId = req.session.userId;

        const order = await Order.findOne({ userId }).sort({ createdAt: -1 });

        if (!order) {
            return res.redirect('/shop');
        }

        res.render('shopping-cart/order-confirmation', { locals, order, styles: styles, scripts: scripts });
    } catch(err) {
        console.log(err);
        res.status(500).send('Error: getting order confirmation!');
    }
};

const getSpecificOrderConfirmation = async (req, res) => {
    const locals = {
        title: 'Order Confirmation Page',
        description: 'The order confirmation in the GameVault web app displays a summary of the completed purchase, confirming payment and providing order details to the user.'
    };

    try {
        const userId = req.session.userId;
        const orderConfirmationID = req.params.id;
        const order = await Order.findOne({ _id: orderConfirmationID, userId });

        if (!order) {
            return res.redirect('/shop');
        }

        res.render('shopping-cart/order-confirmation', { locals, order, styles: styles, scripts: scripts });
    } catch(err) {
        console.log(err);
        res.status(500).send('Error: getting specific order confirmation!');
    }
};

module.exports = { getOrderConfirmation, getSpecificOrderConfirmation };