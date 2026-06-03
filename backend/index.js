const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5001;

// Simple in-memory rate limiter (per IP, no external dep)
const rateLimitMap = new Map();
function rateLimit(windowMs, max) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const entry = rateLimitMap.get(key) || { count: 0, start: now };
    if (now - entry.start > windowMs) {
      entry.count = 1;
      entry.start = now;
    } else {
      entry.count++;
    }
    rateLimitMap.set(key, entry);
    if (entry.count > max) {
      return res.status(429).json({ message: 'Too many requests, please try again later.' });
    }
    next();
  };
}

// Middleware
app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:5001'];

app.use(cors({
  origin: (origin, callback) => {
    // allow same-origin / mobile native (no origin header)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, true); // permissive in dev; restrict via env in prod
  },
  credentials: true
}));

app.use(express.json({
  limit: '2mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Rate limit auth endpoints (15 requests per 15 minutes per IP)
app.use('/api/auth', rateLimit(15 * 60 * 1000, 15));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes - wrapped in try-catch for debugging
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/user', require('./routes/user'));
  app.use('/api/workouts', require('./routes/workouts'));
  app.use('/api/exercises', require('./routes/exercises'));
  app.use('/api/programs', require('./routes/programs'));
  app.use('/api/notifications', require('./routes/notifications'));
  app.use('/api/billing', require('./routes/billing'));
} catch (routeErr) {
  console.error('❌ Error loading routes:', routeErr.message);
  console.error(routeErr.stack);
}

// MongoDB Connection
const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;

  try {
    console.log('Attempting to connect to Cloud MongoDB...');
    // Try connecting to Cloud DB with a 5-second timeout
    await mongoose.connect(MONGODB_URI, { 
      serverSelectionTimeoutMS: 5000 
    });
    console.log('✅ Connected to Cloud MongoDB');
  } catch (err) {
    console.log('⚠️ Could not connect to Cloud MongoDB (likely IP whitelist issue or no internet).');
    console.log('🔄 Switching to In-Memory Local Database (Offline Mode)...');
    
    try {
      const fs = require('fs');
      const dbPath = path.join(__dirname, '.mongo-data');
      if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });

      // Clear stale WiredTiger locks left by a previous (killed) instance,
      // otherwise the new mongod refuses to start.
      ['mongod.lock', 'WiredTiger.lock'].forEach(f => {
        try { fs.existsSync(path.join(dbPath, f)) && fs.unlinkSync(path.join(dbPath, f)); } catch {}
      });

      let mongod;
      try {
        // Persistent — data survives restarts
        mongod = await MongoMemoryServer.create({ instance: { dbPath, storageEngine: 'wiredTiger' } });
        await mongoose.connect(mongod.getUri());
        console.log('✅ Connected to Local MongoDB (persistent at backend/.mongo-data)');
      } catch (persistErr) {
        // Fallback to ephemeral so the server always boots
        console.log('⚠️ Persistent DB locked, using ephemeral in-memory DB:', persistErr.message);
        mongod = await MongoMemoryServer.create();
        await mongoose.connect(mongod.getUri());
        console.log('✅ Connected to ephemeral in-memory MongoDB');
      }
    } catch (innerErr) {
      console.error('❌ Fatal: Could not connect to any database.', innerErr);
      // Don't exit process, just log error so console stays open
    }
  }
};

// Connect to DB
connectDB();

// Routes
app.get('/', (req, res) => {
  res.send('FitProgress API is running');
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running', 
    timestamp: new Date() 
  });
});

// Global error handler for uncaught errors
app.use((err, req, res, next) => {
  console.error('🔴 Detailed Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  res.status(500).json({ error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
