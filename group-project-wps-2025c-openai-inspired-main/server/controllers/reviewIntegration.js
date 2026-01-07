const fs = require('fs');
const path = require('path');
const reviewStorage = require('../data/reviewStorage'); 
const Review = require('../models/Review');
const mongoose = require('mongoose');

exports.reviewStyles = [
    `<link rel="stylesheet" href="/css/customerReview.css" />`, 
    `<link rel="stylesheet" href="/css/formReview.css" />`, 
    `<link rel="stylesheet" href="/css/full-review.css" />`
]; 

exports.reviewScripts = [
    `<script src="/js/customerReview.js"></script>`, 
    `<script src="/js/formReview.js"></script>`, 
    `<script src="/js/full-review.js"></script>`
]; 

// get review data
exports.getReviewDataForGame = async (req, productTitle) => {
    let reviewCount = 0;

    try {
        reviewCount = await Review.countDocuments({
            gameTitle: productTitle,
            isHidden: { $ne: true },
        });
    } catch (err) {
        reviewCount = 0;
        console.error("No reviews to count", err);
    }

    return { reviewCount };
};