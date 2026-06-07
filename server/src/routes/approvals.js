const router = require('express').Router();
const approvalController = require('../controllers/approvalController');
const auth = require('../middleware/auth');

router.get('/', auth(), approvalController.list);
router.get('/:id', auth(), approvalController.getById);
router.get('/ticket/:ticketId', auth(), approvalController.listByTicket);
router.post('/', auth(), approvalController.createApproval);
router.put('/:id/resolve', auth(), approvalController.resolve);

/* Approval definitions (admin/manager) */
router.get('/definitions', auth(['admin', 'manager']), approvalController.getDefinitions);
router.post('/definitions', auth(['admin', 'manager']), approvalController.createDefinition);
router.put('/definitions/:id', auth(['admin', 'manager']), approvalController.updateDefinition);
router.delete('/definitions/:id', auth(['admin']), approvalController.removeDefinition);

module.exports = router;
