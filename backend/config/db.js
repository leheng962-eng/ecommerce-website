const mongoose = require('mongoose');

// Connects to MongoDB using the address stored in the .env file.
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1); // stop the app: it cannot work without a database
  }
};

module.exports = connectDB;
