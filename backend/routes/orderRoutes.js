const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, adminOnly } = require('../middleware/auth');
const c = require('../controllers/orderController');

router.use(protect);

router.post(
  '/',
  [
    body('shippingAddress.fullName').trim().notEmpty().withMessage('Full name is required'),
    body('shippingAddress.phone').trim().notEmpty().withMessage('Phone is required'),
    body('shippingAddress.street').trim().notEmpty().withMessage('Street is required'),
    body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
    body('shippingAddress.country').trim().notEmpty().withMessage('Country is required'),
    body('paymentMethod').optional().isIn(['cod', 'card', 'paypal']).withMessage('Invalid payment method'),
  ],
  validate,
  c.createOrder
);

router.get('/mine', c.myOrders);
router.get('/', adminOnly, c.getAllOrders);          // admin
router.get('/:id', c.getOrder);
router.put(
  '/:id/status',
  adminOnly,
  [body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status')],
  validate,
  c.updateOrderStatus
);

module.exports = router;
