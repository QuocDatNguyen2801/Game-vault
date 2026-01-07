const express = require('express');
const router = express.Router();
const { getOrderConfirmation, getSpecificOrderConfirmation } = require('../../controllers/orderConfirmationController');

router.get('/', getOrderConfirmation);

router.get('/:id', getSpecificOrderConfirmation);

module.exports = router;