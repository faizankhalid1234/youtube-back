// Seed script to add sample videos
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

// Sample videos data
const sampleVideos = [
  {
    title: "Nature's Beauty - Mountain Landscape",
    description:
      'Beautiful mountain landscape with amazing views. Perfect for relaxation and inspiration.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    views: Math.floor(Math.random() * 10000) + 1000,
  },
  {
    title: 'Amazing Wildlife Documentary',
    description:
      'Watch amazing wildlife in their natural habitat. Educational and entertaining content.',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
    views: Math.floor(Math.random() * 15000) + 2000,
  },
  {
    title: 'City Life - Urban Adventure',
    description: 'Explore the hustle and bustle of city life. Urban exploration at its finest.',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
    views: Math.floor(Math.random() * 8000) + 500,
  },
  {
    title: 'Ocean Waves - Relaxing Sounds',
    description: "Peaceful ocean waves for meditation and relaxation. Nature's best therapy.",
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
    views: Math.floor(Math.random() * 12000) + 1500,
  },
  {
    title: 'Adventure Travel Vlog',
    description: 'Join us on an amazing adventure journey. Travel tips and amazing destinations.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnail:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg',
    views: Math.floor(Math.random() * 20000) + 3000,
  },
  {
    title: 'Cooking Tutorial - Delicious Recipes',
    description:
      'Learn to cook amazing dishes with easy step-by-step instructions. Perfect for beginners.',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    thumbnail:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
    views: Math.floor(Math.random() * 18000) + 2500,
  },
  {
    title: 'Tech Review - Latest Gadgets',
    description:
      'In-depth review of the latest technology gadgets. Honest opinions and detailed analysis.',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    thumbnail:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg',
    views: Math.floor(Math.random() * 25000) + 4000,
  },
  {
    title: 'Music Performance - Live Concert',
    description: 'Amazing live music performance. Feel the energy and enjoy the rhythm.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    thumbnail:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg',
    views: Math.floor(Math.random() * 30000) + 5000,
  },
];

async function seedVideos() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB!');

    // Clear existing videos (optional - comment out if you want to keep existing)
    // await Video.deleteMany({})
    // console.log('🗑️  Cleared existing videos')

    // Check if videos already exist
    const existingVideos = await Video.countDocuments();
    if (existingVideos > 0) {
      console.log(`📹 Found ${existingVideos} existing videos`);
      console.log('💡 To add more videos, run "npm run clear-db" first, then "npm run seed"');
      process.exit(0);
    }

    // Insert sample videos
    console.log('📥 Adding sample videos...');
    const insertedVideos = await Video.insertMany(sampleVideos);
    console.log(`✅ Successfully added ${insertedVideos.length} videos!`);

    console.log('\n📋 Added Videos:');
    insertedVideos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
    });

    console.log('\n🎉 Seeding completed successfully!');
    console.log('🌐 Start your server and visit http://localhost:3000 to see the videos');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding videos:', error.message);
    process.exit(1);
  }
}

seedVideos();
