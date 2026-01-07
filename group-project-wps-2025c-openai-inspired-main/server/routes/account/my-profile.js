const router = require('express').Router();
const accountController = require('../../controllers/accountController');
const { requireSignin } = require('../../middlewares/authMiddleware');

//Render page
//Normal view
router.get('/', requireSignin, accountController.getMyProfile);
//Edit view
router.get('/edit', requireSignin, accountController.getMyProfileEdit);

//Handle Logic
router.post('/edit', requireSignin, accountController.postMyProfileEdit);

module.exports = router;