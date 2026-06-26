const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/organizations', require('./organizations'));
router.use('/users', require('./users'));
router.use('/support-groups', require('./groups'));
router.use('/categories', require('./categories'));
router.use('/services', require('./services'));
router.use('/tickets', require('./tickets'));
router.use('/notifications', require('./notifications'));
router.use('/slas', require('./slas'));
router.use('/approvals', require('./approvals'));
router.use('/business-hours', require('./businessHours'));
router.use('/workflows', require('./workflows'));
router.use('/workflow-executions', require('./workflowExecutions'));
router.use('/form-templates', require('./formTemplates'));
router.use('/business-units', require('./businessUnits'));
router.use('/departments', require('./departments'));
router.use('/positions', require('./positions'));

module.exports = router;
