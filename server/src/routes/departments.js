const router = require('express').Router();
const deptController = require('../controllers/departmentController');
const auth = require('../middleware/auth');

router.get('/', auth(['admin', 'manager']), deptController.list);
router.get('/:id', auth(['admin', 'manager']), deptController.getById);
router.post('/', auth(['admin']), deptController.create);
router.put('/:id', auth(['admin']), deptController.update);

module.exports = router;
