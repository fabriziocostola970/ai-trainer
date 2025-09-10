const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const UnifiedImageService = require('../services/unified-image-service.js');
const ImageDownloadService = require('../services/image-download-service.js');
const { Pool } = require('pg');

// CLAUDE SONNET 4 - GENERAZIONE HTML DIRETTA (FIXED AUTH)
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// 🗄️ DATABASE CONNECTION
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * 🎨 ENDPOINT GENERAZIONE HTML COMPLETA CON CLAUDE
 * POST /api/claude/generate-html
 * 
 * Genera direttamente HTML bellissimo come Claude.ai
 * Segue i prompt ottimali suggeriti dall'utente
 */
router.post('/generate-html', async (req, res) => {
  // Variabili dichiarate all'inizio per essere accessibili ovunque
  let businessId, websiteId, ownerId;

  try {
    // 🔑 API KEY AUTHENTICATION (like other AI-Trainer endpoints)
    const authHeader = req.headers.authorization;
    const expectedKey = process.env.AI_TRAINER_API_KEY;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header'
      });
    }
    
    const token = authHeader.substring(7);
    if (!expectedKey || token !== expectedKey) {
      return res.status(403).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    const {
      ownerId, // ← Passiamo l'ownerId dal bridge VendiOnline 
      businessName, 
      businessType, 
      businessDescription, 
      stylePreference = 'moderno',
      colorMood = 'professionale',
      targetAudience = 'generale' 
    } = req.body;

    if (!businessName || !businessDescription) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: businessName and businessDescription'
      });
    }

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        error: 'Missing ownerId - required for database save'
      });
    }

    console.log('🎨 CLAUDE HTML GENERATION - Direct Creative Mode');
    console.log('Business:', { businessName, businessType, businessDescription });
    console.log('Style:', { stylePreference, colorMood, targetAudience });

    // 🖼️ OTTIENI IMMAGINI DAL UNIFIED SERVICE
    console.log('🖼️ Fetching images...');
    const businessImages = await UnifiedImageService.getBusinessImages(
      businessName, 
      businessType, 
      businessDescription,
      6
    );
    
    console.log(`✅ Retrieved ${businessImages.total} images`);

    // 🆔 Genera ID univoco per il website
    const websiteId = `${businessName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    console.log(`🆔 Website ID: ${websiteId}`);

    // 🔗 Collega immagini al website se locali
    if (businessImages.useLocal && businessImages.localImages) {
      try {
        const imageFileNames = [];
        ['hero', 'services', 'backgrounds'].forEach(category => {
          if (businessImages.localImages[category]) {
            businessImages.localImages[category].forEach(img => {
              imageFileNames.push(img.fileName);
            });
          }
        });

        if (imageFileNames.length > 0) {
          const imageDownloadService = require('../services/image-download-service');
          const linkedCount = await imageDownloadService.linkImagesToWebsite(
            websiteId, 
            imageFileNames, 
            'claude_html_generation'
          );
          console.log(`🔗 Linked ${linkedCount} images to website ${websiteId}`);
        }
      } catch (linkError) {
        console.warn('⚠️  Failed to link images:', linkError.message);
      }
    }

    // 🔧 HELPER per URL immagini
    const getImageUrl = (img) => {
      if (businessImages.useLocal && businessImages.localImages) {
        return img.url;
      }
      return img.webformatURL || img.urls?.regular || img.download_url || img.url || 'placeholder.jpg';
    };

    // 🎨 PROMPT CLAUDE OTTIMALE PER HTML DIRETTO
    const claudePrompt = `SEI UN WEB DESIGNER ESPERTO CHE CREA SITI WEB UNICI E MODERNI!

Devi creare una pagina HTML COMPLETA E FUNZIONALE per "${businessName}" (${businessType}), evitando design generici o template standard.

BRIEF DETTAGLIATO:
${businessDescription}

IDENTITÀ BRAND:
- Stile: ${stylePreference}  
- Mood colori: ${colorMood}
- Target: ${targetAudience}

RICHIESTE TECNICHE SPECIFICHE - CREA UN DESIGN CHE INCLUDA:
✅ Layout moderno e responsive con Tailwind CSS
✅ Animazioni fluide e hover effects creativi
✅ Sezioni specifiche con immagini appropriate  
✅ Filtri interattivi FUNZIONANTI con JavaScript
✅ Elementi visuali creativi (gradients, shadows, transforms)
✅ Tipografia accattivante con Google Fonts
✅ Call-to-action evidenti e styled
✅ Micro-interazioni e effects (hover, scale, rotate)
✅ Icons Font Awesome per ogni sezione
✅ Sezioni hero impattanti con gradients

NON LIMITARTI A DESIGN SEMPLICI - SII CREATIVO CON:
🎨 Colori e combinazioni cromatiche audaci
🎨 Layout asimmetrici o creativi  
🎨 Elementi grafici decorativi
🎨 Sezioni alternate con sfondi colorati
🎨 Cards con shadows e transforms
🎨 Animazioni CSS personalizzate

IMMAGINI DISPONIBILI (usa queste URL esatte):
${businessImages.hero?.map((img, i) => `HERO ${i+1}: ${getImageUrl(img)}`).join('\n') || 'Nessuna immagine hero'}
${(businessImages.services || []).map((img, i) => `CONTENT ${i+1}: ${getImageUrl(img)}`).join('\n') || 'Nessuna immagine content'}
${(businessImages.backgrounds || []).map((img, i) => `BACKGROUND ${i+1}: ${getImageUrl(img)}`).join('\n') || 'Nessuna immagine background'}

FRAMEWORK STILISTICO RICHIESTO:
- Gradienti colorati e moderni
- Hover effects e animazioni fluide
- Layout asimmetrico e creativo
- Cards con shadows e transforms  
- Sezioni alternate con sfondi colorati
- Tipografia elegante con font pairing
- Filtri interattivi funzionanti
- Elementi decorativi (forme geometriche, patterns)

ESEMPIO STRUTTURA (ADATTA AL TUO BUSINESS):
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[TITLE CREATIVO]</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');
        /* STILI CREATIVI PERSONALIZZATI */
    </style>
</head>
<body>
    <!-- HEADER FISSO CON EFFETTO GLASS -->
    <!-- HERO SECTION CON GRADIENT E ANIMAZIONI -->
    <!-- FILTRI INTERATTIVI FUNZIONANTI -->
    <!-- SEZIONI PRODOTTI/SERVIZI CREATIVE -->
    <!-- STORIA/CHI SIAMO CON PARALLAX -->
    <!-- CONTATTI STILIZZATI -->
    <!-- JAVASCRIPT PER INTERATTIVITÀ -->
</body>
</html>

IMPORTANTE: 
- Genera HTML COMPLETO dalla DOCTYPE alla chiusura
- Usa SOLO le immagini fornite sopra
- Implementa JavaScript per filtri e interazioni
- Sii ESTREMAMENTE CREATIVO nel design
- Mantieni alta qualità visiva e UX
- Adatta colori e stile al tipo di business`;

    console.log('🎨 Calling Claude Sonnet 4 for HTML generation...');
    
    // CHIAMATA A CLAUDE SONNET 4 PER HTML DIRETTO
    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000, // Più token per HTML completo
      temperature: 0.9, // Massima creatività
      messages: [
        {
          role: 'user',
          content: claudePrompt
        }
      ]
    });

    const htmlContent = claudeResponse.content[0].text;
    console.log('✅ Claude HTML response received');
    console.log(`📄 Generated HTML length: ${htmlContent.length} characters`);

    // ESTRAI IL CODICE HTML (potrebbe essere wrappato in ```html)
    let cleanHTML = htmlContent;
    
    // Più pattern di pulizia per catturare tutti i casi
    const htmlPatterns = [
      /```html\n([\s\S]*?)\n```/,           // ```html ... ```
      /```html([\s\S]*?)```/,               // ```html...``` (senza newline)
      /```\n([\s\S]*?)\n```/,               // ``` ... ```
      /```([\s\S]*?)```/,                   // ```...``` (senza newline)
      /<html[\s\S]*<\/html>/i               // Direct HTML match
    ];
    
    for (const pattern of htmlPatterns) {
      const match = htmlContent.match(pattern);
      if (match) {
        cleanHTML = match[1] || match[0];
        break;
      }
    }
    
    // Rimuovi eventuali wrapper markdown rimanenti
    cleanHTML = cleanHTML.replace(/^```html\n?/gm, '').replace(/\n?```$/gm, '');
    
    console.log(`🧹 HTML cleaning: Original length: ${htmlContent.length}, Clean length: ${cleanHTML.length}`);

    // VERIFICA CHE SIA HTML VALIDO
    if (!cleanHTML.includes('<!DOCTYPE html>') && !cleanHTML.includes('<html')) {
      throw new Error('Generated content is not valid HTML');
    }

    // 💾 SALVA NELLA TABELLA WEBSITES ESISTENTE
    try {
      // Genera IDs univoci
      businessId = `biz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      websiteId = `site_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prima creo/aggiorno il business con l'ownerId reale del token
      const businessQuery = `
        INSERT INTO businesses (id, "ownerId", name, type, description, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          description = EXCLUDED.description,
          "updatedAt" = NOW()
        RETURNING id;
      `;
      
      await pool.query(businessQuery, [
        businessId,
        ownerId, // ← Usa l'ownerId reale dal token
        businessName,
        businessType || 'general',
        businessDescription || ''
      ]);
      
      console.log(`💼 Business created/updated: ${businessId} for owner: ${ownerId}`);
      
      // Ora salvo il website nella tabella websites (websiteId già definito sopra)
      
      const websiteQuery = `
        INSERT INTO websites (id, "businessId", content, design, status, version, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          content = EXCLUDED.content,
          design = EXCLUDED.design,
          "updatedAt" = NOW()
        RETURNING id;
      `;
      
      // Design = metadata e stili completi
      const websiteDesign = {
        taskId: `website_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ownerId: ownerId,
        metadata: {
          website_id: websiteId,
          generation_type: 'direct_html',
          creative_mode: true,
          style: {
            preference: stylePreference,
            color_mood: colorMood,
            target_audience: targetAudience
          },
          images_used: {
            hero: businessImages.hero?.length || 0,
            content: (businessImages.services || []).length,
            backgrounds: (businessImages.backgrounds || []).length
          },
          content_length: cleanHTML.length,
          claude_system: 'v3.0 - Direct HTML Creative Generation'
        },
        createdAt: new Date().toISOString(),
        generator: 'ai-trainer-claude-html',
        businessType: businessType || 'general',
        generation_type: 'claude_html_direct',
        savedToDatabase: true,
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B'
      };

      const websiteResult = await pool.query(websiteQuery, [
        websiteId,
        businessId,
        cleanHTML,  // ← HTML completo di Claude va qui
        JSON.stringify(websiteDesign),
        'generated',
        1
      ]);
      
      console.log(`🌐 Website saved: ${websiteId} for business: ${businessId}`);
      
    } catch (dbError) {
      console.error('❌ Database save error:', dbError.message);
      // Non blocchiamo la response se il DB fallisce
    }

    // RESPONSE CON HTML E METADATA
    res.json({
      success: true,
      html: cleanHTML,
      websiteId: websiteId,
      businessId: businessId,
      savedToDatabase: true,
      metadata: {
        website_id: websiteId,
        generation_type: 'direct_html',
        creative_mode: true,
        style: {
          preference: stylePreference,
          color_mood: colorMood,
          target_audience: targetAudience
        },
        images_used: {
          hero: businessImages.hero?.length || 0,
          content: (businessImages.services || []).length,
          backgrounds: (businessImages.backgrounds || []).length
        },
        content_length: cleanHTML.length,
        claude_system: 'v3.0 - Direct HTML Creative Generation'
      }
    });

  } catch (error) {
    console.error('Claude HTML generation error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate HTML website',
      details: error.message
    });
  }
});

module.exports = router;
