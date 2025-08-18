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
      scriptSrcAttr: ["'unsafe-inline'"],  // Allow inline event handlers
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
  const expectedKey = process.env.AI_TRAINER_API_KEY || 'your-api-key-here';
  
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

// 🔧 DEBUG: Database connection test endpoint
app.get('/debug/db', async (req, res) => {
  try {
    const DatabaseStorage = require('./src/storage/database-storage');
    const storage = new DatabaseStorage();
    
    const result = await storage.pool.query('SELECT 1 as test');
    res.json({
      status: 'Database connected',
      timestamp: new Date().toISOString(),
      test_query: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      status: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Training Interface Routes (with authentication)
app.use('/training', authenticateAPI, require('./src/training/training-interface'));

// Public API Routes (with authentication) 
app.use('/api/generate', authenticateAPI, require('./src/api/generate-layout'));
app.use('/api/generate', authenticateAPI, require('./src/api/generate-design')); // NEW: Design patterns API
app.use('/api/optimize', authenticateAPI, require('./src/api/optimize-blocks'));
app.use('/api/validate', authenticateAPI, require('./src/api/validate-template'));
app.use('/api/training', authenticateAPI, require('./src/api/training'));
app.use('/api/design', authenticateAPI, require('./src/api/design-routes')); // 🎨 NEW: Design Analysis API
app.use('/api', authenticateAPI, require('./src/api/setup-database')); // 🗄️ Database setup endpoint
app.use('/api/ai/competitors', authenticateAPI, require('./src/api/competitors'));

// 🧠 Auto-classification API
app.use('/api/training', authenticateAPI, require('./src/api/auto-classify'));

// 🔧 Admin API (schema management)
app.use('/api/admin', require('./src/api/admin'));

// 🔧 DEBUG: Training endpoint WITHOUT authentication for testing
app.use('/debug/training', require('./src/api/training'));

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
      'POST /api/generate/design-palette', // NEW: Design patterns
      'GET /api/analyze/design-trends/:businessType', // NEW: Design analytics
      'POST /api/optimize/blocks',
      'POST /api/validate/template'
    ]
  });
});

// Serve frontend interface at root
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'frontend', 'index.html');
  console.log('🔄 Serving clean dashboard interface (no React)');
  console.log('📁 File path:', filePath);
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('❌ Error serving index.html:', err);
      res.status(500).send(`
        <h1>🚨 Dashboard Loading Error</h1>
        <p>Could not load clean dashboard</p>
        <p>Error: ${err.message}</p>
        <p><a href="/clean">Try /clean route</a></p>
        <p><a href="/simple">Try /simple route</a></p>
      `);
    }
  });
});

// Explicit route for clean interface (now same as main)
app.get('/clean', (req, res) => {
  const filePath = path.join(__dirname, 'frontend', 'index.html');
  console.log('🧹 Serving clean interface explicitly');
  console.log('📁 File path:', filePath);
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('❌ Error serving clean interface:', err);
      res.status(500).json({ error: 'Could not load clean interface', details: err.message });
    }
  });
});

// Simple interface fallback
app.get('/simple', (req, res) => {
  const filePath = path.join(__dirname, 'frontend', 'index.simple.html');
  console.log('📱 Serving simple interface fallback');
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('❌ Error serving simple interface:', err);
      res.status(500).json({ error: 'Could not load simple interface', details: err.message });
    }
  });
});

// Legacy route redirect
app.get('/dashboard', (req, res) => {
  res.redirect('/');
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

// Catch-all: serve clean dashboard for SPA routing
app.get('*', (req, res) => {
  console.log('🔄 Catch-all route: serving clean dashboard');
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Competitors API Route
const competitorsRoute = require('./src/api/competitors');
app.use('/api/ai/competitors', competitorsRoute);

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
