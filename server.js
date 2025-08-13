const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security & CORS
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://ai-trainer-production-8fd9.up.railway.app"]
    }
  }
}));

app.use(cors({
  origin: [
    'http://localhost:3000',  // VendiOnline.EU dev
    'http://localhost:4000',  // AI-Trainer dev (for testing)
    'https://vendionline-eu.railway.app',  // VendiOnline.EU prod
    'https://ai-trainer-production.up.railway.app',  // AI-Trainer prod Railway
    'https://ai-trainer-production-*.up.railway.app',  // Railway auto-generated URLs
    process.env.CORS_ORIGIN  // Railway environment variable
  ].filter(Boolean),  // Remove undefined values
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, 'frontend'), {
  maxAge: '1h',
  etag: true,
  lastModified: true
}));

// API Authentication middleware
const authenticateAPI = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.AI_TRAINER_API_KEY || 'ai-trainer-2aad7097cb20e8712a77213cbd9487300db4919b56d5097c';
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Missing or invalid authorization header'
    });
  }
  
  const token = authHeader.substring(7);
  if (token !== expectedKey) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key'
    });
  }
  
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'AI-Trainer',
    version: '1.2.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: {
      webInterface: true,
      trainingSystem: true,
      dataCollection: true,
      aiAnalysis: !!process.env.OPENAI_API_KEY
    }
  });
});

// Training Interface Routes (with authentication)
app.use('/training', authenticateAPI, require('./src/training/training-interface'));

// Public API Routes (with authentication) 
app.use('/api/generate', authenticateAPI, require('./src/api/generate-layout'));
app.use('/api/optimize', authenticateAPI, require('./src/api/optimize-blocks'));
app.use('/api/validate', authenticateAPI, require('./src/api/validate-template'));

// API Status endpoint (with authentication)
app.get('/api/status', authenticateAPI, (req, res) => {
  res.json({
    status: 'online',
    service: 'AI-Trainer API',
    version: '1.2.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    samples_count: 0, // TODO: Connect to actual database
    models_count: 1,
    last_training: 'Never',
    features: {
      webInterface: true,
      trainingSystem: true,
      dataCollection: true,
      aiAnalysis: !!process.env.OPENAI_API_KEY,
      offlineMode: true,
      pwa: true
    },
    endpoints: [
      'GET /api/status',
      'POST /api/generate/layout',
      'POST /api/optimize/blocks',
      'POST /api/validate/template'
    ]
  });
});

// Serve frontend interface at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// PWA Manifest
app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'manifest.json'));
});

// Service Worker
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'frontend', 'sw.js'));
});

// Development endpoint - API status (no auth required)
app.get('/status', (req, res) => {
  res.json({
    service: 'AI-Trainer',
    version: '1.2.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      web: '/',
      health: '/health',
      training: '/training/*',
      api: '/api/*'
    },
    authentication: {
      required: true,
      method: 'Bearer token',
      header: 'Authorization'
    },
    features: {
      webInterface: true,
      trainingSystem: true,
      dataCollection: true,
      aiAnalysis: !!process.env.OPENAI_API_KEY,
      offlineMode: true,
      pwa: true
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    available_endpoints: [
      'GET /health',
      'GET /status', 
      'POST /api/generate/layout',
      'POST /api/optimize/blocks',
      'POST /api/validate/template',
      'GET /training/',
      'POST /training/collect/website',
      'POST /training/collect/batch',
      'GET /training/samples',
      'GET /training/analytics'
    ],
    documentation: 'See README.md for full API documentation'
  });
});

// 404 handler for training routes
app.use('/training/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Training endpoint not found',
    message: 'Check the training interface documentation'
  });
});

// Catch-all: serve frontend for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 AI-Trainer server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Web Interface: http://localhost:${PORT}/`);
  console.log(`📊 Training API: http://localhost:${PORT}/training/`);
  console.log(`🛠️  API Status: http://localhost:${PORT}/status`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Check if training system is available
  try {
    require('./src/training/training-interface');
    console.log(`✅ Training system loaded successfully`);
  } catch (error) {
    console.warn(`⚠️  Training system not available:`, error.message);
  }
  
  // Check if data collector is available
  try {
    require('./src/training/data-collector');
    console.log(`✅ Data collector loaded successfully`);
  } catch (error) {
    console.warn(`⚠️  Data collector not available:`, error.message);
  }
});

module.exports = app;
