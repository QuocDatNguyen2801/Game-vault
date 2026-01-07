const styles = [
  `<link rel="stylesheet" href="/css/sitemap.css">`,
  `<link rel="stylesheet" href="/css/forum.css">`,
];
const scripts = `<script src="/js/forum.js"></script>`;
const { SitemapStream, streamToPromise } = require("sitemap");
const { Readable } = require("stream");

const staticRoutes = require("../data/staticRoutes");
const publicRoutes = staticRoutes.filter((route) => route.public !== false);

// GET /sitemap
exports.getSitemap = (req, res) => {
  res.render("sitemap/sitemap", {
    title: "Sitemap",
    layout: "layouts/main",
    styles,
    scripts,
    publicRoutes,
  });
};

const slugify = require("../utils/slugify");
// GET /sitemap.xml
exports.getSitemapXml = async (req, res) => {
  try {
    const hostname = req.protocol + "://" + req.get("host");
    const sitemap = new SitemapStream({ hostname });

    //Static routes
    publicRoutes.forEach((route) => {
      sitemap.write({
        url: route.url,
        changefreq: route.changefreq || "weekly",
        priority: route.priority || 0.8,
      });
    });

    // Products
    const Product = require("../models/Product");
    const products = await Product.find(
      { isDisabled: { $ne: true } },
      "title slug updatedAt"
    );
    products.forEach((product) => {
      sitemap.write({
        url: `/shop/product/${product.slug || slugify(product.title)}`,
        lastmod: product.updatedAt,
        changefreq: "weekly",
        priority: 0.9,
      });
    });

    // Reviews
    // const Review = require('../models/Review');
    // const reviews = await Review.find({}, 'title slug updatedAt');
    // reviews.forEach(review => {
    //   sitemap.write({
    //     url: `/reviews/${review.slug || slugify(review.title)}`,
    //     lastmod: review.updatedAt,
    //     changefreq: 'weekly',
    //     priority: 0.6,
    //   });
    // });

    // Blog posts
    // const Blog = require('../models/Post');
    // const blogs = await Blog.find({}, 'title slug updatedAt');
    // blogs.forEach(blog => {
    //   sitemap.write({
    //     url: `/blog/${blog.slug || slugify(blog.title)}`,
    //     lastmod: blog.updatedAt,
    //     changefreq: 'weekly',
    //     priority: 0.7,
    //   });
    // });

    sitemap.end();
    const xml = await streamToPromise(Readable.from(sitemap)).then((data) =>
      data.toString()
    );
    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
};
