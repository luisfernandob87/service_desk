const router = require('express').Router();
const buController = require('../controllers/businessUnitController');
const auth = require('../middleware/auth');

router.get('/', auth(['admin', 'manager']), buController.list);
router.get('/:id', auth(['admin', 'manager']), buController.getById);
router.post('/', auth(['admin']), buController.create);
router.put('/:id', auth(['admin']), buController.update);

module.exports = router;
