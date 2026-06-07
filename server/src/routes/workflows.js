const router = require('express').Router();
const workflowController = require('../controllers/workflowController');
const auth = require('../middleware/auth');

router.get('/', auth(), workflowController.list);
router.get('/:id', auth(), workflowController.getById);
router.post('/', auth(['admin', 'manager']), workflowController.create);
router.put('/:id', auth(['admin', 'manager']), workflowController.update);
router.delete('/:id', auth(['admin']), workflowController.remove);

module.exports = router;
