const router = require('express').Router();
const groupController = require('../controllers/groupController');
const auth = require('../middleware/auth');

router.get('/', auth(['admin', 'manager', 'resolver', 'end_user']), groupController.list);
router.get('/:id', auth(['admin', 'manager', 'resolver', 'end_user']), groupController.getById);
router.post('/', auth(['admin', 'manager']), groupController.create);
router.put('/:id', auth(['admin', 'manager']), groupController.update);
router.delete('/:id', auth(['admin']), groupController.remove);

module.exports = router;
