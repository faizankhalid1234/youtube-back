// Script to clear all videos from database
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/youtube-clone';

// Video Schema
const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  videoUrl: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    default: '',
  },
  views: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Video = mongoose.model('Video', videoSchema);

async function clearDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('Connection URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB!');
    console.log('Database:', mongoose.connection.name);

    // Count existing videos
    const countBefore = await Video.countDocuments();
    console.log(`\n📊 Found ${countBefore} videos in database`);

    if (countBefore === 0) {
      console.log('✅ Database is already empty!');
      process.exit(0);
    }

    // Delete all videos
    console.log('\n🗑️  Deleting all videos...');
    const result = await Video.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} videos successfully!`);

    // Verify deletion
    const countAfter = await Video.countDocuments();
    console.log(`\n📊 Remaining videos: ${countAfter}`);

    console.log('\n🎉 Database cleared successfully!');
    console.log('💡 Run "npm run seed" to add sample videos again');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    process.exit(1);
  }
}

clearDatabase();
