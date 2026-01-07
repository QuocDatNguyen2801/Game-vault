const express = require('express');
const router = express.Router();
const sitemapController = require('../controllers/sitemapController');

// GET /sitemap
router.get('/sitemap', sitemapController.getSitemap);

// GET /sitemap.xml
router.get('/sitemap.xml', sitemapController.getSitemapXml);

module.exports = router;