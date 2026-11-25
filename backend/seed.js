// Fills the database with an admin user, categories and sample products.
// Run with:  npm run seed      (WARNING: it deletes existing data first)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Cart = require('./models/Cart');

// Free demo images from Unsplash
const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=70`;

const categories = [
  { name: 'Electronics', icon: '📱', description: 'Phones, audio and gadgets' },
  { name: 'Fashion', icon: '👕', description: 'Clothing and shoes' },
  { name: 'Home & Living', icon: '🛋️', description: 'Furniture and decor' },
  { name: 'Beauty', icon: '💄', description: 'Skincare and personal care' },
  { name: 'Sports', icon: '⚽', description: 'Gear for every sport' },
  { name: 'Books', icon: '📚', description: 'Books and stationery' },
];

// [name, categoryName, price, oldPrice, stock, sold, rating, reviews, featured, brand, image, description]
const rows = [
  ['Wireless Headphones', 'Electronics', 89.99, 119.99, 40, 120, 4.6, 128, true, 'SoundPro', img('photo-1505740420928-5e560c06d30e'), 'Over-ear Bluetooth headphones with noise reduction and 30 hours of battery life.'],
  ['Smart Watch Series 5', 'Electronics', 119.99, 149.99, 25, 96, 4.4, 94, true, 'TechPro', img('photo-1523275335684-37898b6baf30'), 'Fitness tracking, heart-rate monitor, sleep tracking and 7-day battery.'],
  ['Portable Bluetooth Speaker', 'Electronics', 35.99, 39.99, 60, 88, 4.5, 88, false, 'Sonic', img('photo-1608043152269-423dbba4e7e1'), 'Waterproof speaker with deep bass and 12 hours of playtime.'],
  ['Digital Camera 24MP', 'Electronics', 199.99, 0, 12, 40, 4.7, 112, true, 'OptiShot', img('photo-1516035069371-29a1b244cc32'), 'Compact camera with 4K video, Wi-Fi sharing and a flip screen.'],
  ['Running Shoes Urban X1', 'Sports', 74.99, 0, 50, 156, 4.3, 156, true, 'SportMax', img('photo-1542291026-7eec264c27ff'), 'Lightweight, breathable running shoes with extra cushioning.'],
  ['Yoga Mat Pro', 'Sports', 24.99, 29.99, 80, 70, 4.5, 51, false, 'SportMax', img('photo-1601925260368-ae2f83cf8b7f'), 'Non-slip 6mm yoga mat with carrying strap.'],
  ['Explorer Backpack', 'Fashion', 42.49, 49.99, 35, 73, 4.4, 73, true, 'Urban Life', img('photo-1553062407-98eeb64c6a62'), 'Water-resistant 25L backpack with a padded laptop sleeve.'],
  ['Essential T-Shirt', 'Fashion', 14.99, 19.99, 200, 112, 4.5, 112, false, 'Urban Life', img('photo-1521572163474-6864f9cf17ab'), '100% cotton crew-neck t-shirt in a relaxed fit.'],
  ['Premium Sunglasses', 'Fashion', 28.99, 0, 45, 64, 4.2, 64, false, 'Urban Life', img('photo-1572635196237-14b3f281503f'), 'Polarized UV400 sunglasses with a durable frame.'],
  ['Cozy Gray Sofa', 'Home & Living', 399.0, 459.0, 6, 14, 4.6, 22, true, 'Home & Co', img('photo-1555041469-a586c61ea9bc'), 'Three-seat fabric sofa with solid wood legs.'],
  ['Ceramic Table Lamp', 'Home & Living', 32.0, 0, 30, 25, 4.3, 18, false, 'Home & Co', img('photo-1507473885765-e6ed057f782c'), 'Warm-light bedside lamp with a linen shade.'],
  ['Skincare Gift Set', 'Beauty', 39.99, 54.99, 28, 58, 4.5, 41, true, 'Glow', img('photo-1556228720-195a672e8a03'), 'Cleanser, serum and moisturizer for daily care.'],
  ['Hardcover Notebook Set', 'Books', 12.5, 0, 150, 90, 4.6, 77, false, 'PaperCo', img('photo-1531346878377-a5be20888e57'), 'Pack of 3 lined notebooks with thick, smooth paper.'],
  ['Learn JavaScript (Book)', 'Books', 27.0, 34.0, 4, 33, 4.8, 61, false, 'CodePress', img('photo-1544716278-ca5e3f4abd8c'), 'Beginner-friendly guide to modern JavaScript.'],
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Clearing old data...');
  await Promise.all([User.deleteMany(), Category.deleteMany(), Product.deleteMany(), Order.deleteMany(), Cart.deleteMany()]);

  await User.create({
    name: 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@shopnest.com',
    password: process.env.ADMIN_PASSWORD || 'Admin12345',
    role: 'admin',
  });

  const cats = await Category.insertMany(categories);
  const catId = Object.fromEntries(cats.map((c) => [c.name, c._id]));

  await Product.insertMany(
    rows.map(([name, cat, price, oldPrice, stock, sold, rating, numReviews, featured, brand, image, description]) => ({
      name, category: catId[cat], price, oldPrice, stock, sold, rating, numReviews, featured, brand, image, description,
    }))
  );

  console.log(`Done. Admin login: ${process.env.ADMIN_EMAIL || 'admin@shopnest.com'} / ${process.env.ADMIN_PASSWORD || 'Admin12345'}`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
