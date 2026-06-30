const router = require('express').Router();
const slaController = require('../controllers/slaController');
const auth = require('../middleware/auth');

router.get('/', auth(['admin', 'manager']), slaController.list);
router.get('/:id', auth(['admin', 'manager']), slaController.getById);
router.post('/', auth(['admin', 'manager']), slaController.create);
router.put('/:id', auth(['admin', 'manager']), slaController.update);
router.delete('/:id', auth(['admin']), slaController.remove);

module.exports = router;