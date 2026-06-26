const router = require('express').Router();
const positionController = require('../controllers/positionController');
const auth = require('../middleware/auth');

router.get('/', auth(['admin', 'manager', 'resolver', 'end_user']), positionController.list);
router.get('/:id', auth(['admin', 'manager', 'resolver', 'end_user']), positionController.getById);
router.post('/', auth(['admin', 'manager']), positionController.create);
router.put('/:id', auth(['admin', 'manager']), positionController.update);
router.delete('/:id', auth(['admin']), positionController.remove);

module.exports = router;
