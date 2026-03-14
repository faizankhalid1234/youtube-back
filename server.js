const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const isVercel = process.env.VERCEL === '1';
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files - only locally (Vercel ignores express.static)
if (!isVercel) {
  app.use(
    '/uploads',
    (req, res, next) => {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      next();
    },
    express.static(path.join(__dirname, 'uploads'), {
      setHeaders: (res, filePath) => {
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
}

// MongoDB - serverless-friendly: lazy connect, no infinite retry on Vercel
const MONGODB_URI =
  process.env.MONGODB_URI ||
  (isVercel ? '' : 'mongodb://localhost:27017/youtube-clone');
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  if (!MONGODB_URI) {
    const err = new Error(
      isVercel
        ? 'MONGODB_URI is not set. Add it in Vercel Project Settings → Environment Variables.'
        : 'MONGODB_URI is not set. Create a .env file with MONGODB_URI=your_connection_string'
    );
    throw err;
  }
  try {
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    if (!isVercel) {
      console.log('✅ MongoDB connected!');
      await seedSampleVideos();
    }
  } catch (error) {
    console.error('❌ MongoDB error:', error.message);
    if (!isVercel) {
      console.error('⏳ Retrying in 5 seconds...');
      setTimeout(connectDB, 5000);
    }
    throw error;
  }
}

if (!isVercel) {
  mongoose.connection.on('disconnected', () => console.log('⚠️ MongoDB disconnected'));
  mongoose.connection.on('error', (err) => console.error('❌ MongoDB error:', err));
  mongoose.connection.on('reconnected', () => console.log('✅ MongoDB reconnected'));
  connectDB();
}

// Video Schema
const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  videoUrl: { type: String, required: true },
  thumbnail: { type: String, default: '' },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Video = mongoose.model('Video', videoSchema);

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
      console.log('📹 Added 8 sample videos!');
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

// Create uploads dirs only locally
let videoStorage, thumbnailStorage;
if (!isVercel) {
  const uploadsDir = path.join(__dirname, 'uploads');
  const videosDir = path.join(uploadsDir, 'videos');
  const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
  [uploadsDir, videosDir, thumbnailsDir].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  videoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, videosDir),
    filename: (req, file, cb) =>
      cb(null, 'video-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
  });
  thumbnailStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, thumbnailsDir),
    filename: (req, file, cb) =>
      cb(null, 'thumbnail-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
  });
}

// Middleware: ensure DB connected (for Vercel cold starts)
const ensureDB = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(503).json({
      message: 'Database unavailable',
      error: isVercel ? undefined : err.message,
    });
  }
};

// Routes
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.post('/api/videos/seed', ensureDB, async (req, res) => {
  try {
    const added = await Video.insertMany(sampleVideos);
    res.json({ message: `Added ${added.length} sample videos!`, count: added.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/videos', ensureDB, async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/videos/search', ensureDB, async (req, res) => {
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

app.get('/api/videos/:id', ensureDB, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload - not supported on Vercel (ephemeral filesystem)
if (isVercel) {
  app.post('/api/videos/upload', (req, res) => {
    res.status(501).json({
      message: 'Video upload is not supported on Vercel. Use a local server or cloud storage (e.g. S3, Cloudinary).',
    });
  });
} else {
  app.post(
    '/api/videos/upload',
    (req, res, next) => {
      const upload = multer({
        storage: {
          _handleFile(req, file, cb) {
            file.fieldname === 'video'
              ? videoStorage._handleFile(req, file, cb)
              : thumbnailStorage._handleFile(req, file, cb);
          },
          _removeFile(req, file, cb) {
            file.fieldname === 'video'
              ? videoStorage._removeFile(req, file, cb)
              : thumbnailStorage._removeFile(req, file, cb);
          },
        },
        limits: { fileSize: 500 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
          if (
            (file.fieldname === 'video' && file.mimetype.startsWith('video/')) ||
            (file.fieldname === 'thumbnail' && file.mimetype.startsWith('image/'))
          )
            cb(null, true);
          else cb(new Error('Invalid file type'));
        },
      }).fields([
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ]);

      upload(req, res, (err) => (err ? res.status(400).json({ message: err.message }) : next()));
    },
    async (req, res) => {
      try {
        if (!req.files?.video) return res.status(400).json({ message: 'Video file is required' });
        const v = req.files.video[0];
        const t = req.files.thumbnail?.[0];
        const video = new Video({
          title: req.body.title || 'Untitled',
          description: req.body.description || '',
          videoUrl: `/uploads/videos/${v.filename}`,
          thumbnail: t ? `/uploads/thumbnails/${t.filename}` : '',
        });
        await video.save();
        res.status(201).json(video);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
}

app.put('/api/videos/:id/views', ensureDB, async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export for Vercel (required)
module.exports = app;

// Local: start server
if (!isVercel) {
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`✅ Server on http://localhost:${PORT}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} in use. Use different PORT or run: npm run kill-port`);
    }
    process.exit(1);
  });
}
