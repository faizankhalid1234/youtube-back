const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files with proper headers for video streaming
app.use(
  '/uploads',
  (req, res, next) => {
    // Enable Range requests for video seeking (YouTube-style)
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  },
  express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, filePath) => {
      // Set proper MIME types for videos and images
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.mov': 'video/quicktime',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
      };
      if (mimeTypes[ext]) {
        res.setHeader('Content-Type', mimeTypes[ext]);
      }
    },
  })
);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/youtube-clone';

// MongoDB connection options
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials if any

    await mongoose.connect(MONGODB_URI, mongooseOptions);

    console.log('✅ MongoDB connected successfully!');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port);

    await seedSampleVideos();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('\n📝 Troubleshooting tips:');
    console.error('1. Make sure MongoDB is installed and running');
    console.error('2. Check if MongoDB service is started:');
    console.error('   - Windows: Check Services or run "mongod"');
    console.error('   - Mac/Linux: Run "mongod" or "brew services start mongodb-community"');
    console.error('3. Verify connection string:', MONGODB_URI);
    console.error('4. Try connecting manually: mongosh "mongodb://localhost:27017"');
    console.error('\n⏳ Retrying connection in 5 seconds...\n');

    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected!');
});

// Start connection
connectDB();

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

// Sample videos (Google's free test videos - play without upload)
const sampleVideos = [
  {
    title: "Nature's Beauty - Mountain Landscape",
    description: 'Beautiful mountain landscape. Perfect for relaxation.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    views: 15000,
  },
  {
    title: 'Amazing Wildlife Documentary',
    description: 'Watch amazing wildlife in their natural habitat.',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
    views: 22000,
  },
  {
    title: 'City Life - Urban Adventure',
    description: 'Explore the hustle and bustle of city life.',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
    views: 8500,
  },
  {
    title: 'Ocean Waves - Relaxing Sounds',
    description: 'Peaceful ocean waves for meditation.',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
    views: 12000,
  },
  {
    title: 'Adventure Travel Vlog',
    description: 'Join us on an amazing adventure journey.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnail:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg',
    views: 25000,
  },
  {
    title: 'Cooking Tutorial - Delicious Recipes',
    description: 'Learn to cook with easy step-by-step instructions.',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    thumbnail:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
    views: 18000,
  },
  {
    title: 'Tech Review - Latest Gadgets',
    description: 'In-depth review of latest technology.',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    thumbnail:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg',
    views: 32000,
  },
  {
    title: 'Music Performance - Live Concert',
    description: 'Amazing live music performance.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    thumbnail:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg',
    views: 45000,
  },
];

async function seedSampleVideos() {
  try {
    const count = await Video.countDocuments();
    if (count === 0) {
      await Video.insertMany(sampleVideos);
      console.log('📹 Added 8 sample videos! Refresh the page to see them.');
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const videosDir = path.join(uploadsDir, 'videos');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');

[uploadsDir, videosDir, thumbnailsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer configuration for video upload
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Multer configuration for thumbnail upload
const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, thumbnailsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'thumbnail-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
});

const uploadThumbnail = multer({
  storage: thumbnailStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Routes

// Seed sample videos (call this to add demo videos)
app.post('/api/videos/seed', async (req, res) => {
  try {
    const added = await Video.insertMany(sampleVideos);
    res.json({ message: `Added ${added.length} sample videos!`, count: added.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all videos
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search videos
app.get('/api/videos/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const videos = await Video.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    }).sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single video
app.get('/api/videos/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload video - handles both video and thumbnail files
app.post(
  '/api/videos/upload',
  (req, res, next) => {
    const upload = multer({
      storage: {
        _handleFile: function (req, file, cb) {
          if (file.fieldname === 'video') {
            videoStorage._handleFile(req, file, cb);
          } else if (file.fieldname === 'thumbnail') {
            thumbnailStorage._handleFile(req, file, cb);
          }
        },
        _removeFile: function (req, file, cb) {
          if (file.fieldname === 'video') {
            videoStorage._removeFile(req, file, cb);
          } else if (file.fieldname === 'thumbnail') {
            thumbnailStorage._removeFile(req, file, cb);
          }
        },
      },
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB limit
      },
      fileFilter: (req, file, cb) => {
        if (file.fieldname === 'video' && file.mimetype.startsWith('video/')) {
          cb(null, true);
        } else if (file.fieldname === 'thumbnail' && file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'));
        }
      },
    }).fields([
      { name: 'video', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]);

    upload(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.files || !req.files.video) {
        return res.status(400).json({ message: 'Video file is required' });
      }

      const videoFile = req.files.video[0];
      const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

      const videoUrl = `/uploads/videos/${videoFile.filename}`;
      const thumbnailUrl = thumbnailFile ? `/uploads/thumbnails/${thumbnailFile.filename}` : '';

      const video = new Video({
        title: req.body.title,
        description: req.body.description || '',
        videoUrl: videoUrl,
        thumbnail: thumbnailUrl,
      });

      await video.save();
      res.status(201).json(video);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Increment view count
app.put('/api/videos/:id/views', async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;

// Start server with error handling for port conflicts
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.error('\n📝 Solutions:');
    console.error(`1. Kill the process using port ${PORT}:`);
    console.error(`   Windows: netstat -ano | findstr :${PORT}`);
    console.error(`   Then: taskkill /PID <PID> /F`);
    console.error(`   Mac/Linux: lsof -ti:${PORT} | xargs kill -9`);
    console.error(`\n2. Or use a different port by setting PORT in .env file`);
    console.error(`   Example: PORT=5001`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});
