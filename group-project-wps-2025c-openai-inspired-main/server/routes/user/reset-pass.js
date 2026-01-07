const router = require("express").Router();
const authController = require("../../controllers/authController");
const { requireResetSession } = require("../../middlewares/authMiddleware");

//NOTE: This route is for resetting the password, which is only accessible when a session is set.

// Middleware to check if the user is authenticated
//Render page
router.get("/signin/reset-pass", requireResetSession, authController.getResetPass);

//Handle logic
router.post("/signin/reset-pass", requireResetSession, authController.postResetPass);

module.exports = router;
