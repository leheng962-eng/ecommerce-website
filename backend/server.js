require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');

if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
  console.error('Missing JWT_SECRET or MONGO_URI. Copy .env.example to .env first.');
  process.exit(1);
}

const app = express();

// ---- Global middleware ----
// CSP is relaxed because the frontend loads Tailwind and images from CDNs.
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// ---- API routes ----
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Unknown /api routes return JSON 404
app.use('/api', notFound);

// ---- Serve the frontend (HTML/CSS/JS files) ----
// Folder is ../frontend locally, and /app/frontend inside Docker.
const frontendDir = process.env.FRONTEND_DIR || path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
