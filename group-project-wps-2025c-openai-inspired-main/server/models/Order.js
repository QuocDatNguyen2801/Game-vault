const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        title: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        edition: {
            type: String,
            required: true,
            default: 'Standard'
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        image: {
            type: String,
            required: true
        }
    }],
    paymentDetails: {
        cardNumber: {
            type: String,
            required: [true, 'Card Number is required.']
        },
        cardName: {
            type: String,
            required: [true, 'Cardholder Name is required.']
        },
        expiryDate: {
            type: String,
            required: [true, 'Expiry Date is required.']
        },
        cvv: {
            type: String,
            required: [true, 'CVV is required.']
        },
    },
    shippingDetails: {
        address: {
            type: String,
            required: [true, 'Address is required.']
        },
        city: {
            type: String,
            required: [true, 'City is required.']
        },
        zip: {
            type: String,
            required: [true, 'ZIP Code is required.']
        },
        country: {
            type: String,
            required: [true, 'Country is required.']
        }
    },
    totals: {
        subtotal: {
            type: Number,
            required: true
        },
        tax: {
            type: Number,
            required: true
        },
        total: {
            type: Number,
            required: true
        }
    },
    status: {
        type: String,
        required: true,
        default: 'Completed'
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);