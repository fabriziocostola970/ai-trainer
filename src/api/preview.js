const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 🗄️ DATABASE CONNECTION
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * 🌐 SERVE SITI HTML GENERATI STATICAMENTE  
 * Endpoint per visualizzare i siti web generati
 */

// Funzione per convertire JSON website del sistema principale in HTML
function convertWebsiteJsonToHTML(websiteJson) {
  try {
    console.log('🔧 Converting website JSON to HTML...');
    
    // Estrai le sezioni dal JSON
    const sections = websiteJson.sections || [];
    const businessName = websiteJson.businessName || 'Business';
    const businessType = websiteJson.businessType || 'general';
    
    // Genera HTML di base
    let html = `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${businessName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .card-shadow { box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    </style>
</head>
<body class="bg-gray-50">`;

    // Converti ogni sezione
    sections.forEach((section, index) => {
      const sectionId = section.type?.toLowerCase() || `section-${index}`;
      
      html += `
    <section id="${sectionId}" class="py-16 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
        <div class="max-w-6xl mx-auto px-4">
            <h2 class="text-3xl font-bold text-center mb-8 text-gray-800">
                ${section.title || section.type || 'Sezione'}
            </h2>`;
      
      if (section.content) {
        html += `<div class="text-lg text-gray-600 leading-relaxed">
                    ${Array.isArray(section.content) ? section.content.join('<br>') : section.content}
                 </div>`;
      }
      
      html += `
        </div>
    </section>`;
    });

    html += `
</body>
</html>`;

    return html;
    
  } catch (error) {
    console.error('Error converting JSON to HTML:', error);
    return `<html><body><h1>Error converting website</h1><p>${error.message}</p></body></html>`;
  }
}

// Funzione per estrarre HTML pulito dal JSON
function extractCleanHTML(jsonFilePath) {
  try {
    const rawContent = fs.readFileSync(jsonFilePath, 'utf8');
    const jsonData = JSON.parse(rawContent);
    
    let cleanHTML = jsonData.html;
    
    // Rimuovi i markdown code blocks se presenti
    if (cleanHTML.startsWith('```html\n')) {
      cleanHTML = cleanHTML.replace(/^```html\n/, '').replace(/\n```$/, '');
    }
    
    return cleanHTML;
  } catch (error) {
    console.error('Error extracting HTML:', error);
    return null;
  }
}

/**
 * 🌸 FIORERIA BALDUINA - Preview
 * GET /api/preview/fioreria
 */
router.get('/fioreria', (req, res) => {
  try {
    const cleanFilePath = path.join(__dirname, '../../fioreria-clean.html');
    const jsonFilePath = path.join(__dirname, '../../generated-fioreria.html');
    
    // Prima prova a leggere il file HTML pulito
    if (fs.existsSync(cleanFilePath)) {
      const cleanHTML = fs.readFileSync(cleanFilePath, 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(cleanHTML);
    }
    
    // Se non esiste, prova a estrarre dal JSON
    if (fs.existsSync(jsonFilePath)) {
      const cleanHTML = extractCleanHTML(jsonFilePath);
      if (cleanHTML) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(cleanHTML);
      }
    }
    
    // Se niente funziona, errore 404
    return res.status(404).send(`
      <html>
        <body>
          <h1>❌ Sito non trovato</h1>
          <p>La fioreria non è ancora stata generata.</p>
          <p>Genera il sito con il sistema Claude HTML.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Preview fioreria error:', error);
    res.status(500).send(`
      <html>
        <body>
          <h1>❌ Errore del server</h1>
          <p>Errore: ${error.message}</p>
        </body>
      </html>
    `);
  }
});

/**
 * 🚗 AUTOMOTOR PREMIUM - Preview  
 * GET /api/preview/automotive
 */
router.get('/automotive', (req, res) => {
  try {
    const jsonFilePath = path.join(__dirname, '../../generated-automotive.html');
    
    if (!fs.existsSync(jsonFilePath)) {
      return res.status(404).send(`
        <html>
          <body>
            <h1>❌ File non trovato</h1>
            <p>Il file generated-automotive.html non esiste.</p>
            <p>Genera prima il sito con il sistema Claude HTML.</p>
          </body>
        </html>
      `);
    }
    
    const cleanHTML = extractCleanHTML(jsonFilePath);
    
    if (!cleanHTML) {
      return res.status(500).send(`
        <html>
          <body>
            <h1>❌ Errore estrazione HTML</h1>
            <p>Impossibile estrarre HTML dal file JSON.</p>
          </body>
        </html>
      `);
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.send(cleanHTML);
    
  } catch (error) {
    console.error('Error serving automotive:', error);
    res.status(500).send(`
      <html>
        <body>
          <h1>❌ Errore del server</h1>
          <p>${error.message}</p>
        </body>
      </html>
    `);
  }
});

/**
 * 📋 LISTA SITI DISPONIBILI
 * GET /api/preview
 */
router.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🎨 Preview Siti Generati</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          max-width: 800px; 
          margin: 50px auto; 
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .card { 
          background: rgba(255,255,255,0.1); 
          padding: 30px; 
          margin: 20px 0; 
          border-radius: 15px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .btn { 
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 15px 30px; 
          text-decoration: none; 
          border-radius: 25px;
          margin: 10px;
          font-weight: bold;
          transition: transform 0.3s ease;
        }
        .btn:hover { 
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        }
        h1 { text-align: center; font-size: 2.5em; margin-bottom: 30px; }
        .description { opacity: 0.9; line-height: 1.6; }
      </style>
    </head>
    <body>
      <h1>🎨 Siti Web Generati con Claude</h1>
      
      <div class="card">
        <h2>🌸 Fioreria Balduina</h2>
        <p class="description">
          Design elegante e naturale per una fioreria familiare. 
          Colori verdi, animazioni fluide, sezioni per alberi da frutta, 
          giardinaggio, piante ornamentali e cerimonie.
        </p>
        <a href="/api/preview/fioreria" target="_blank" class="btn">
          🌸 Visualizza Fioreria
        </a>
      </div>
      
      <div class="card">
        <h2>🚗 AutoMotor Premium</h2>
        <p class="description">
          Design aggressivo e sportivo per concessionario auto. 
          Colori rossi automotive, filtri funzionanti per ricerca auto, 
          sezioni auto nuove/usate, finanziamenti e service.
        </p>
        <a href="/api/preview/automotive" target="_blank" class="btn">
          🚗 Visualizza Automotive
        </a>
      </div>
      
      <div class="card">
        <h2>🛠️ Informazioni Tecniche</h2>
        <p class="description">
          Entrambi i siti sono stati generati con Claude Sonnet 4 utilizzando 
          il nuovo sistema di generazione HTML diretta. Ogni sito è responsive, 
          moderno e completamente funzionale.
        </p>
        <a href="https://ai-trainer-production-8fd9.up.railway.app" class="btn">
          🔧 API AI-Trainer
        </a>
      </div>
    </body>
    </html>
  `);
});

/**
 * 🌐 PREVIEW UNIVERSALE: File + Database
 * GET /api/preview/site/:websiteId  
 * Cerca prima nei file locali, poi nel database
 */
router.get('/site/:websiteId', async (req, res) => {
  try {
    const { websiteId } = req.params;
    
    console.log(`🔍 Searching for website: ${websiteId}`);
    
    // Query dal database
    const query = 'SELECT * FROM generated_websites WHERE website_id = $1 ORDER BY created_at DESC LIMIT 1';
    const result = await pool.query(query, [websiteId]);
    
    if (result.rows.length === 0) {
      return res.status(404).send(`
        <html>
          <head>
            <title>Sito Non Trovato</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #e74c3c; }
              .info { color: #3498db; margin: 20px 0; }
            </style>
          </head>
          <body>
            <h1 class="error">❌ Sito Non Trovato</h1>
            <p>Il sito con ID "${websiteId}" non esiste nel database.</p>
            <div class="info">
              <p>🔧 <strong>Per generare un nuovo sito:</strong></p>
              <p>POST https://ai-trainer-production-8fd9.up.railway.app/api/claude/generate</p>
            </div>
            <a href="/api/preview/">← Torna alla lista</a>
          </body>
        </html>
      `);
    }
    
    const website = result.rows[0];
    console.log(`✅ Website found: ${website.business_name} (${website.business_type})`);
    console.log(`📏 HTML length: ${website.html_content.length} characters`);
    
    let htmlContent = website.html_content;
    
    // Se il contenuto è un JSON (dal sistema principale), estraiamo l'HTML
    try {
      const parsed = JSON.parse(htmlContent);
      if (parsed.html) {
        htmlContent = parsed.html;
        console.log('🔄 Converted JSON website to HTML');
      } else if (parsed.sections) {
        // Questo è il formato del sistema principale - generiamo HTML
        htmlContent = convertWebsiteJsonToHTML(parsed);
        console.log('🔄 Converted website sections to HTML');
      }
    } catch (e) {
      // Se non è JSON, assumiamo sia già HTML puro
      console.log('📄 Direct HTML content detected');
    }
    
    // Serve l'HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
    
  } catch (error) {
    console.error('Database preview error:', error);
    res.status(500).send(`
      <html>
        <body>
          <h1>❌ Errore Database</h1>
          <p>Errore nel recupero del sito: ${error.message}</p>
        </body>
      </html>
    `);
  }
});

/**
 * 📋 LISTA SITI GENERATI DAL DATABASE  
 * GET /api/preview/list
 */
router.get('/list', async (req, res) => {
  try {
    const query = `
      SELECT website_id, business_name, business_type, business_description, 
             content_length, images_count, created_at, generation_metadata
      FROM generated_websites 
      ORDER BY created_at DESC 
      LIMIT 20
    `;
    
    const result = await pool.query(query);
    
    const sites = result.rows.map(site => ({
      id: site.website_id,
      name: site.business_name,
      type: site.business_type,
      description: site.business_description?.substring(0, 100) + '...',
      size: `${Math.round(site.content_length / 1024)}KB`,
      images: site.images_count,
      created: new Date(site.created_at).toLocaleDateString('it-IT'),
      preview_url: `/api/preview/site/${site.website_id}`
    }));
    
    res.json({
      success: true,
      total: sites.length,
      sites: sites
    });
    
  } catch (error) {
    console.error('Database list error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 🚀 DYNAMIC PAGE SERVING SYSTEM
 * Serve homepage generata
 * GET /api/preview/:businessName
 */
router.get('/:businessName', (req, res) => {
  try {
    const { businessName } = req.params;
    console.log(`🏠 [HOMEPAGE-SERVE] Requesting homepage for: ${businessName}`);
    
    // Converti business name in formato file
    const businessDir = businessName.toLowerCase().replace(/\s+/g, '-');
    const homePagePath = path.join(__dirname, '../../static-pages', businessDir, 'index.html');
    
    console.log(`📁 [HOMEPAGE-SERVE] Looking for: ${homePagePath}`);
    
    // Verifica se il file esiste
    if (fs.existsSync(homePagePath)) {
      const htmlContent = fs.readFileSync(homePagePath, 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      console.log(`✅ [HOMEPAGE-SERVE] Served homepage for: ${businessName}`);
      return res.send(htmlContent);
    }
    
    // Se non esiste, prova a cercare in tutte le cartelle business
    const staticPagesDir = path.join(__dirname, '../../static-pages');
    if (fs.existsSync(staticPagesDir)) {
      const businessDirs = fs.readdirSync(staticPagesDir);
      
      for (const dir of businessDirs) {
        const altHomePath = path.join(staticPagesDir, dir, 'index.html');
        if (fs.existsSync(altHomePath)) {
          const htmlContent = fs.readFileSync(altHomePath, 'utf8');
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          console.log(`✅ [HOMEPAGE-SERVE] Found homepage in ${dir}`);
          return res.send(htmlContent);
        }
      }
    }
    
    // Homepage non trovata
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Homepage non trovata - ${businessName}</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-50 flex items-center justify-center min-h-screen">
        <div class="text-center max-w-md mx-auto p-6">
          <div class="text-6xl mb-4">🏠</div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Homepage non trovata</h1>
          <p class="text-gray-600 mb-4">La homepage per "${businessName}" non è ancora stata generata.</p>
          <div class="mt-6">
            <a href="/frontend" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
              ← Vai al Dashboard
            </a>
          </div>
        </div>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('❌ [HOMEPAGE-SERVE] Error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <body>
        <h1>❌ Errore del server</h1>
        <p>Errore: ${error.message}</p>
      </body>
      </html>
    `);
  }
});

/**
 * 🚀 DYNAMIC PAGE SERVING SYSTEM
 * Serve pagine secondarie generate (chi-siamo, servizi, contatti, etc.)
 * GET /api/preview/:businessName/:pageSlug
 */
router.get('/:businessName/:pageSlug', (req, res) => {
  try {
    const { businessName, pageSlug } = req.params;
    console.log(`🔍 [DYNAMIC-SERVE] Requesting: ${businessName}/${pageSlug}`);
    
    // Converti business name in formato file
    const businessDir = businessName.toLowerCase().replace(/\s+/g, '-');
    const pagePath = path.join(__dirname, '../../static-pages', businessDir, `${pageSlug}.html`);
    
    console.log(`📁 [DYNAMIC-SERVE] Looking for: ${pagePath}`);
    
    // Verifica se il file esiste
    if (fs.existsSync(pagePath)) {
      const htmlContent = fs.readFileSync(pagePath, 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      console.log(`✅ [DYNAMIC-SERVE] Served: ${businessName}/${pageSlug}`);
      return res.send(htmlContent);
    }
    
    // Se non esiste, prova a cercare in tutte le cartelle business
    const staticPagesDir = path.join(__dirname, '../../static-pages');
    if (fs.existsSync(staticPagesDir)) {
      const businessDirs = fs.readdirSync(staticPagesDir);
      
      for (const dir of businessDirs) {
        const altPagePath = path.join(staticPagesDir, dir, `${pageSlug}.html`);
        if (fs.existsSync(altPagePath)) {
          const htmlContent = fs.readFileSync(altPagePath, 'utf8');
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          console.log(`✅ [DYNAMIC-SERVE] Found in ${dir}: ${pageSlug}`);
          return res.send(htmlContent);
        }
      }
    }
    
    // Pagina non trovata
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pagina non trovata - ${businessName}</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-50 flex items-center justify-center min-h-screen">
        <div class="text-center max-w-md mx-auto p-6">
          <div class="text-6xl mb-4">🔍</div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Pagina non trovata</h1>
          <p class="text-gray-600 mb-4">La pagina "${pageSlug}" per "${businessName}" non è ancora stata generata.</p>
          <div class="space-y-2 text-sm text-gray-500">
            <p>Pagine disponibili di solito:</p>
            <div class="flex flex-wrap gap-2 justify-center">
              <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded">chi-siamo</span>
              <span class="bg-green-100 text-green-800 px-2 py-1 rounded">servizi</span>
              <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded">contatti</span>
            </div>
          </div>
          <div class="mt-6">
            <a href="/" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
              ← Torna alla Home
            </a>
          </div>
        </div>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('❌ [DYNAMIC-SERVE] Error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <body>
        <h1>❌ Errore del server</h1>
        <p>Errore: ${error.message}</p>
      </body>
      </html>
    `);
  }
});

module.exports = router;
