const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const UnsplashService = require('../services/unsplash-service.js');

// 🚀 CLAUDE PURO - ZERO FALLBACK - SOLO CREATIVITÀ CLAUDE
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

/**
 * 🎨 ENDPOINT GENERAZIONE WEBSITE CON CLAUDE SONNET
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

    console.log('🎨 CLAUDE PURO AI-TRAINER - GENERAZIONE WEBSITE');
    console.log('📋 Business:', { businessName, businessType, businessDescription });
    
    // 🎭 MODALITÀ GENERAZIONE: creative | professional
    // 🤖 AUTO-DETECTION se mode non specificato
    let generationMode = mode.toLowerCase();
    
    if (mode === 'creative' && businessType) {
      // Business professionali = mode professional automatico
      const professionalTypes = ['consulenza', 'avvocato', 'medico', 'dentista', 'commercialista', 
                                'agenzia', 'studio', 'clinica', 'banca', 'assicurazione', 'contabilità'];
      
      if (professionalTypes.some(type => businessType.toLowerCase().includes(type))) {
        generationMode = 'professional';
        console.log('🤖 AUTO-DETECTED: Professional mode per business type');
      }
    }
    
    console.log('🎭 Mode:', generationMode.toUpperCase());

    // �️ RECUPERO IMMAGINI DA UNSPLASH
    console.log('🖼️ Fetching images from Unsplash...');
    const businessImages = await UnsplashService.getBusinessImages(
      businessType || 'business', 
      businessName, 
      6
    );
    console.log(`✅ Retrieved ${businessImages.total} images from Unsplash`);

    // 🎭 TEMPERATURA DINAMICA BASATA SU MODALITÀ
    const temperature = generationMode === 'professional' ? 0.3 : 0.9;

    // 🔥 PROMPT CLAUDE BASATO SU DESCRIZIONE UTENTE
    const claudePrompt = `SEI UN WEB DESIGNER ESPERTO CHE SEGUE SEMPRE LE SPECIFICHE DEL CLIENTE!

Crea un sito web PERFETTO per: ${businessName} (${businessType || 'business'})

🎯 DESCRIZIONE E RICHIESTE SPECIFICHE DEL CLIENTE:
${businessDescription || 'Business innovativo'}

� IMPORTANTISSIMO: SEGUI ESATTAMENTE LE RICHIESTE DELLA DESCRIZIONE SOPRA!
- Se il cliente chiede sezioni specifiche, creale esattamente come richiesto
- Se chiede funzionalità particolari (filtri, categorie, ecc.), includile nel design
- Se specifica stili o colori, rispettali
- Se richiede elementi specifici, non inventarne altri
- La creatività deve RISPETTARE sempre le specifiche del cliente

�🖼️ IMMAGINI DISPONIBILI PER IL SITO:
HERO IMAGES (per header/hero section):
${businessImages.hero.map((img, i) => `${i+1}. ${img.url} (${img.alt})`).join('\n')}

SERVICE IMAGES (per servizi/prodotti):  
${businessImages.services.map((img, i) => `${i+1}. ${img.url} (${img.alt})`).join('\n')}

BACKGROUND IMAGES (per sfondi sezioni):
${businessImages.backgrounds.map((img, i) => `${i+1}. ${img.url} (${img.alt})`).join('\n')}

🎨 LINEE GUIDA DESIGN:
- Modalità: ${generationMode === 'professional' ? 'PROFESSIONALE (elegante, pulito, tradizionale)' : 'CREATIVO (audace, colorato, originale)'}
- Rispecchia il settore: ${businessType || 'business'}
- Tono: Adatto al target del business

STRUTTURA JSON ESATTA:
{
  "title": "Titolo sito appropriato al business",
  "description": "Descrizione professionale del business",
  "sections": [
    {
      "id": "hero",
      "type": "hero",
      "title": "Titolo hero che riflette il business",
      "image": "URL_HERO_IMAGE_DA_LISTA_SOPRA",
      "content": {
        "subtitle": "Sottotitolo rilevante",
        "description": "Descrizione che rispecchia la richiesta del cliente"
      }
    },
    {
      "id": "services", 
      "type": "services",
      "title": "Titolo sezione servizi/prodotti COME RICHIESTO dal cliente",
      "backgroundImage": "URL_BACKGROUND_IMAGE_DA_LISTA_SOPRA",
      "content": {
        "subtitle": "Sottotitolo pertinente",
        "description": "Descrizione dei servizi/prodotti",
        "items": [
          {
            "title": "Nome prodotto/servizio REALE richiesto dal cliente",
            "description": "Descrizione accurata del prodotto/servizio",
            "image": "URL_SERVICE_IMAGE_DA_LISTA_SOPRA"
          }
        ]
      }
    },
    {
      "id": "about",
      "type": "about", 
      "title": "Chi siamo / La nostra storia",
      "backgroundImage": "URL_BACKGROUND_IMAGE_DA_LISTA_SOPRA",
      "content": {
        "subtitle": "La nostra missione",
        "description": "Storia aziendale professionale"
      }
    },
    {
      "id": "contact",
      "type": "contact",
      "title": "Contattaci",
      "content": {
        "subtitle": "Richiedi informazioni",
        "description": "Invito al contatto professionale",
        "cta": "Call to action appropriata"
      }
    }
  ],
  "design": {
    "primaryColor": "Colore principale adatto al settore e richieste",
    "secondaryColor": "Colore secondario complementare", 
    "accentColor": "Colore accento per evidenziare",
    "backgroundColor": "Sfondo professionale (bianco/grigio chiaro per business, più colorato per creativi)",
    "textColor": "Testo leggibile e professionale",
    "dynamicCSS": "CSS ottimizzato per il business specifico: stile professionale per aziende business, più creativo per settori artistici. Integra perfettamente le immagini con il design. Crea un'esperienza coerente con le richieste del cliente."
  }
}

🎯 ESEMPI DI SETTORI SPECIFICI:
- AUTOMOBILI: Crea sezioni per "Auto Nuove", "Auto Usate", "Furgoni Commerciali" con filtri di ricerca (alimentazione, cilindrata, tipo veicolo)
- RISTORANTI: Menu, specialità, prenotazioni, delivery
- IMMOBILIARE: Proprietà in vendita, affitto, servizi immobiliari
- MODA: Collezioni, catalogo prodotti, lookbook
- SERVIZI: Pacchetti servizi, consulenze, portfolio lavori

🖼️ ISTRUZIONI IMMAGINI:
- USA LE IMMAGINI dalla lista fornita sopra
- INSERISCI URL ESATTI delle immagini appropriate  
- Hero section: usa HERO IMAGES
- Servizi: usa SERVICE IMAGES per ogni item
- Sfondi sezioni: usa BACKGROUND IMAGES
- COMBINA immagini e CSS per effetti WOW!

RISPONDI SOLO CON IL JSON - NIENTE ALTRO! SENZA BACKTICKS O FORMATTAZIONE!`;

    // 🚀 CHIAMATA A CLAUDE SONNET
    console.log(`🚀 Calling Claude Sonnet API... (${generationMode.toUpperCase()} mode, temperature: ${temperature})`);
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4000,
      temperature: temperature, // 🎭 TEMPERATURA DINAMICA PER MODALITÀ
      messages: [
        {
          role: 'user',
          content: claudePrompt
        }
      ]
    });

    if (!response || !response.content || !response.content[0]) {
      throw new Error('Claude response is empty');
    }

    const claudeResponseText = response.content[0].text.trim();
    console.log('✅ Claude Response Length:', claudeResponseText.length);
    console.log('📄 Claude Response Preview:', claudeResponseText.substring(0, 500) + '...');

    // 🧹 PULIZIA RESPONSE CLAUDE - RIMUOVI BACKTICKS E FORMATTAZIONE
    let cleanedResponse = claudeResponseText;
    
    // Rimuovi ```json all'inizio
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '');
    }
    
    // Rimuovi ``` alla fine
    if (cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/\s*```$/, '');
    }
    
    // Rimuovi eventuali backticks sparsi
    cleanedResponse = cleanedResponse.replace(/```/g, '');
    
    console.log('🧹 Cleaned Response Length:', cleanedResponse.length);
    console.log('🧹 Cleaned Preview:', cleanedResponse.substring(0, 300) + '...');

    // 🔍 PARSING RESPONSE CLAUDE PULITA
    let websiteData;
    try {
      websiteData = JSON.parse(cleanedResponse);
      console.log('✅ CLAUDE SUCCESS - REAL AI CONTENT GENERATED');
      console.log('🎯 Title:', websiteData.title);
      console.log('📱 Sections:', websiteData.sections?.length || 0);
      console.log('🎨 Has Dynamic CSS:', !!websiteData.design?.dynamicCSS);
      
      if (websiteData.design?.dynamicCSS) {
        console.log('💫 CSS Length:', websiteData.design.dynamicCSS.length);
      }
      
    } catch (parseError) {
      console.error('❌ Claude JSON Parse Error:', parseError.message);
      console.log('🔍 Original Response Length:', claudeResponseText.length);
      console.log('🔍 Cleaned Response Length:', cleanedResponse.length);
      console.log('🔍 Original Preview:', claudeResponseText.substring(0, 500) + '...');
      console.log('🔍 Cleaned Preview:', cleanedResponse.substring(0, 500) + '...');
      console.log('🔍 Parse Error Position:', parseError.message);
      
      throw new Error(`Failed to parse Claude JSON: ${parseError.message}`);
    }

    // 🎉 SUCCESS RESPONSE
    return res.json({
      success: true,
      website: websiteData,
      generator: 'claude-sonnet-ai-trainer',
      mode: generationMode,
      temperature: temperature,
      timestamp: new Date().toISOString(),
      message: `Website generated by Claude Sonnet on AI-Trainer! (${generationMode.toUpperCase()} mode)`
    });

  } catch (error) {
    console.error('❌ Claude Website Generation Error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'CLAUDE_GENERATION_FAILED',
      message: error.message,
      generator: 'claude-sonnet-ai-trainer',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 🏥 HEALTH CHECK PER CLAUDE GENERATOR
 */
router.get('/health', async (req, res) => {
  try {
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    const hasClaudeKey = !!(claudeApiKey && claudeApiKey.startsWith('sk-ant-api03-'));

    res.json({
      service: 'Claude Website Generator - AI Trainer',
      status: hasClaudeKey ? 'healthy' : 'missing-api-key',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      features: {
        claude_sonnet: hasClaudeKey,
        dual_mode: true,
        creative_mode: true,
        professional_mode: true,
        zero_fallback: true
      },
      modes: {
        creative: {
          temperature: 0.9,
          style: 'artistic, unconventional, creative',
          use_case: 'Portfolio, creative businesses, wow factor'
        },
        professional: {
          temperature: 0.3,
          style: 'business-oriented, functional, trust-building', 
          use_case: 'Corporate, services, e-commerce'
        }
      },
      model: 'claude-3-5-sonnet-20240620',
      endpoint: '/api/claude/generate',
      parameters: {
        required: ['businessName'],
        optional: ['businessType', 'businessDescription', 'mode']
      }
    });

  } catch (error) {
    res.status(500).json({
      service: 'Claude Website Generator - AI Trainer',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
