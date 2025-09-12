const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

// CLAUDE SONNET 4 - GENERAZIONE PAGINE SECONDARIE CON STYLE DNA
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

/**
 * 🎨 ENDPOINT GENERAZIONE PAGINE SECONDARIE CON STYLE DNA
 * POST /api/claude/generate-page
 * 
 * Genera pagine specifiche (Chi Siamo, Servizi, Contatti) mantenendo coerenza con Style DNA
 */
router.post('/generate-page', async (req, res) => {
  try {
    // 🔑 API KEY AUTHENTICATION
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
      ownerId,
      businessName, 
      businessType, 
      businessDescription, 
      pageType,
      styleDNA,
      stylePreference = 'moderno',
      colorMood = 'professionale',
      targetAudience = 'generale' 
    } = req.body;

    if (!businessName || !pageType || !styleDNA) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: businessName, pageType, styleDNA'
      });
    }

    console.log('🎨 CLAUDE PAGE GENERATION - Multi-Page System');
    console.log('Business:', { businessName, businessType, pageType });
    console.log('Style DNA:', { 
      colors: styleDNA.colors?.brandColors?.length || 0,
      fonts: Object.keys(styleDNA.typography?.fonts || {}).length,
      extractionScore: styleDNA.extractionScore 
    });

    // 🎯 PROMPT SPECIFICO PER TIPO DI PAGINA
    const pagePrompts = {
      about: `Crea una bellissima pagina "CHI SIAMO" per ${businessName}.

OBIETTIVO: Pagina About aziendale professionale e coinvolgente.

CONTENUTO DA INCLUDERE:
- Storia dell'azienda e valori
- Mission e vision
- Esperienza e competenze
- Team (se appropriato)
- Punti di forza distintivi

STILE DA MANTENERE (Style DNA):
- Colori primari: ${styleDNA.colors?.primary}, ${styleDNA.colors?.secondary}
- Colori brand: ${styleDNA.colors?.brandColors?.slice(0, 4).join(', ') || 'Moderni'}
- Font principale: ${styleDNA.typography?.primaryFont || 'Inter'}
- Font secondario: ${styleDNA.typography?.secondaryFont || 'Playfair Display'}

DESIGN REQUIREMENTS:
- Layout responsive con Tailwind CSS
- Sezioni con sfondi alternati
- Cards eleganti per i contenuti
- Animazioni fluide hover
- Gradients coerenti con i colori brand
- Elementi decorativi geometrici`,

      services: `Crea una bellissima pagina "SERVIZI" per ${businessName}.

OBIETTIVO: Showcase professionale dei servizi offerti.

CONTENUTO DA INCLUDERE:
- Lista servizi principali
- Descrizioni dettagliate
- Prezzi (se appropriato)
- Vantaggi e benefici
- Call-to-action per contatti

STILE DA MANTENERE (Style DNA):
- Colori primari: ${styleDNA.colors?.primary}, ${styleDNA.colors?.secondary}
- Colori brand: ${styleDNA.colors?.brandColors?.slice(0, 4).join(', ') || 'Moderni'}
- Font principale: ${styleDNA.typography?.primaryFont || 'Inter'}
- Font secondario: ${styleDNA.typography?.secondaryFont || 'Playfair Display'}

DESIGN REQUIREMENTS:
- Grid di servizi responsive
- Cards interattive con hover effects
- Icons Font Awesome per ogni servizio
- Sezioni con sfondi colorati alternati
- Buttons styled coerenti`,

      contact: `Crea una bellissima pagina "CONTATTI" per ${businessName}.

OBIETTIVO: Facilitare il contatto con l'azienda.

CONTENUTO DA INCLUDERE:
- Form contatti funzionale
- Informazioni di contatto (telefono, email, indirizzo)
- Mappa (placeholder)
- Orari di apertura
- Link social (se appropriato)

STILE DA MANTENERE (Style DNA):
- Colori primari: ${styleDNA.colors?.primary}, ${styleDNA.colors?.secondary}
- Colori brand: ${styleDNA.colors?.brandColors?.slice(0, 4).join(', ') || 'Moderni'}
- Font principale: ${styleDNA.typography?.primaryFont || 'Inter'}
- Font secondario: ${styleDNA.typography?.secondaryFont || 'Playfair Display'}

DESIGN REQUIREMENTS:
- Form elegante e accessibile
- Layout a due colonne (form + info)
- Cards per informazioni di contatto
- Animazioni micro-interaction
- Validation JavaScript`,

      portfolio: `Crea una bellissima pagina "PORTFOLIO" per ${businessName}.

OBIETTIVO: Showcase dei lavori e progetti realizzati.

CONTENUTO DA INCLUDERE:
- Galleria progetti
- Descrizioni lavori
- Testimonianze clienti
- Risultati ottenuti
- Case studies

STILE DA MANTENERE (Style DNA):
- Colori primari: ${styleDNA.colors?.primary}, ${styleDNA.colors?.secondary}
- Colori brand: ${styleDNA.colors?.brandColors?.slice(0, 4).join(', ') || 'Moderni'}
- Font principale: ${styleDNA.typography?.primaryFont || 'Inter'}
- Font secondario: ${styleDNA.typography?.secondaryFont || 'Playfair Display'}

DESIGN REQUIREMENTS:
- Grid gallery responsive
- Lightbox per immagini
- Filtri per categorie
- Hover effects creativi
- Cards progetti eleganti`,

      blog: `Crea una bellissima pagina "BLOG" per ${businessName}.

OBIETTIVO: Sezione news, articoli e aggiornamenti.

CONTENUTO DA INCLUDERE:
- Lista articoli recenti
- Preview contenuti
- Categorie e tags
- Search functionality
- Sidebar con widget

STILE DA MANTENERE (Style DNA):
- Colori primari: ${styleDNA.colors?.primary}, ${styleDNA.colors?.secondary}
- Colori brand: ${styleDNA.colors?.brandColors?.slice(0, 4).join(', ') || 'Moderni'}
- Font principale: ${styleDNA.typography?.primaryFont || 'Inter'}
- Font secondario: ${styleDNA.typography?.secondaryFont || 'Playfair Display'}

DESIGN REQUIREMENTS:
- Layout blog moderno
- Cards articoli responsive
- Typography ottimizzata per lettura
- Sidebar sticky
- Paginazione elegante`,

      testimonials: `Crea una bellissima pagina "RECENSIONI" per ${businessName}.

OBIETTIVO: Showcase testimonianze e feedback clienti.

CONTENUTO DA INCLUDERE:
- Testimonianze clienti
- Rating e stelle
- Foto clienti (placeholder)
- Stories di successo
- Form per nuove recensioni

STILE DA MANTENERE (Style DNA):
- Colori primari: ${styleDNA.colors?.primary}, ${styleDNA.colors?.secondary}
- Colori brand: ${styleDNA.colors?.brandColors?.slice(0, 4).join(', ') || 'Moderni'}
- Font principale: ${styleDNA.typography?.primaryFont || 'Inter'}
- Font secondario: ${styleDNA.typography?.secondaryFont || 'Playfair Display'}

DESIGN REQUIREMENTS:
- Cards testimonials eleganti
- Rating stars interattive
- Layout masonry o grid
- Carousel per highlights
- Social proof elements`
    };

    const selectedPrompt = pagePrompts[pageType];
    if (!selectedPrompt) {
      return res.status(400).json({
        success: false,
        error: `Unsupported page type: ${pageType}. Supported: ${Object.keys(pagePrompts).join(', ')}`
      });
    }

    const fullPrompt = `${selectedPrompt}

FRAMEWORK TECNICO:
- HTML5 semantico e accessibile
- Tailwind CSS per styling
- Font Awesome per icons
- Google Fonts per typography
- JavaScript per interattività

STRUTTURA HTML RICHIESTA:
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageType.charAt(0).toUpperCase() + pageType.slice(1)} - ${businessName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&display=swap');
        /* Custom styles con i colori Style DNA */
    </style>
</head>
<body>
    <!-- NAVBAR COERENTE CON STYLE DNA -->
    <!-- CONTENUTO PRINCIPALE DELLA PAGINA -->
    <!-- FOOTER MINIMALE -->
    <!-- JAVASCRIPT PER INTERATTIVITÀ -->
</body>
</html>

IMPORTANTE:
- Genera HTML COMPLETO e funzionale
- Mantieni ASSOLUTA coerenza con Style DNA
- Usa SOLO i colori e font specificati
- Crea contenuto realistico e professionale
- Include micro-animazioni e hover effects
- Rendi tutto responsive e moderno`;

    console.log('🎨 Calling Claude Sonnet 4 for page generation...');
    
    // CHIAMATA A CLAUDE SONNET 4
    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.7, // Bilanciato per coerenza + creatività
      messages: [
        {
          role: 'user',
          content: fullPrompt
        }
      ]
    });

    const htmlContent = claudeResponse.content[0].text;
    console.log('✅ Claude page response received');
    console.log(`📄 Generated page HTML length: ${htmlContent.length} characters`);

    // ESTRAI IL CODICE HTML
    let cleanHTML = htmlContent;
    
    const htmlPatterns = [
      /```html\n([\s\S]*?)\n```/,
      /```html([\s\S]*?)```/,
      /```\n([\s\S]*?)\n```/,
      /```([\s\S]*?)```/,
      /<html[\s\S]*<\/html>/i
    ];
    
    for (const pattern of htmlPatterns) {
      const match = htmlContent.match(pattern);
      if (match) {
        cleanHTML = match[1] || match[0];
        break;
      }
    }

    // Pulizia finale
    cleanHTML = cleanHTML
      .replace(/^\s*```html\s*/gm, '')
      .replace(/^\s*```\s*/gm, '')
      .trim();

    console.log('🧹 HTML cleaning: Original length:', htmlContent.length, ', Clean length:', cleanHTML.length);

    // VERIFICA CHE SIA HTML VALIDO
    if (!cleanHTML.includes('<!DOCTYPE html>') && !cleanHTML.includes('<html')) {
      throw new Error('Generated content is not valid HTML');
    }

    // RESPONSE OTTIMIZZATA PER VENDIONLINE
    res.json({
      success: true,
      htmlContent: cleanHTML, // ← Campo che si aspetta VendiOnline
      pageType: pageType,
      styleDNA: styleDNA,
      metadata: {
        generated_at: new Date().toISOString(),
        page_type: pageType,
        business_name: businessName,
        content_length: cleanHTML.length,
        style_dna_score: styleDNA.extractionScore,
        colors_used: styleDNA.colors?.brandColors?.length || 0,
        fonts_used: Object.keys(styleDNA.typography?.fonts || {}).length,
        claude_model: 'claude-sonnet-4-20250514',
        temperature: 0.7
      }
    });

  } catch (error) {
    console.error('❌ Claude page generation error:', error);
    
    // 💰 SPECIFIC CLAUDE API ERROR HANDLING
    let errorMessage = error.message;
    let statusCode = 500;
    
    if (error.type === 'invalid_request_error') {
      if (error.error?.code === 'insufficient_quota') {
        errorMessage = 'Claude API credits exhausted. Please check billing.';
        statusCode = 402; // Payment Required
      } else if (error.error?.code === 'rate_limit_exceeded') {
        errorMessage = 'Claude API rate limit exceeded. Try again later.';
        statusCode = 429; // Too Many Requests
      }
    } else if (error.status === 401) {
      errorMessage = 'Claude API authentication failed. Check API key.';
      statusCode = 401;
    } else if (error.status === 403) {
      errorMessage = 'Claude API access forbidden. Check permissions.';
      statusCode = 403;
    }
    
    console.error(`💰 Claude API Error Details:
    - Type: ${error.type}
    - Status: ${error.status}
    - Code: ${error.error?.code}
    - Message: ${errorMessage}`);
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: 'Claude page generation failed',
      error_type: error.type,
      error_code: error.error?.code || 'unknown'
    });
  }
});

module.exports = router;
