const router = require("express").Router();
const authController = require("../../controllers/authController");

//Render page
router.get("/signin", authController.getSignin);

//Handle logic
router.post("/signin", authController.postSignin);

module.exports = router;
