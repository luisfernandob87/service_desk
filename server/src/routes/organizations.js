const router = require('express').Router();
const orgController = require('../controllers/organizationController');
const auth = require('../middleware/auth');

/* Public - no auth needed */
router.get('/by-slug/:slug', orgController.getBySlug);

/* Authenticated read */
router.get('/', auth(['admin', 'manager', 'end_user']), orgController.list);
router.get('/:id', auth(['admin', 'manager', 'end_user']), orgController.getById);

/* Admin-only mutations */
router.post('/', auth(['admin']), orgController.create);
router.put('/:id', auth(['admin']), orgController.update);
router.patch('/:id/landing-config', auth(['admin', 'manager']), orgController.updateLandingConfig);
router.patch('/:id/login-config', auth(['admin', 'manager']), orgController.updateLoginConfig);
router.delete('/:id', auth(['admin']), orgController.remove);

module.exports = router;
