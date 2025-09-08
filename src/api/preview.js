const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

/**
 * 🌐 SERVE SITI HTML GENERATI STATICAMENTE
 * Endpoint per visualizzare i siti web generati
 */

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

module.exports = router;
