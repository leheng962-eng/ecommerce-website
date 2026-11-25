const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');

// Load the user's cart with full product data, dropping deleted products.
const loadCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  cart.items = cart.items.filter((i) => i.product); // product may have been deleted
  return cart;
};

// Format the cart for the browser, including totals.
const format = (cart) => {
  const items = cart.items.map((i) => ({
    product: i.product,
    quantity: i.quantity,
    lineTotal: +(i.product.price * i.quantity).toFixed(2),
  }));
  return {
    items,
    totalItems: items.reduce((s, i) => s + i.quantity, 0),
    subtotal: +items.reduce((s, i) => s + i.lineTotal, 0).toFixed(2),
  };
};

// GET /api/cart
exports.getCart = asyncHandler(async (req, res) => {
  res.json(format(await loadCart(req.user._id)));
});

// POST /api/cart   body: { productId, quantity }
exports.addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const cart = await loadCart(req.user._id);
  const existing = cart.items.find((i) => String(i.product._id) === productId);
  const newQty = (existing ? existing.quantity : 0) + Number(quantity);
  if (newQty > product.stock) {
    return res.status(400).json({ message: `Only ${product.stock} in stock` });
  }
  if (existing) existing.quantity = newQty;
  else cart.items.push({ product: product._id, quantity: Number(quantity) });

  await cart.save();
  res.json(format(await loadCart(req.user._id)));
});

// PUT /api/cart/:productId   body: { quantity }
exports.updateQuantity = asyncHandler(async (req, res) => {
  const quantity = Number(req.body.quantity);
  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (quantity > product.stock) return res.status(400).json({ message: `Only ${product.stock} in stock` });

  const cart = await loadCart(req.user._id);
  const item = cart.items.find((i) => String(i.product._id) === req.params.productId);
  if (!item) return res.status(404).json({ message: 'Item not in cart' });

  if (quantity <= 0) cart.items = cart.items.filter((i) => i !== item);
  else item.quantity = quantity;

  await cart.save();
  res.json(format(await loadCart(req.user._id)));
});

// DELETE /api/cart/:productId
exports.removeItem = asyncHandler(async (req, res) => {
  const cart = await loadCart(req.user._id);
  cart.items = cart.items.filter((i) => String(i.product._id) !== req.params.productId);
  await cart.save();
  res.json(format(await loadCart(req.user._id)));
});

// DELETE /api/cart
exports.clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
  res.json({ items: [], totalItems: 0, subtotal: 0 });
});

// POST /api/cart/merge   body: { items: [{ productId, quantity }] }
// Used after login: moves the guest's localStorage cart into the account.
exports.mergeCart = asyncHandler(async (req, res) => {
  const incoming = Array.isArray(req.body.items) ? req.body.items : [];
  const cart = await loadCart(req.user._id);

  for (const { productId, quantity } of incoming) {
    const product = await Product.findById(productId).catch(() => null);
    if (!product) continue;
    const existing = cart.items.find((i) => String(i.product._id) === String(productId));
    const qty = Math.min((existing ? existing.quantity : 0) + Number(quantity || 1), product.stock);
    if (qty <= 0) continue;
    if (existing) existing.quantity = qty;
    else cart.items.push({ product: product._id, quantity: qty });
  }
  await cart.save();
  res.json(format(await loadCart(req.user._id)));
});
