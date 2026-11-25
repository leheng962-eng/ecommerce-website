const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const c = require('../controllers/cartController');

router.use(protect); // every cart route needs login

router.get('/', c.getCart);
router.post(
  '/',
  [body('productId').isMongoId().withMessage('Valid productId required'),
   body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be 1 or more')],
  validate,
  c.addToCart
);
router.post('/merge', c.mergeCart);
router.put('/:productId', [body('quantity').isInt({ min: 0 }).withMessage('Invalid quantity')], validate, c.updateQuantity);
router.delete('/:productId', c.removeItem);
router.delete('/', c.clearCart);

module.exports = router;
