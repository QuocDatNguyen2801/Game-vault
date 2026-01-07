const router = require("express").Router();
const accountController = require("../../controllers/accountController");
const { requireSignin } = require("../../middlewares/authMiddleware");

//Render page
//Normal view
router.get("/security", requireSignin, accountController.getSecurity);

//Edit view
router.get("/security/edit", requireSignin, accountController.getSecurityEdit);

//Handle logic
router.post(
  "/security/edit",
  requireSignin,
  accountController.postSecurityEdit
);
router.post("/security/delete", requireSignin, accountController.deleteAccount);
router.post(
  "/security/deactivate",
  requireSignin,
  accountController.deactivateAccount
);
module.exports = router;
