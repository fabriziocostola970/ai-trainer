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
      connectSrc: ["'self'", "https://ai-trainer-production-8fd9.up.railway.app", "https://vendionline-eu-production.up.railway.app"]
    }
  }
}));

app.use(cors({
  origin: [
    'http://localhost:3000',  // VendiOnline.EU dev
    'http://localhost:4000',  // AI-Trainer dev (for testing)
    'https://vendionline-eu.railway.app',  // VendiOnline.EU prod
    'https://vendionline-eu-production.up.railway.app',  // VendiOnline.EU prod Railway (CORRETTO)
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

// API Authentication middleware for external services (like VendiOnline.EU)
const authenticateExternalAPI = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Missing or invalid authorization header'
    });
  }
  
  const token = authHeader.substring(7);
  
  // Check if it's an API key (for direct AI-Trainer usage)
  const expectedKey = process.env.AI_TRAINER_API_KEY || 'your-api-key-here';
  if (token === expectedKey) {
    return next();
  }
  
  // Check if it's a JWT token from VendiOnline.EU
  try {
    const jwt = require('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET || process.env.VENDI_ONLINE_JWT_SECRET;
    
    if (jwtSecret) {
      const decoded = jwt.verify(token, jwtSecret);
      console.log('✅ JWT token validated from VendiOnline.EU:', decoded.id || decoded.userId);
      return next();
    }
  } catch (jwtError) {
    console.log('❌ JWT validation failed:', jwtError.message);
  }
  
  return res.status(401).json({
    success: false,
    error: 'Invalid API key or JWT token'
  });
};

// 🔍 Debug endpoint to check JWT_SECRET configuration
app.get('/debug/jwt-secret', (req, res) => {
  const jwtSecret = process.env.JWT_SECRET;
  const vendiOnlineJwtSecret = process.env.VENDI_ONLINE_JWT_SECRET;
  const aiTrainerApiKey = process.env.AI_TRAINER_API_KEY;
  
  res.json({
    status: 'JWT_SECRET Configuration Check',
    timestamp: new Date().toISOString(),
    jwt_secret: {
      configured: !!jwtSecret,
      length: jwtSecret?.length || 0,
      source: jwtSecret ? 'JWT_SECRET' : null
    },
    vendi_online_jwt_secret: {
      configured: !!vendiOnlineJwtSecret,
      length: vendiOnlineJwtSecret?.length || 0,
      source: vendiOnlineJwtSecret ? 'VENDI_ONLINE_JWT_SECRET' : null
    },
    ai_trainer_api_key: {
      configured: !!aiTrainerApiKey,
      length: aiTrainerApiKey?.length || 0
    },
    authentication_status: {
      jwt_available: !!(jwtSecret || vendiOnlineJwtSecret),
      api_key_available: !!aiTrainerApiKey,
      hybrid_auth_supported: !!(jwtSecret || vendiOnlineJwtSecret) && !!aiTrainerApiKey
    }
  });
});

// 🔐 Debug endpoint to test JWT authentication
app.get('/debug/test-jwt', authenticateExternalAPI, (req, res) => {
  res.json({
    status: 'JWT Authentication Test Successful',
    timestamp: new Date().toISOString(),
    message: 'Token validated successfully',
    auth_type: 'JWT or API Key accepted'
  });
});

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

// 🔧 DEBUG: Check business types in database
app.get('/debug/business-types', async (req, res) => {
  try {
    const DatabaseStorage = require('./src/storage/database-storage');
    const storage = new DatabaseStorage();
    
    const result = await storage.pool.query(`
      SELECT business_type, COUNT(*) as count 
      FROM ai_design_patterns 
      GROUP BY business_type 
      ORDER BY count DESC
    `);
    
    const floristCheck = await storage.pool.query(`
      SELECT id, business_type, layout_structure, semantic_analysis 
      FROM ai_design_patterns 
      WHERE business_type ILIKE '%florist%' 
      OR business_type ILIKE '%flower%' 
      OR business_type ILIKE '%flor%'
      LIMIT 5
    `);
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      business_types: result.rows,
      florist_records: floristCheck.rows,
      total_records: result.rows.reduce((sum, row) => sum + parseInt(row.count), 0)
    });
  } catch (error) {
    res.status(500).json({
      status: 'Database query failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Training Interface Routes (with authentication)
app.use('/training', authenticateExternalAPI, require('./src/training/training-interface'));

// Public API Routes (with authentication) 
// 🎨 AI Layout Generation Routes - V6.0 Compatible
app.use('/api/generate-layout', authenticateExternalAPI, require('./src/api/generate-layout'));  // ✅ MODIFICATO: accetta JWT da VendiOnline.EU
app.use('/api/generate', authenticateExternalAPI, require('./src/api/generate-layout'));  // ✅ MODIFICATO: accetta JWT da VendiOnline.EU
app.use('/api/generate', authenticateExternalAPI, require('./src/api/generate-design')); // ✅ MODIFICATO: accetta JWT da VendiOnline.EU
app.use('/api/optimize', authenticateExternalAPI, require('./src/api/optimize-blocks')); // ✅ MODIFICATO: accetta JWT da VendiOnline.EU
app.use('/api/validate', authenticateExternalAPI, require('./src/api/validate-template')); // ✅ MODIFICATO: accetta JWT da VendiOnline.EU
app.use('/api/training', authenticateExternalAPI, require('./src/api/training')); // ✅ MODIFICATO: accetta JWT da VendiOnline.EU
app.use('/api/design', authenticateExternalAPI, require('./src/api/design-routes')); // ✅ MODIFICATO: accetta JWT da VendiOnline.EU
app.use('/api', authenticateExternalAPI, require('./src/api/setup-database')); // ✅ MODIFICATO: accetta JWT da VendiOnline.EU

// 🤖 NEW: Claude Sonnet Website Generator - Parallel System V1.0
app.use('/api/claude', authenticateExternalAPI, require('./src/api/claude-generator')); // ✅ MODIFICATO: accetta JWT da VendiOnline.EU
app.use('/api/ai-trainer', authenticateExternalAPI, require('./src/api/generate-layout')); // ✅ MODIFICATO: accetta JWT da VendiOnline.EU

// DB Admin API Route (deve essere dichiarata prima dei catch-all e dei 404 handler)
const dbAdminRoute = require('./src/api/db-admin');
app.use('/api/db-admin', dbAdminRoute);

app.use('/api/ai/competitors', authenticateAPI, require('./src/api/competitors'));

// 🧠 Auto-classification API
app.use('/api/training', authenticateAPI, require('./src/api/auto-classify'));

/* // 🔧 Admin API (schema management)
app.use('/api/admin', require('./src/api/admin')); */

// 🔧 DEBUG: Training endpoint WITHOUT authentication for testing
app.use('/debug/training', require('./src/api/training'));

// 🔧 DEBUG: Database analysis endpoints (NO AUTH for testing)
app.use('/api/debug', require('./src/api/debug'));

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
      'POST /api/claude/generate', // 🤖 NEW: Claude Sonnet website generator
      'GET /api/claude/patterns/:businessType', // 🔍 NEW: Claude pattern analysis
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
      'POST /api/claude/generate', // 🤖 Claude Sonnet generator
      'GET /api/claude/patterns/:businessType', // 🔍 Claude pattern analysis  
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

  // ✅ AI Design Patterns schema ready (supports multiple competitors per business_type)
  console.log('✅ AI Design Patterns schema ready (supports multiple competitors per business_type)');
});

module.exports = app;
