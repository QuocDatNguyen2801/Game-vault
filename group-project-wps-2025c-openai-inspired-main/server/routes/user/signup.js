const router = require("express").Router();
const authController = require("../../controllers/authController");

//Render page
router.get("/signup", authController.getSignup);

//Handle logic
router.post("/signup", authController.postSignup);

module.exports = router;
