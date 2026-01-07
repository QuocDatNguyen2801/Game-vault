const router = require("express").Router();
const authController = require("../../controllers/authController");

//Render page
router.get("/signin/retrieval-check", authController.getRetrievalCheck);

//Handle logic
router.post("/signin/retrieval-check", authController.postRetrievalCheck);

module.exports = router;
