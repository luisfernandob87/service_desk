const router = require('express').Router();
const bhController = require('../controllers/businessHourController');
const auth = require('../middleware/auth');

router.get('/', auth(), bhController.list);
router.post('/', auth(['admin', 'manager']), bhController.create);
router.put('/:id', auth(['admin', 'manager']), bhController.update);
router.delete('/:id', auth(['admin']), bhController.remove);

module.exports = router;
