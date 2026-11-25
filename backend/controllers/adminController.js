const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/admin/stats
exports.getStats = asyncHandler(async (req, res) => {
  const [users, products, orders, revenueAgg, byStatus, lowStock] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments(),
    Order.countDocuments(),
    // revenue = every order that is not cancelled
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Product.find({ stock: { $lte: 5 } }).select('name stock').limit(8),
  ]);

  // Sales for the last 14 days (for the bar chart)
  const since = new Date(); since.setDate(since.getDate() - 13); since.setHours(0, 0, 0, 0);
  const daily = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, status: { $ne: 'cancelled' } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$totalPrice' } } },
  ]);
  const dailyMap = Object.fromEntries(daily.map((d) => [d._id, d.total]));
  const salesByDay = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(since); d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    salesByDay.push({ date: key, total: +(dailyMap[key] || 0).toFixed(2) });
  }

  const topProducts = await Product.find().sort('-sold').limit(5).select('name sold price image');

  res.json({
    users, products, orders,
    revenue: +(revenueAgg[0]?.total || 0).toFixed(2),
    ordersByStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    salesByDay, topProducts, lowStock,
  });
});

// GET /api/admin/users
exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort('-createdAt');
  // number of orders per user
  const counts = await Order.aggregate([{ $group: { _id: '$user', n: { $sum: 1 }, spent: { $sum: '$totalPrice' } } }]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c]));
  res.json({
    users: users.map((u) => ({
      id: u._id, name: u.name, email: u.email, role: u.role, phone: u.phone, createdAt: u.createdAt,
      orders: map[String(u._id)]?.n || 0, spent: +(map[String(u._id)]?.spent || 0).toFixed(2),
    })),
  });
});
