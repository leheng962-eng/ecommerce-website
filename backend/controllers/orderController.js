const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');

const FREE_SHIPPING_OVER = 50; // dollars
const SHIPPING_FEE = 5;

// POST /api/orders
// The server builds the order from the user's CART in the database.
// Prices come from the database, NOT from the browser, so nobody can cheat.
exports.createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = 'cod' } = req.body;

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  const validItems = cart ? cart.items.filter((i) => i.product) : [];
  if (validItems.length === 0) return res.status(400).json({ message: 'Your cart is empty' });

  // 1) Reserve stock (atomic: only decrements if enough stock remains)
  const reserved = [];
  try {
    for (const item of validItems) {
      const result = await Product.updateOne(
        { _id: item.product._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity, sold: item.quantity } }
      );
      if (result.modifiedCount === 0) {
        throw Object.assign(new Error(`Not enough stock for "${item.product.name}"`), { status: 400 });
      }
      reserved.push(item);
    }
  } catch (err) {
    // Put back whatever we already took
    for (const r of reserved) {
      await Product.updateOne({ _id: r.product._id }, { $inc: { stock: r.quantity, sold: -r.quantity } });
    }
    throw err;
  }

  // 2) Create the order
  const items = validItems.map((i) => ({
    product: i.product._id, name: i.product.name, image: i.product.image,
    price: i.product.price, quantity: i.quantity,
  }));
  const itemsPrice = +items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2);
  const shippingPrice = itemsPrice >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;

  const order = await Order.create({
    user: req.user._id, items, shippingAddress, paymentMethod,
    itemsPrice, shippingPrice, totalPrice: +(itemsPrice + shippingPrice).toFixed(2),
    // Demo only: real card/PayPal payments need a gateway such as Stripe.
    isPaid: false,
  });

  // 3) Empty the cart
  cart.items = [];
  await cart.save();

  res.status(201).json({ order });
});

// GET /api/orders/mine
exports.myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  res.json({ orders });
});

// GET /api/orders/:id  (owner or admin)
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return res.status(404).json({ message: 'Order not found' });
  const ownerId = String(order.user._id || order.user);
  if (ownerId !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not allowed' });
  }
  res.json({ order });
});

// GET /api/orders   (admin)
exports.getAllOrders = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const orders = await Order.find(filter).populate('user', 'name email').sort('-createdAt');
  res.json({ orders });
});

// PUT /api/orders/:id/status   (admin)
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  const { status } = req.body;
  // If an order is cancelled, give the stock back (only once)
  if (status === 'cancelled' && order.status !== 'cancelled') {
    for (const i of order.items) {
      await Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity, sold: -i.quantity } });
    }
  }
  order.status = status;
  if (status === 'delivered') order.isPaid = true; // cash on delivery is paid on arrival
  await order.save();
  res.json({ order });
});
