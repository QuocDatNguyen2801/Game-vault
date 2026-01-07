const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },

    gameId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', // reference from 'Product.js'
        required: true
    },

    title: {
        type: String,
        required: true
    },
    
    slug: {
        type: String,
        required: false,
        unique: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    user: {
        type: String
    },

    date: {
        type: Date,
        default: Date.now,
        required: true
    },

    img: {
        type: String,
        required: true
    },
    
    stars: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },

    gameTitle: {
        type: String,
        required: true
    },

    content: {
        type: [String],
        required: true
    },

    isEdited: {
        type: Boolean,
        default: false
    },

    // hide review when author deactivates
    isHidden: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model('Review', reviewSchema);