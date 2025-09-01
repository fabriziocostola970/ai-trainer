const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// 🚀 LIGHTWEIGHT MODE: Disable heavy features for faster Railway deployment
const LIGHTWEIGHT_MODE = process.env.LIGHTWEIGHT_MODE === 'true';
const DISABLE_TRAINING_SYSTEM = process.env.DISABLE_TRAINING_SYSTEM === 'true';
const DISABLE_DATA_COLLECTION = process.env.DISABLE_DATA_COLLECTION === 'true';

console.log('🔧 Environment Variables Check:');
console.log('- PORT:', PORT);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'NOT SET');
console.log('- ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Set' : 'NOT SET');
console.log('- LIGHTWEIGHT_MODE:', LIGHTWEIGHT_MODE);
console.log('- DISABLE_TRAINING_SYSTEM:', DISABLE_TRAINING_SYSTEM);
console.log('- DISABLE_DATA_COLLECTION:', DISABLE_DATA_COLLECTION);

if (LIGHTWEIGHT_MODE) {
  console.log('🚀 [LIGHTWEIGHT MODE] Enabled - Heavy features disabled for faster deployment');
}
if (DISABLE_TRAINING_SYSTEM) {
  console.log('🚫 [TRAINING SYSTEM] Disabled for production optimization');
}
if (DISABLE_DATA_COLLECTION) {
  console.log('🚫 [DATA COLLECTION] Disabled for production optimization');
}

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

// Health check endpoint with detailed diagnostics
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    service: 'AI-Trainer',
    version: '1.2.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment_variables: {
      PORT: !!process.env.PORT,
      NODE_ENV: !!process.env.NODE_ENV,
      DATABASE_URL: !!process.env.DATABASE_URL,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      LIGHTWEIGHT_MODE: process.env.LIGHTWEIGHT_MODE === 'true'
    },
    features: {
      webInterface: true,
      trainingSystem: !DISABLE_TRAINING_SYSTEM,
      dataCollection: !DISABLE_DATA_COLLECTION,
      aiAnalysis: !!(process.env.OPENAI_API_KEY && process.env.ANTHROPIC_API_KEY)
    }
  };

  // Check if critical services are missing
  const criticalMissing = [];
  if (!process.env.OPENAI_API_KEY) criticalMissing.push('OPENAI_API_KEY');
  if (!process.env.ANTHROPIC_API_KEY) criticalMissing.push('ANTHROPIC_API_KEY');

  if (criticalMissing.length > 0) {
    healthCheck.status = 'DEGRADED';
    healthCheck.critical_missing = criticalMissing;
    res.status(503);
  }

  res.json(healthCheck);
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

// Training Interface Routes (with authentication) - DISABLED in lightweight mode
if (!DISABLE_TRAINING_SYSTEM && !LIGHTWEIGHT_MODE) {
  app.use('/training', authenticateAPI, require('./src/training/training-interface'));
  console.log('✅ [TRAINING SYSTEM] Enabled');
} else {
  console.log('🚫 [TRAINING SYSTEM] Disabled (lightweight mode)');
  // Fallback route for disabled training system
  app.use('/training', (req, res) => {
    res.status(503).json({
      error: 'Training system disabled in lightweight mode',
      message: 'This feature is not available in the current deployment configuration'
    });
  });
}

// Data collection routes - DISABLED in lightweight mode
if (!DISABLE_DATA_COLLECTION && !LIGHTWEIGHT_MODE) {
  app.use('/api/ai/competitors', authenticateAPI, require('./src/api/competitors'));
  app.use('/api/training', authenticateAPI, require('./src/api/auto-classify'));
  console.log('✅ [DATA COLLECTION] Enabled');
} else {
  console.log('🚫 [DATA COLLECTION] Disabled (lightweight mode)');
}

// Public API Routes (with authentication)

/* // 🔧 Admin API (schema management)
app.use('/api/admin', require('./src/api/admin')); */

// 🔧 DEBUG: Training endpoint WITHOUT authentication for testing - DISABLED in lightweight mode
if (!LIGHTWEIGHT_MODE) {
  app.use('/debug/training', require('./src/api/training'));
  console.log('✅ [DEBUG ENDPOINTS] Enabled');
} else {
  console.log('🚫 [DEBUG ENDPOINTS] Disabled (lightweight mode)');
}

// 🔧 DEBUG: Database analysis endpoints (NO AUTH for testing) - DISABLED in lightweight mode
if (!LIGHTWEIGHT_MODE) {
  app.use('/api/debug', require('./src/api/debug'));
  console.log('✅ [DATABASE DEBUG] Enabled');
} else {
  console.log('🚫 [DATABASE DEBUG] Disabled (lightweight mode)');
}

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

// Start server with error handling
console.log('🚀 Starting AI-Trainer server...');
console.log('📊 Process Info:', {
  pid: process.pid,
  platform: process.platform,
  nodeVersion: process.version,
  memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
});

try {
  // Check critical environment variables before starting
  const criticalVars = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY'];
  const missingVars = criticalVars.filter(varName => !process.env[varName]);

  console.log('🔍 Checking critical environment variables...');
  criticalVars.forEach(varName => {
    console.log(`- ${varName}: ${process.env[varName] ? '✅ Set' : '❌ NOT SET'}`);
  });

  if (missingVars.length > 0) {
    console.error('❌ Missing critical environment variables:', missingVars.join(', '));
    console.error('🔧 Please configure these in Railway dashboard under Variables');
    console.error('💡 Railway URL: https://railway.app/project/YOUR_PROJECT/variables');
    process.exit(1);
  }

  console.log('✅ All critical variables are set, proceeding with server startup...');

  // Test database connection before starting server
  console.log('🔌 Testing database connection...');
  if (process.env.DATABASE_URL) {
    try {
      const { Client } = require('pg');
      const client = new Client({ connectionString: process.env.DATABASE_URL });
      await client.connect();
      console.log('✅ Database connection successful');
      await client.end();
    } catch (dbError) {
      console.warn('⚠️  Database connection warning:', dbError.message);
      console.log('ℹ️  This is usually not critical - proceeding with startup');
    }
  } else {
    console.log('ℹ️  No DATABASE_URL configured - skipping database test');
  }

  app.listen(PORT, () => {
    console.log(`🤖 AI-Trainer server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🌐 Web Interface: http://localhost:${PORT}/`);
    console.log(`📊 Training API: http://localhost:${PORT}/training/`);
    console.log(`🛠️  API Status: http://localhost:${PORT}/status`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('🎉 Server startup completed successfully!');
    console.log('📝 Note: PostgreSQL collation warnings are normal and don\'t affect functionality');
    
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

  console.log('⏳ Attempting to bind to port', PORT);
} catch (error) {
  console.error('❌ Failed to start server:', error.message);
  console.error('🔍 Stack trace:', error.stack);
  console.error('💡 This usually means:');
  console.error('   - Port', PORT, 'is already in use');
  console.error('   - Missing environment variables');
  console.error('   - Application code error');
  process.exit(1);
}

module.exports = app;
