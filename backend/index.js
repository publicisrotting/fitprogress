const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
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
      // Start an in-memory MongoDB instance
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      
      await mongoose.connect(uri);
      console.log('✅ Connected to In-Memory Local MongoDB');
      console.log('📝 Note: Data is temporary and will be reset when server stops.');
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
