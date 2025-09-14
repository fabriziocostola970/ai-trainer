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
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com", "https://cdnjs.cloudflare.com", "https://cdn.tailwindcss.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "https://cdn.tailwindcss.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "https://images.pexels.com"],
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

// 📸 Serve locally stored images
app.use('/images', express.static(path.join(__dirname, 'uploads', 'images'), {
  maxAge: '7d', // Cache immagini per 7 giorni
  etag: true,
  lastModified: true,
  setHeaders: (res, path, stat) => {
    // Headers per le immagini
    res.set({
      'Cache-Control': 'public, max-age=604800', // 7 giorni
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range'
    });
  }
}));

// 📊 Endpoint per statistiche immagini AVANZATE
app.get('/api/images/stats', async (req, res) => {
  try {
    const unifiedImageService = require('./src/services/unified-image-service');
    const stats = await unifiedImageService.getStorageStats();
    
    res.json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString(),
      summary: {
        totalImages: stats.database?.general?.total_images || 0,
        activeImages: stats.database?.general?.active_images || 0,
        linkedImages: stats.database?.linkage?.linked_images || 0,
        orphanImages: stats.database?.linkage?.orphan_images || 0,
        totalSizeMB: stats.database?.general?.total_size_mb || 0,
        physicalFiles: stats.physical?.totalFiles || 0,
        syncStatus: stats.sync?.dbVsPhysical?.difference === 0 ? 'in_sync' : 'out_of_sync'
      }
    });
  } catch (error) {
    console.error('❌ Errore statistiche immagini:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🔍 Endpoint per ricerca immagini
app.get('/api/images/search', async (req, res) => {
  try {
    const { 
      businessType, 
      businessName, 
      category, 
      linkedOnly, 
      orphanOnly, 
      limit = 50 
    } = req.query;

    const imageDownloadService = require('./src/services/image-download-service');
    const results = await imageDownloadService.searchImages({
      businessType,
      businessName,
      category,
      linkedOnly: linkedOnly === 'true',
      orphanOnly: orphanOnly === 'true',
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      results: results,
      count: results.length,
      query: req.query,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Errore ricerca immagini:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🧹 Endpoint per pulizia cache immagini SMART
app.delete('/api/images/cleanup', async (req, res) => {
  try {
    const imageDownloadService = require('./src/services/image-download-service');
    const maxAgeHours = req.query.maxAge || 24;
    
    const result = await imageDownloadService.smartCleanupOrphanImages(maxAgeHours);
    
    res.json({
      success: true,
      message: `Smart cleanup completed: ${result.deleted} deleted, ${result.errors} errors`,
      details: result,
      maxAgeHours: maxAgeHours,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Errore pulizia immagini:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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

// � NAVBAR UPDATE ENDPOINT - Chiamato da VendiOnline-EU quando si aggiorna una pagina
app.post('/update-navbar', async (req, res) => {
  try {
    const { websiteId, businessName } = req.body;
    
    console.log(`🔄 [NAVBAR-UPDATE-API] Received request for websiteId: ${websiteId}, business: ${businessName}`);
    
    if (!websiteId || !businessName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: websiteId, businessName'
      });
    }

    // Import and call navbar update function
    const { updateAllPagesNavbar } = require('./src/api/claude-page-generator.js');
    
    await updateAllPagesNavbar(websiteId, businessName, pool);
    
    console.log(`✅ [NAVBAR-UPDATE-API] Successfully updated navbar for website: ${websiteId}`);
    
    res.json({
      success: true,
      message: 'Navbar updated successfully',
      websiteId: websiteId,
      businessName: businessName,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [NAVBAR-UPDATE-API] Error updating navbar:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// �🔍 SEO FUNCTIONS - Sistema routing dinamico con SEO
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * 🔍 TROVA PAGINA PER SLUG
 */
async function findPageBySlug(slug) {
  try {
    const query = `
      SELECT p.*, w."businessName" 
      FROM website_pages p 
      JOIN websites w ON p."websiteId" = w.id 
      WHERE p.slug = $1 AND p."isActive" = true
      LIMIT 1
    `;
    
    const result = await pool.query(query, [slug.startsWith('/') ? slug : `/${slug}`]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ [SEO] Errore ricerca pagina:', error);
    return null;
  }
}

/**
 * 🔍 TROVA HOMEPAGE
 */
async function findHomepage(websiteId) {
  try {
    const query = `
      SELECT p.*, w."businessName" 
      FROM website_pages p 
      JOIN websites w ON p."websiteId" = w.id 
      WHERE p."isHomepage" = true AND p."isActive" = true
      ${websiteId ? 'AND p."websiteId" = $1' : ''}
      LIMIT 1
    `;
    
    const params = websiteId ? [websiteId] : [];
    const result = await pool.query(query, params);
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ [SEO] Errore ricerca homepage:', error);
    return null;
  }
}

/**
 * 🎯 INJECTION SEO METADATA
 */
function injectSeoMetadata(page) {
  let html = page.content;
  
  // ✅ Title dinamico con fallback
  const pageTitle = page.seoTitle || page.name;
  const businessName = page.businessName || 'Sito Web';
  const fullTitle = page.isHomepage ? `${businessName}` : `${pageTitle} - ${businessName}`;
  
  html = html.replace(
    /<title>.*?<\/title>/i, 
    `<title>${fullTitle}</title>`
  );
  
  // ✅ Meta description con fallback
  const description = page.seoDescription || `Scopri ${page.name} di ${businessName}. Qualità e professionalità al vostro servizio.`;
  
  // ✅ SEO Meta Tags completi
  const seoMetaTags = `
    <meta name="description" content="${description}">
    <meta name="keywords" content="${page.name}, ${businessName}, ${page.pageType}">
    <meta name="author" content="${businessName}">
    <meta name="robots" content="index, follow">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="${fullTitle}">
    <meta property="og:description" content="${description}">
    <meta property="og:site_name" content="${businessName}">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${fullTitle}">
    <meta name="twitter:description" content="${description}">
    
    <!-- Schema.org for Google -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "${pageTitle}",
      "description": "${description}",
      "publisher": {
        "@type": "Organization",
        "name": "${businessName}"
      }
    }
    </script>
  `;
  
  // Inserisci meta tag prima di </head>
  html = html.replace('</head>', `${seoMetaTags}\n</head>`);
  
  return html;
}

// 🎨 CLAUDE WEBSITE GENERATOR ROUTES
const claudeRouter = require('./src/api/claude-website-generator');
app.use('/api/claude', claudeRouter);

// 🎨 CLAUDE HTML GENERATOR ROUTES (Navbar Dinamica + HTML Generation)
const claudeHtmlRouter = require('./src/api/claude-html-generator');
app.use('/api/claude', claudeHtmlRouter);

// 🎨 CLAUDE PAGE GENERATOR ROUTES (Multi-Page System with Style DNA)
const claudePageRouter = require('./src/api/claude-page-generator');
app.use('/api/claude', claudePageRouter);

// �🌐 PREVIEW ROUTES (Static HTML Sites)
const previewRouter = require('./src/api/preview');
app.use('/api/preview', previewRouter);

// 🎯 SEO ROUTES - Sistema routing dinamico per pagine dal database
app.get('/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    
    console.log(`🔍 [SEO-ROUTE] Ricerca pagina per slug: ${slug}`);
    
    // Cerca pagina nel database
    const page = await findPageBySlug(slug);
    
    if (!page) {
      console.log(`❌ [SEO-ROUTE] Pagina non trovata: ${slug}`);
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Pagina non trovata</title></head>
        <body>
          <h1>404 - Pagina non trovata</h1>
          <p>La pagina "${slug}" non esiste.</p>
          <a href="/">Torna alla homepage</a>
        </body>
        </html>
      `);
    }
    
    console.log(`✅ [SEO-ROUTE] Pagina trovata: ${page.name} (${page.pageType})`);
    
    // Inietta metadata SEO
    const seoHtml = injectSeoMetadata(page);
    
    res.send(seoHtml);
    
  } catch (error) {
    console.error('❌ [SEO-ROUTE] Errore:', error);
    res.status(500).send('Errore interno del server');
  }
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
