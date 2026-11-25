const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, adminOnly } = require('../middleware/auth');
const c = require('../controllers/categoryController');

const rules = [body('name').trim().notEmpty().withMessage('Category name is required')];

router.get('/', c.getCategories);
router.post('/', protect, adminOnly, rules, validate, c.createCategory);
router.put('/:id', protect, adminOnly, rules, validate, c.updateCategory);
router.delete('/:id', protect, adminOnly, c.deleteCategory);

module.exports = router;
