const router = require('express').Router();
const ticketController = require('../controllers/ticketController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

/* Auth required for all ticket routes */
router.use(auth());

router.get('/', ticketController.list);
router.post('/', ticketController.create);
router.get('/:id', ticketController.getById);
router.patch('/:id/status', ticketController.updateStatus);
router.patch('/:id/assign', ticketController.assign);
router.post('/:id/comments', ticketController.addComment);
router.post('/:id/attachments', upload.single('file'), ticketController.addAttachment);
router.post('/:id/relations', ticketController.addRelation);
router.patch('/:id/form-data', ticketController.updateFormData);

module.exports = router;
