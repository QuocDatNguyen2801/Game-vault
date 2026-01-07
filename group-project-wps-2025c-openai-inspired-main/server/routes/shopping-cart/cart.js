const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCart, deleteItem } = require('../../controllers/cartController');

router.get('/', getCart);

router.post('/add/:id', addToCart);

router.post('/update/:id', updateCart);

router.delete('/delete/:id', deleteItem);

module.exports = router;