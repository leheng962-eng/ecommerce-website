const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '🛍️' }, // an emoji keeps the demo simple
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
