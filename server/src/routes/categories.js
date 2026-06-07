const router = require('express').Router();
const categoryController = require('../controllers/categoryController');
const auth = require('../middleware/auth');

router.get('/', auth(['admin', 'manager', 'resolver', 'end_user']), categoryController.list);
router.get('/:id', auth(['admin', 'manager', 'resolver', 'end_user']), categoryController.getById);
router.post('/', auth(['admin', 'manager']), categoryController.create);
router.put('/:id', auth(['admin', 'manager']), categoryController.update);
router.delete('/:id', auth(['admin', 'manager']), categoryController.remove);

module.exports = router;
