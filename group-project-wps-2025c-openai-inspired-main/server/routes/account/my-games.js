const router = require('express').Router();
const accountController = require('../../controllers/accountController');
const { requireSignin } = require('../../middlewares/authMiddleware');

//Render pages
//Normal view
router.get('/my-games', requireSignin, accountController.getMyGames);

module.exports = router;