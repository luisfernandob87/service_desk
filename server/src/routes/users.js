const router = require('express').Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.use(auth(['admin', 'manager']));

router.get('/', userController.list);
router.get('/:id', userController.getById);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.delete('/:id', userController.remove);

module.exports = router;
