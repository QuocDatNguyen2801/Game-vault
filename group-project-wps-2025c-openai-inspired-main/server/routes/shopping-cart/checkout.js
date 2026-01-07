const express = require('express');
const router = express.Router();
const { getCheckout, postCheckout } = require('../../controllers/checkoutController');

router.get('/', getCheckout);

router.post('/', postCheckout);

module.exports = router;