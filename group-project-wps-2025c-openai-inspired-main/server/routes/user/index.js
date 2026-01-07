const router = require("express").Router();
const authController = require("../../controllers/authController");

router.use(require("./signin"));
router.use(require("./signup"));
router.use(require("./signup-security"));
router.use(require("./retrieval-check"));
router.use(require("./reset-pass"));
router.get("/logout", authController.logout);

module.exports = router;