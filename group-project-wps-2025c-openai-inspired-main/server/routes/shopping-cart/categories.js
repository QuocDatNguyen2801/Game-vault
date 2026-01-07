const express = require('express');
const router = express.Router();
const { getAllCategories, getSpecificCategory } = require('../../controllers/categoryController');

router.get('/', getAllCategories);

router.get('/:name', getSpecificCategory);

module.exports = router;