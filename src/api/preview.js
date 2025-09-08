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
    
    // Query dal database usando schema VendiOnline-EU
    const query = `
      SELECT w.*, b.name as business_name, b.type as business_type, b.description as business_description
      FROM "websites" w
      JOIN "businesses" b ON w."businessId" = b."id"
      WHERE b."id" = $1 OR w."id" LIKE $2
      ORDER BY w."createdAt" DESC 
      LIMIT 1
    `;
    const result = await pool.query(query, [websiteId, websiteId + '%']);
    
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
    
    // Estrai l'HTML dal content JSONB
    let htmlContent;
    try {
      const content = website.content; // PostgreSQL restituisce già parsed JSONB
      if (content && content.html_content) {
        htmlContent = content.html_content;
        console.log(`📏 HTML length: ${htmlContent.length} characters`);
      } else {
        throw new Error('No html_content found in website content');
      }
    } catch (error) {
      console.error('❌ Error extracting HTML from content:', error);
      return res.status(500).send('Error reading website content');
    }
    
    // Controlla se è già HTML puro
    if (htmlContent.trim().startsWith('<!DOCTYPE html>') || htmlContent.trim().startsWith('<html')) {
      // È già HTML puro - sistema nuovo
      console.log('📄 Direct HTML content detected (new system)');
    } else {
      // Prova a parsare come JSON - sistema vecchio
      try {
        const parsed = JSON.parse(htmlContent);
        if (parsed.html) {
          htmlContent = parsed.html;
          console.log('🔄 Converted JSON website to HTML (old system)');
        } else if (parsed.sections) {
          htmlContent = convertWebsiteJsonToHTML(parsed);
          console.log('🔄 Converted website sections to HTML (old system)');
        }
      } catch (e) {
        console.log('⚠️ Content is neither HTML nor valid JSON, serving as-is');
      }
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
      SELECT w."id", w."businessId", w."content", w."design", w."status", w."createdAt",
             b."name", b."type", b."description"
      FROM "websites" w
      JOIN "businesses" b ON w."businessId" = b."id"
      ORDER BY w."createdAt" DESC 
      LIMIT 20
    `;
    
    const result = await pool.query(query);
    
    const sites = result.rows.map(site => {
      const contentLength = JSON.stringify(site.content).length;
      const imagesCount = site.content?.generation_metadata?.images_used ? 
        Object.values(site.content.generation_metadata.images_used).reduce((a, b) => a + b, 0) : 0;
      
      return {
        id: site.businessId,
        name: site.name,
        type: site.type,
        description: site.description?.substring(0, 100) + '...',
        size: `${Math.round(contentLength / 1024)}KB`,
        images: imagesCount,
        created: new Date(site.createdAt).toLocaleDateString('it-IT'),
        preview_url: `/api/preview/site/${site.businessId}`
      };
    });
    
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

module.exports = router;
