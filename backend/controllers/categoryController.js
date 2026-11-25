const Category = require('../models/Category');
const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/categories  (also returns how many products each has)
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort('name').lean();
  const counts = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  categories.forEach((c) => (c.productCount = map[String(c._id)] || 0));
  res.json({ categories });
});

// POST /api/categories (admin)
exports.createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ category });
});

// PUT /api/categories/:id (admin)
exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json({ category });
});

// DELETE /api/categories/:id (admin)
exports.deleteCategory = asyncHandler(async (req, res) => {
  // Safety rule: do not delete a category that still has products
  if (await Product.exists({ category: req.params.id })) {
    return res.status(400).json({ message: 'Category still has products. Move or delete them first.' });
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json({ message: 'Category deleted' });
});
