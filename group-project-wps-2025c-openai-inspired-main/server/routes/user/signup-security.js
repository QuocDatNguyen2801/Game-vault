const router = require("express").Router();
const authController = require("../../controllers/authController");

//Render page
router.get("/signup/security", authController.getSignupSecurity);

//Handle logic
router.post("/signup/security", authController.postSignupSecurity);

module.exports = router;
