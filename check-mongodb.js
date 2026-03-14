// MongoDB Connection Checker Script
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/youtube-clone';

console.log('🔍 Checking MongoDB connection...');
console.log('Connection URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log('✅ MongoDB connection successful!');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed!');
    console.error('Error:', error.message);
    console.error('\n📝 Please check:');
    console.error('1. Is MongoDB installed?');
    console.error('2. Is MongoDB running?');
    console.error('3. Try: mongosh "mongodb://localhost:27017"');
    process.exit(1);
  });
