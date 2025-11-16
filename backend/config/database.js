const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ MongoDB Connected');
      return true;
    } else {
      console.log('⚠️ MongoDB connection skipped - Using mock data');
      return false;
    }
  } catch (error) {
    console.log('❌ MongoDB connection failed, using mock data');
    console.log('💡 MongoDB Error:', error.message);
    return false;
  }
};

module.exports = connectDB;