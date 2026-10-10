const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[MongoDB Atlas] Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`[MongoDB Atlas] Connection Error: ${error.message}`);
    console.warn(`[MongoDB Atlas] Fallback memory/active mode enabled`);
    return false;
  }
};

module.exports = connectDB;
