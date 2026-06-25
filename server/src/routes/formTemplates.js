const router = require('express').Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/formTemplateController');

router.get('/', auth(['admin', 'manager', 'resolver']), controller.list);
router.get('/:id', auth(['admin', 'manager', 'resolver']), controller.getById);
router.post('/', auth(['admin', 'manager']), controller.create);
router.put('/:id', auth(['admin', 'manager']), controller.update);
router.delete('/:id', auth(['admin', 'manager']), controller.remove);

module.exports = router;
