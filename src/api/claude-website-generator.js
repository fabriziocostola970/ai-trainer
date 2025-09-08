const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const UnifiedImageService = require('../services/unified-image-service.js');
const RequirementValidator = require('../services/requirement-validator.js');
const { Pool } = require('pg');

// CLAUDE SONNET 4 - CREATIVE GENERATION + REQUIREMENT VALIDATION
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// 🗄️ DATABASE CONNECTION
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * ENDPOINT GENERAZIONE WEBSITE CON CLAUDE SONNET + REQUIREMENT VALIDATION
 * POST /api/claude/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { businessName, businessType, businessDescription, mode = 'creative' } = req.body;

    if (!businessName) {
      return res.status(400).json({
        success: false,
        error: 'Missing business name'
      });
    }

    console.log('🎨 CLAUDE CREATIVE GENERATION + VALIDATION');
    console.log('Business:', { businessName, businessType, businessDescription });

    // 🖼️ RECUPERO IMMAGINI BASATO SUL BUSINESS TYPE
    console.log('🖼️ Fetching relevant images...');
    
    // Immagini generiche per il business
    const businessImages = await UnifiedImageService.getBusinessImages(
      businessType || 'business', 
      businessName, 
      6
    );
    
    console.log(`✅ Retrieved ${businessImages.total} images`);

    // 🆔 Genera ID univoco per il website (per tracking immagini)
    const websiteId = `${businessName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    console.log(`🆔 Website ID: ${websiteId}`);

    // 🔗 Collega immagini al website se sono state scaricate localmente
    if (businessImages.useLocal && businessImages.localImages && businessImages.localImages.imageIds) {
      try {
        const imageFileNames = [];
        
        // Raccogli tutti i nomi file dalle immagini scaricate
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
            'claude_website_generation'
          );
          console.log(`🔗 Linked ${linkedCount} images to website ${websiteId}`);
        }
      } catch (linkError) {
        console.warn('⚠️  Failed to link images to website:', linkError.message);
      }
    }

    // 🔧 HELPER FUNCTION per ottenere URL immagini (locale o esterna)
    const getImageUrl = (img, fallbackKey = 'url') => {
      // Se abbiamo immagini locali, usa quelle
      if (businessImages.useLocal && businessImages.localImages) {
        return img.url || img[fallbackKey];
      }
      
      // Altrimenti usa URL esterne con fallback intelligente
      return img.webformatURL || 
             img.urls?.regular || 
             img.download_url || 
             img.url || 
             img[fallbackKey] || 
             'placeholder.jpg';
    };

    // 📊 LOG delle URL che verranno usate
    console.log('🔍 Available images for Claude:');
    if (businessImages.hero?.length > 0) {
      console.log('Hero images:', businessImages.hero.map(img => getImageUrl(img)));
    }

    // 🎨 PROMPT CLAUDE OTTIMALE PER HTML DIRETTO BELLISSIMO
    const claudePrompt = `SEI UN WEB DESIGNER ESPERTO CHE CREA SITI WEB UNICI E MODERNI!

Devi creare una pagina HTML COMPLETA E FUNZIONALE per "${businessName}" (${businessType}), evitando design generici o template standard.

BRIEF DETTAGLIATO:
${businessDescription}

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
- Ogni sezione deve avere il suo ID univoco e il titolo esatto richiesto
- Esempio: se chiede "Alberi da Frutta" + "Giardinaggio Casalingo" = 2 sezioni separate, non 1 sezione "Servizi"

REGOLE ASSOLUTE:
1. RISPETTA OGNI SINGOLA RICHIESTA della descrizione cliente
ESEMPIO STRUTTURA (ADATTA AL TUO BUSINESS):
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[BUSINESS NAME] | [TAGLINE CREATIVO]</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=[FONT_PAIRING]" rel="stylesheet">
    <style>
        /* STILI PERSONALIZZATI CREATIVI */
        .gradient-bg { background: linear-gradient(135deg, [COLORI APPROPRIATI]); }
        /* ANIMAZIONI, HOVER EFFECTS, CREATIVITÀ */
    </style>
</head>
<body>
    <!-- HERO SECTION IMPATTANTE -->
    <!-- SEZIONI SPECIFICHE RICHIESTE -->
    <!-- FILTRI INTERATTIVI SE RICHIESTI -->
    <!-- CONTATTI E FOOTER -->
    
    <script>
        /* JAVASCRIPT FUNZIONANTE PER FILTRI E INTERAZIONI */
    </script>
</body>
</html>

IMPORTANTE - OUTPUT:
- Genera SOLO codice HTML completo, niente altro
- Includi tutto in un singolo file HTML
- JavaScript funzionante incluso
- CSS personalizzato per creatività massima
- Usa le immagini fornite con URL esatte
- Design completamente responsive
- Stile moderno e professionale ma creativo

INIZIA SUBITO CON <!DOCTYPE html>:`;

    console.log('🎨 Calling Claude Sonnet 4 with CREATIVE freedom...');
    
    // CHIAMATA A CLAUDE SONNET 4 CON MASSIMA CREATIVITÀ
    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.9, // Alta creatività sempre
      messages: [
        {
          role: 'user',
          content: claudePrompt
        }
      ]
    });

    let htmlContent = claudeResponse.content[0].text;
    console.log('✅ Claude HTML response received');
    
    // PULIZIA HTML (rimuove eventuali wrapper di markdown)
    if (htmlContent.includes('```html')) {
      const htmlMatch = htmlContent.match(/```html\n([\s\S]*?)\n```/) || 
                       htmlContent.match(/```html([\s\S]*?)```/) ||
                       htmlContent.match(/<html[\s\S]*<\/html>/i);
      
      if (htmlMatch) {
        htmlContent = htmlMatch[1] || htmlMatch[0];
      }
    }
    
    // VERIFICA CHE SIA HTML VALIDO
    if (!htmlContent.includes('<!DOCTYPE html>') && !htmlContent.includes('<html')) {
      throw new Error('Generated content is not valid HTML');
    }
    
    console.log(`🏗️ HTML website generated (${Math.round(htmlContent.length / 1024)}KB)`);

    // 🔍 VALIDAZIONE POST-GENERAZIONE CON REQUIREMENT VALIDATOR
    console.log('🔍 Validating generated HTML against client requirements...');
    
    const validator = new RequirementValidator();
    const clientRequirements = validator.extractRequirements(businessDescription);
    const validationResult = validator.validateGeneratedHTML(
      htmlContent, 
      clientRequirements
    );

    console.log('📋 Client requirements found:', clientRequirements.sections?.length || 0);
    console.log('✅ Requirements satisfied:', validationResult.satisfied.length);
    console.log('❌ Requirements missing:', validationResult.missing.length);

    // ✅ VALIDAZIONE COMPLETATA (HTML generation is self-contained)
    if (validationResult.missing.length > 0) {
      console.log('⚠️  Some requirements might be missing, but HTML generation is complete');
      console.log('Missing items:', validationResult.missing.map(m => m.type).join(', '));
    } else {
      console.log('🎉 All requirements satisfied in generated HTML!');
    }

    // 💾 SALVA NEL DATABASE POSTGRESQL usando schema VendiOnline-EU
    try {
      // Prima crea il business se non esiste
      const businessId = websiteId; // Usa websiteId come businessId per semplicità
      
      const insertBusinessQuery = `
        INSERT INTO "businesses" ("id", "name", "type", "description", "stylePreference")
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT ("id") DO UPDATE SET
          "name" = EXCLUDED."name",
          "description" = EXCLUDED."description",
          "updatedAt" = CURRENT_TIMESTAMP;
      `;
      
      await pool.query(insertBusinessQuery, [
        businessId,
        businessName,
        businessType,
        businessDescription,
        stylePreference || 'moderno'
      ]);
      
      // Poi crea il website collegato al business
      const insertWebsiteQuery = `
        INSERT INTO "websites" ("id", "businessId", "content", "design", "status")
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT ("id") DO UPDATE SET
          "content" = EXCLUDED."content",
          "design" = EXCLUDED."design",
          "updatedAt" = CURRENT_TIMESTAMP
        RETURNING "id";
      `;
      
      const websiteContent = {
        html_content: htmlContent,
        business_info: {
          name: businessName,
          type: businessType,
          description: businessDescription
        },
        generation_metadata: {
          website_id: websiteId,
          creative_mode: true,
          requirements_validation: {
            total_requirements: clientRequirements.length,
            satisfied: validationResult.satisfied.length,
            missing_auto_completed: validationResult.missing.length
          },
          images_used: {
            hero: businessImages.hero?.length || 0,
            content: (businessImages.services || []).length,
            backgrounds: (businessImages.backgrounds || []).length
          },
          creative_system: 'v2.0 - Post-validation requirements'
        }
      };

      const designData = {
        style_preference: stylePreference || 'moderno',
        color_mood: colorMood || 'professionale',
        target_audience: targetAudience || 'generale',
        generation_time_ms: generationTime
      };

      const websiteValues = [
        websiteId + '_website', // ID univoco per il website
        businessId, // businessId collegato
        JSON.stringify(websiteContent), // content JSONB
        JSON.stringify(designData), // design JSONB
        'generated' // status
      ];

      const dbResult = await pool.query(insertWebsiteQuery, websiteValues);
      console.log(`💾 Website saved to database with ID: ${dbResult.rows[0].id}`);
      
    } catch (dbError) {
      console.error('❌ Database save error:', dbError.message);
      // Non blocchiamo la response se il DB fallisce
    }

    // RESPONSE CON HTML BELLISSIMO
    res.json({
      success: true,
      html: htmlContent,
      metadata: {
        website_id: websiteId,
        generation_type: 'direct_html',
        creative_mode: true,
        requirements_validation: {
          total_requirements: clientRequirements.length,
          satisfied: validationResult.satisfied.length,
          missing_auto_completed: validationResult.missing.length
        },
        images_used: {
          hero: businessImages.hero?.length || 0,
          content: (businessImages.services || []).length,
          backgrounds: (businessImages.backgrounds || []).length
        },
        content_length: htmlContent.length,
        creative_system: 'v3.0 - Direct HTML Creative Generation'
      }
    });

  } catch (error) {
    console.error('Claude generation error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate website',
      details: error.message
    });
  }
});

module.exports = router;
