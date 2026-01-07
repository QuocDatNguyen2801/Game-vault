const express = require("express");
const router = express.Router();
const { shopAdmin, gameDetails } = require("../../controllers/shopController");

const styles = `<link rel="stylesheet" href="/css/shopping-cart.css" />`;
const scripts = `<script src="/js/script.js"></script>`;

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + "-" + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
});

// router.get('/', (req, res) => {
//     const locals = {
//         title: 'Shopping Page - Gaming Store',
//         description: 'A seamless web app that lets gamers browse, add, and purchase their favorite titles with an intuitive shopping experience.'
//     };

//     res.render('shop', { locals, styles, scripts });
// });

router.get("/admin", shopAdmin);

router.get("/game/:slug", gameDetails);

module.exports = router;
