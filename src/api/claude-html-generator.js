const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const UnifiedImageService = require('../services/unified-image-service.js');

// CLAUDE SONNET 4 - GENERAZIONE HTML DIRETTA
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

/**
 * 🎨 ENDPOINT GENERAZIONE HTML COMPLETA CON CLAUDE
 * POST /api/claude/generate-html
 * 
 * Genera direttamente HTML bellissimo come Claude.ai
 * Segue i prompt ottimali suggeriti dall'utente
 */
router.post('/generate-html', async (req, res) => {
  try {
    const { 
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

    console.log('🎨 CLAUDE HTML GENERATION - Direct Creative Mode');
    console.log('Business:', { businessName, businessType, businessDescription });
    console.log('Style:', { stylePreference, colorMood, targetAudience });

    // 🖼️ OTTIENI IMMAGINI DAL UNIFIED SERVICE
    console.log('🖼️ Fetching images...');
    const businessImages = await UnifiedImageService.downloadBusinessImages(
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
    const htmlMatch = htmlContent.match(/```html\n([\s\S]*?)\n```/) || 
                      htmlContent.match(/```\n([\s\S]*?)\n```/) ||
                      htmlContent.match(/<html[\s\S]*<\/html>/i);
    
    if (htmlMatch) {
      cleanHTML = htmlMatch[1] || htmlMatch[0];
    }

    // VERIFICA CHE SIA HTML VALIDO
    if (!cleanHTML.includes('<!DOCTYPE html>') && !cleanHTML.includes('<html')) {
      throw new Error('Generated content is not valid HTML');
    }

    // RESPONSE
    res.json({
      success: true,
      html: cleanHTML,
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
