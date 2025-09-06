// Global error handlers for diagnostics
process.on('uncaughtException', (err, origin) => {
  console.error(`\n\nFATAL: Uncaught Exception\nERROR: ${err.stack || err}\nORIGIN: ${origin}\n`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`\n\nFATAL: Unhandled Rejection\nPROMISE: ${promise}\nREASON: ${reason.stack || reason}\n`);
  process.exit(1);
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Basic security and middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'frontend'), {
  maxAge: '1h',
  etag: true,
  lastModified: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'AI-Trainer',
    version: '1.2.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    port: PORT
  });
});

// Server status endpoint for dashboard
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    server: 'AI-Trainer',
    version: '1.2.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Training alerts endpoint
app.get('/api/training/alerts', (req, res) => {
  res.json({
    alerts: [],
    criticalAlerts: 0,
    warningAlerts: 0,
    lastCheck: new Date().toISOString()
  });
});

// Design extraction stats endpoint  
app.get('/api/design/extraction-stats', (req, res) => {
  res.json({
    totalExtractions: 0,
    successfulExtractions: 0,
    failedExtractions: 0,
    averageProcessingTime: 0,
    lastExtraction: null,
    stats: {
      today: 0,
      thisWeek: 0,
      thisMonth: 0
    }
  });
});

// Basic root endpoint
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'frontend', 'index.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(500).send('Dashboard loading error');
    }
  });
});

// Start server
console.log('🚀 Starting AI-Trainer server...');
console.log('📊 Process Info:', {
  pid: process.pid,
  platform: process.platform,
  nodeVersion: process.version,
  memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🤖 AI-Trainer server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Web Interface: http://localhost:${PORT}/`);
  console.log('🎉 Server startup completed successfully!');
});

module.exports = app;
