const express = require('express');
const router = express.Router();
const { getOrdersHistory } = require('../../controllers/ordersController');

router.get('/', getOrdersHistory);

module.exports = router;