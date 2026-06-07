const router = require('express').Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.get('/', auth(), notificationController.list);
router.get('/unread-count', auth(), notificationController.unreadCount);
router.put('/:id/read', auth(), notificationController.markRead);
router.put('/read-all', auth(), notificationController.markAllRead);
router.delete('/:id', auth(), notificationController.remove);
router.post('/clear-read', auth(), notificationController.clearRead);

module.exports = router;
