const router = require('express').Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/me', auth(), authController.me);
router.put('/password', auth(), authController.changePassword);

module.exports = router;
