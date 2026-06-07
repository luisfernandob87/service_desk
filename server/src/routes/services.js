const router = require('express').Router();
const serviceController = require('../controllers/serviceController');
const auth = require('../middleware/auth');

/* Public routes - no auth needed */
router.get('/published/:orgId', serviceController.getPublished);
router.get('/published/:orgId/:id', serviceController.getById);

/* Admin/Manager routes */
router.get('/', auth(['admin', 'manager', 'resolver']), serviceController.list);
router.get('/:id', auth(['admin', 'manager', 'resolver']), serviceController.getById);
router.post('/', auth(['admin', 'manager']), serviceController.create);
router.put('/:id', auth(['admin', 'manager']), serviceController.update);
router.delete('/:id', auth(['admin']), serviceController.remove);

module.exports = router;
