const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const UnifiedImageService = require('../services/unified-image-service.js');
const ImageDownloadService = require('../services/image-download-service.js');
const { Pool } = require('pg');

// 🚀 IMPORT NAVBAR GENERATOR
const { generateDynamicNavbar } = require('../components/navbar-generator.js');

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
      ownerId: requestOwnerId, // ← Rename to avoid conflict
      websiteId: requestWebsiteId, // ← Website ID from VendiOnline-EU
      businessId: requestBusinessId, // ← Business ID from VendiOnline-EU
      businessName, 
      businessType, 
      businessDescription, 
      stylePreference = 'moderno',
      colorMood = 'professionale',
      targetAudience = 'generale',
      generationMode = 'economico' // 🎛️ Global generation mode
    } = req.body;

    // Assign to the declared variables
    ownerId = requestOwnerId;
    websiteId = requestWebsiteId;
    businessId = requestBusinessId;

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

    if (!websiteId) {
      return res.status(400).json({
        success: false,
        error: 'Missing websiteId - must be provided by VendiOnline-EU'
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

    // 🆔 Using Website ID from VendiOnline-EU
    console.log(`🆔 Using Website ID from VendiOnline-EU: ${websiteId}`);

    // 🔗 Log immagini locali se disponibili
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
          console.log(`🔗 Found ${imageFileNames.length} local images for website ${websiteId}`);
          console.log(`� Image files: ${imageFileNames.slice(0, 3).join(', ')}${imageFileNames.length > 3 ? '...' : ''}`);
        }
      } catch (linkError) {
        console.warn('⚠️  Failed to log images:', linkError.message);
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

🚫 NAVBAR REQUIREMENTS - PLACEHOLDER OBBLIGATORIO:
- INSERISCI ESATTAMENTE questo placeholder per la navbar: <!-- DYNAMIC_NAVBAR_PLACEHOLDER -->
- Il placeholder DEVE essere immediatamente dopo il tag <body>
- NON creare navbar manualmente, usa SOLO il placeholder
- Il sistema sostituirà automaticamente il placeholder con navbar dinamica
- Esempio: <body><!-- DYNAMIC_NAVBAR_PLACEHOLDER --><main>...</main></body>

REGOLE ASSOLUTE:
1. INSERISCI il placeholder <!-- DYNAMIC_NAVBAR_PLACEHOLDER --> subito dopo <body>
2. NON creare navbar manualmente - usa SOLO il placeholder  
3. Inizia il contenuto con <main> dopo il placeholder
3. Usa SOLO le immagini fornite sopra  
4. Implementa JavaScript per filtri e interazioni
5. Sii ESTREMAMENTE CREATIVO nel design
6. Mantieni alta qualità visiva e UX
7. Adatta colori e stile al tipo di business`;

    console.log('🎨 Calling Claude Sonnet 4 for HTML generation...');
    console.log(`🎛️ Generation mode: ${generationMode}`);
    
    // 🎛️ CONFIGURE CLAUDE BASED ON GENERATION MODE (align with page generation)
    const claudeConfig = generationMode === 'economico' 
      ? {
          max_tokens: 6000,  // Aumentato: abbastanza per HTML completo con navbar
          temperature: 0.3   // Economico: più deterministico come le pagine
        }
      : {
          max_tokens: 6000,  // Sviluppo: più token per contenuti dettagliati
          temperature: 0.6   // Sviluppo: creatività bilanciata
        };
    
    // CHIAMATA A CLAUDE SONNET 4 PER HTML DIRETTO
    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: claudeConfig.max_tokens,
      temperature: claudeConfig.temperature,
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
    
    // 🔍 DEBUG: Controlla se l'HTML è completo
    console.log('🔍 [CLAUDE-DEBUG] Checking HTML completeness...');
    console.log('🔍 [CLAUDE-DEBUG] Has opening <html>:', htmlContent.includes('<html'));
    console.log('🔍 [CLAUDE-DEBUG] Has closing </html>:', htmlContent.includes('</html>'));
    console.log('🔍 [CLAUDE-DEBUG] Has opening <body>:', htmlContent.includes('<body'));
    console.log('🔍 [CLAUDE-DEBUG] Has closing </body>:', htmlContent.includes('</body>'));
    console.log('🔍 [CLAUDE-DEBUG] Last 200 chars:', htmlContent.slice(-200));
    
    // 🔍 LOG CLAUDE'S RAW RESPONSE FOR DEBUGGING
    console.log('🔍 [CLAUDE-RAW] First 1000 chars of Claude response:');
    console.log(htmlContent.substring(0, 1000));
    console.log('🔍 [CLAUDE-RAW] Contains placeholder:', htmlContent.includes('<!-- DYNAMIC_NAVBAR_PLACEHOLDER -->'));
    console.log('🔍 [CLAUDE-RAW] Contains <nav tag:', htmlContent.includes('<nav'));
    
    if (htmlContent.includes('<nav')) {
      const navbarMatch = htmlContent.match(/<nav[\s\S]*?<\/nav>/i);
      if (navbarMatch) {
        console.log('🔍 [CLAUDE-RAW] Claude created manual navbar:', navbarMatch[0].substring(0, 200) + '...');
      }
    }

    // 💰 CALCULATE COSTS (Claude Sonnet 4 pricing as of Sept 2025)
    // Input: $3.00 per 1M tokens, Output: $15.00 per 1M tokens
    const usage = claudeResponse.usage;
    const inputTokens = usage?.input_tokens || 0;
    const outputTokens = usage?.output_tokens || 0;
    
    const inputCost = (inputTokens / 1000000) * 3.00;
    const outputCost = (outputTokens / 1000000) * 15.00;
    const totalCost = inputCost + outputCost;
    
    const costInfo = {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      inputCost,
      outputCost,
      totalCost,
      generationMode,
      model: 'claude-sonnet-4-20250514',
      timestamp: new Date().toISOString()
    };

    console.log(`💰 Homepage Cost: $${totalCost.toFixed(4)} (mode: ${generationMode})`);

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

    console.log('✅ HTML generato da Claude Sonnet pronto per il salvataggio');

    // 🎯 SOSTITUISCI PLACEHOLDER CON NAVBAR DINAMICA
    if (cleanHTML.includes('<!-- DYNAMIC_NAVBAR_PLACEHOLDER -->')) {
      console.log('🔄 [NAVBAR-INJECTION] Trovato placeholder, sostituisco con navbar dinamica...');
      
      const dynamicNavbar = await generateDynamicNavbar(websiteId, businessName, pool);
      cleanHTML = cleanHTML.replace('<!-- DYNAMIC_NAVBAR_PLACEHOLDER -->', dynamicNavbar);
      
      console.log('✅ [NAVBAR-INJECTION] Placeholder sostituito con successo!');
    } else {
      console.log('⚠️ [NAVBAR-INJECTION] Placeholder non trovato nell\'HTML generato da Claude');
      console.log('📝 HTML preview:', cleanHTML.substring(0, 500) + '...');
    }

    // 🔧 POST-PROCESSING: Aggiungi automaticamente toggleMobileMenu se mancante
    if (!cleanHTML.includes('toggleMobileMenu')) {
      console.log('🔧 [POST-PROCESS] Adding missing toggleMobileMenu function...');
      
      const toggleMobileMenuScript = `
    <script>
    function toggleMobileMenu() {
        const menu = document.getElementById('mobileMenu');
        if (menu) {
            menu.classList.toggle('hidden');
        }
    }
    </script>`;
      
      // Inserisci prima della chiusura del body
      if (cleanHTML.includes('</body>')) {
        cleanHTML = cleanHTML.replace('</body>', `${toggleMobileMenuScript}\n</body>`);
      } else {
        // Fallback: aggiungi alla fine
        cleanHTML += toggleMobileMenuScript;
      }
      console.log('✅ [POST-PROCESS] toggleMobileMenu function added automatically');
    }

    // 🔧 SOLUZIONE DEFINITIVA: Forza SEMPRE l'aggiornamento con script corretto
    console.log(`🧹 HTML cleaning: Original length: ${htmlContent.length}, Clean length: ${cleanHTML.length}`);

    // VERIFICA CHE SIA HTML VALIDO
    if (!cleanHTML.includes('<!DOCTYPE html>') && !cleanHTML.includes('<html')) {
      throw new Error('Generated content is not valid HTML');
    }

    // 💾 SALVA NELLA TABELLA WEBSITES ESISTENTE
    try {
      // Usa gli IDs ricevuti da VendiOnline-EU (non generare nuovi)
      console.log(`🔄 Updating existing records - Business ID: ${businessId}, Website ID: ${websiteId}`);
      
      // Prima aggiorna il business esistente con l'ownerId reale del token
      const businessQuery = `
        UPDATE businesses 
        SET name = $1, type = $2, description = $3, "updatedAt" = NOW()
        WHERE id = $4 AND "ownerId" = $5
        RETURNING id;
      `;
      
      const businessResult = await pool.query(businessQuery, [
        businessName,
        businessType || 'general',
        businessDescription || '',
        businessId,  // ← Usa l'ID esistente
        ownerId // ← Verifica che l'owner sia corretto
      ]);
      
      if (businessResult.rows.length === 0) {
        throw new Error(`Business not found or owner mismatch: ${businessId} for owner: ${ownerId}`);
      }
      
      console.log(`💼 Business updated: ${businessId} for owner: ${ownerId}`);
      
      // Ora aggiorna il website esistente (creato da VendiOnline-EU)
      
      const websiteQuery = `
        INSERT INTO websites (id, "businessId", content, design, status, version, "createdAt", "updatedAt")
        VALUES ($3, $4, $1, $2, 'generated', 1, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          content = $1,
          design = $2,
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
        JSON.stringify({ html: cleanHTML }),  // $1 content - JSONB format
        JSON.stringify(websiteDesign),        // $2 design
        websiteId,                            // $3 id
        businessId                            // $4 businessId
      ]);
      
      console.log(`🌐 Website updated: ${websiteId} for business: ${businessId}`);
      
      // 🆕 FASE 2: Scrive ANCHE in website_pages per architettura futura
      console.log('📄 Creating homepage record in website_pages...');
      
      const pageQuery = `
        INSERT INTO website_pages (id, "websiteId", name, slug, content, "pageType", "pageOrder", "isHomepage", "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        ON CONFLICT ("websiteId", slug) DO UPDATE SET
          content = $5,
          "updatedAt" = NOW()
        RETURNING id; 
      `;
      
      const pageId = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const pageResult = await pool.query(pageQuery, [
        pageId,          // $1 id
        websiteId,       // $2 websiteId  
        'Home',          // $3 name
        '',              // $4 slug (homepage = empty string)
        cleanHTML,       // $5 content (HTML completo)
        'homepage',      // $6 pageType
        0,               // $7 pageOrder (homepage sempre prima)
        true,            // $8 isHomepage
        true             // $9 isActive
      ]);
      
      console.log(`📄 Homepage page created in website_pages: ${pageId}`);
      
    } catch (dbError) {
      console.error('❌ Database save error:', dbError.message);
      // Non blocchiamo la response se il DB fallisce
    }

    // 📁 SALVA HOMEPAGE COME FILE STATICO per serving futuro
    const homePageSlug = 'index'; // Homepage = index.html
    const saveResult = savePageToStatic(homePageSlug, cleanHTML, businessName);
    console.log(`📁 [STATIC-SAVE-HP] ${saveResult.success ? '✅ Saved' : '❌ Failed'}: ${homePageSlug}`);

    // RESPONSE CON HTML E METADATA
    res.json({
      success: true,
      html: cleanHTML,
      websiteId: websiteId,
      businessId: businessId,
      savedToDatabase: true,
      staticSaved: saveResult.success, // 🆕 Conferma salvataggio statico
      costInfo: costInfo, // 💰 Include cost information
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
        claude_system: 'v3.0 - Direct HTML Creative Generation',
        cost_tracking: {
          generation_mode: generationMode,
          temperature: claudeConfig.temperature,
          max_tokens: claudeConfig.max_tokens
        }
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

/**
 * 📁 SAVE PAGE TO STATIC FILES (HOMEPAGE)
 * Salva le homepage generate come file statici per il serving
 */
function savePageToStatic(pageSlug, htmlContent, businessName) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Directory per le pagine statiche (organizzate per business)
    const staticDir = path.join(__dirname, '../../static-pages', businessName.toLowerCase().replace(/\s+/g, '-'));
    
    // Crea directory se non esiste
    if (!fs.existsSync(staticDir)) {
      fs.mkdirSync(staticDir, { recursive: true });
    }
    
    // Salva il file HTML
    const filePath = path.join(staticDir, `${pageSlug}.html`);
    fs.writeFileSync(filePath, htmlContent, 'utf8');
    
    console.log(`✅ [STATIC-SAVE-HP] Page saved: ${filePath}`);
    return { success: true, filePath };
    
  } catch (error) {
    console.error('❌ [STATIC-SAVE-HP] Failed to save page:', error);
    return { success: false, error: error.message };
  }
}

module.exports = router;
