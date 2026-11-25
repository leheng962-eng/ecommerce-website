const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    // If oldPrice is bigger than price, the product is "on sale".
    oldPrice: { type: Number, default: 0, min: 0 },
    // Relationship: each product belongs to ONE category
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: String, default: '' },
    image: { type: String, default: '' }, // image URL
    stock: { type: Number, required: true, min: 0, default: 0 },
    sold: { type: Number, default: 0 }, // used for "popular" sorting
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Text index makes searching by name/description/brand fast.
productSchema.index({ name: 'text', description: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);
