const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, adminOnly } = require('../middleware/auth');
const c = require('../controllers/productController');

const productRules = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be 0 or more'),
  body('category').isMongoId().withMessage('A valid category is required'),
];

// Public
router.get('/', c.getProducts);
router.get('/:id', c.getProduct);

// Admin only
router.post('/', protect, adminOnly, productRules, validate, c.createProduct);
router.put('/:id', protect, adminOnly, productRules, validate, c.updateProduct);
router.delete('/:id', protect, adminOnly, c.deleteProduct);

module.exports = router;
