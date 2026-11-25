const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const c = require('../controllers/adminController');

router.use(protect, adminOnly); // everything here is admin only

router.get('/stats', c.getStats);
router.get('/users', c.getUsers);

module.exports = router;
