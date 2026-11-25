const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/products?search=&category=&minPrice=&maxPrice=&sort=&featured=&page=&limit=
exports.getProducts = asyncHandler(async (req, res) => {
  const { search, category, minPrice, maxPrice, sort, featured, onSale } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 12, 60);

  // 1) Build the filter object step by step
  const filter = {};
  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;
  if (featured === 'true') filter.featured = true;
  if (onSale === 'true') filter.$expr = { $gt: ['$oldPrice', '$price'] };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // 2) Choose the sort order
  const sortMap = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    popular: { sold: -1 },
    newest: { createdAt: -1 },
  };
  const sortBy = sortMap[sort] || { createdAt: -1 };

  // 3) Query + count (for pagination)
  const [products, total] = await Promise.all([
    Product.find(filter).populate('category', 'name').sort(sortBy).skip((page - 1) * limit).limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({ products, page, pages: Math.ceil(total / limit), total });
});

// GET /api/products/:id
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name');
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ product });
});

// POST /api/products   (admin)
exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ product });
});

// PUT /api/products/:id   (admin)
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ product });
});

// DELETE /api/products/:id   (admin)
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ message: 'Product deleted' });
});
