const router = require('express').Router();
const workflowExecutionController = require('../controllers/workflowExecutionController');
const auth = require('../middleware/auth');

router.get('/', auth(), workflowExecutionController.listRequests);
router.get('/:id', auth(), workflowExecutionController.getById);
router.get('/by-ticket/:ticketId', auth(), workflowExecutionController.listByTicket);

module.exports = router;
