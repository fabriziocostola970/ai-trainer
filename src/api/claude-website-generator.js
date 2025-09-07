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
    const { businessName, businessType, businessDescription } = req.body;

    if (!businessName) {
      return res.status(400).json({
        success: false,
        error: 'Missing business name'
      });
    }

    console.log('🎨 CLAUDE PURO AI-TRAINER - GENERAZIONE WEBSITE');
    console.log('📋 Business:', { businessName, businessType, businessDescription });

    // �️ RECUPERO IMMAGINI DA UNSPLASH
    console.log('🖼️ Fetching images from Unsplash...');
    const businessImages = await UnsplashService.getBusinessImages(
      businessType || 'business', 
      businessName, 
      6
    );
    console.log(`✅ Retrieved ${businessImages.total} images from Unsplash`);

    // �🔥 PROMPT CLAUDE MASSIMA CREATIVITÀ
    const claudePrompt = `SEI UN WEB DESIGNER GENIALE E COMPLETAMENTE LIBERO!

Crea un sito web STRAORDINARIO per: ${businessName} (${businessType || 'business'})

DESCRIZIONE: ${businessDescription || 'Business innovativo'}

🖼️ IMMAGINI DISPONIBILI PER IL SITO:
HERO IMAGES (per header/hero section):
${businessImages.hero.map((img, i) => `${i+1}. ${img.url} (${img.alt})`).join('\n')}

SERVICE IMAGES (per servizi/prodotti):  
${businessImages.services.map((img, i) => `${i+1}. ${img.url} (${img.alt})`).join('\n')}

BACKGROUND IMAGES (per sfondi sezioni):
${businessImages.backgrounds.map((img, i) => `${i+1}. ${img.url} (${img.alt})`).join('\n')}

🎨 DIVERSITÀ ESTREMA OBBLIGATORIA:
- CAMBIA COMPLETAMENTE lo stile da qualsiasi sito precedente
- Inventa nomi di servizi FOLLI e MAI SENTITI PRIMA
- USA COLORI che nessuno si aspetta per questo settore
- Scrivi con PERSONALITÀ UNICA (formale/informale/poetico/aggressivo)
- ROMPI LE CONVENZIONI del settore!

🎯 ISPIRAZIONE CASUALE:
- Mescola stili: ${['Minimalista Nordico', 'Cyberpunk Neon', 'Vintage Anni 70', 'Brutalista Moderno', 'Art Deco Luxury', 'Kawaii Giapponese', 'Industrial Grunge', 'Organic Nature'][Math.floor(Math.random() * 8)]}
- Personalità: ${['Steve Jobs visionario', 'Gordon Ramsay aggressivo', 'David Attenborough narratore', 'Elon Musk futuristico', 'Wes Anderson estetico', 'Banksy ribelle'][Math.floor(Math.random() * 6)]}

STRUTTURA JSON ESATTA:
{
  "title": "TITOLO SITO INCREDIBILE",
  "description": "Descrizione che fa sognare",
  "sections": [
    {
      "id": "hero",
      "type": "hero",
      "title": "TITOLO HERO CHE SPACCA",
      "image": "URL_HERO_IMAGE_DA_LISTA_SOPRA",
      "content": {
        "subtitle": "Sottotitolo magnetico",
        "description": "Storia epica in HTML con grassetti e corsivi"
      }
    },
    {
      "id": "services",
      "type": "services", 
      "title": "SERVIZI DAI NOMI CREATIVI",
      "backgroundImage": "URL_BACKGROUND_IMAGE_DA_LISTA_SOPRA",
      "content": {
        "subtitle": "Sottotitolo che incuriosisce",
        "description": "Descrizione coinvolgente",
        "items": [
          {
            "title": "SERVIZIO CON NOME FOLLE",
            "description": "Descrizione che fa sognare",
            "image": "URL_SERVICE_IMAGE_DA_LISTA_SOPRA"
          }
        ]
      }
    }
    },
    {
      "id": "about",
      "type": "about",
      "title": "LA NOSTRA LEGGENDA EPICA", 
      "backgroundImage": "URL_BACKGROUND_IMAGE_DA_LISTA_SOPRA",
      "content": {
        "subtitle": "Come è nata la magia",
        "description": "Storia coinvolgente con passione e visione del futuro"
      }
    },
    {
      "id": "contact",
      "type": "contact",
      "title": "INIZIA LA TUA AVVENTURA",
      "content": {
        "subtitle": "Il futuro ti aspetta",
        "description": "Call to action che non si può rifiutare",
        "cta": "TRASFORMA I TUOI SOGNI"
      }
    }
  ],
  "design": {
    "primaryColor": "COLORE PRINCIPALE SORPRENDENTE che rifletta la personalità unica",
    "secondaryColor": "COLORE SECONDARIO in armonia ma inaspettato", 
    "accentColor": "COLORE ACCENTO che fa POP!",
    "backgroundColor": "SFONDO che supporta l'atmosfera (bianco/nero/colorato)",
    "textColor": "TESTO leggibile ma caratteristico",
    "dynamicCSS": "CSS MAGICO con animazioni STRAORDINARIE! Crea effetti visivi UNICI per questo business specifico: gradienti personalizzati, animazioni tematiche, hover effects creativi, tipografia caratteristica. INTEGRA PERFETTAMENTE con le immagini: usa gradienti overlay, filtri CSS, blend-modes creativi. Le immagini devono VALORIZZARE il design, non rovinarlo! RENDI QUESTO SITO INCONFONDIBILE!"
  }
}

🖼️ ISTRUZIONI IMMAGINI:
- USA LE IMMAGINI dalla lista fornita sopra
- INSERISCI URL ESATTI delle immagini appropriate  
- Hero section: usa HERO IMAGES
- Servizi: usa SERVICE IMAGES per ogni item
- Sfondi sezioni: usa BACKGROUND IMAGES
- COMBINA immagini e CSS per effetti WOW!

RISPONDI SOLO CON IL JSON - NIENTE ALTRO! SENZA BACKTICKS O FORMATTAZIONE!`;

    // 🚀 CHIAMATA A CLAUDE SONNET
    console.log('🚀 Calling Claude Sonnet API...');
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4000,
      temperature: 0.9, // 🔥 MASSIMA CREATIVITÀ
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
      timestamp: new Date().toISOString(),
      message: 'Website generated by Claude Sonnet on AI-Trainer!'
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
      version: '1.0.0',
      features: {
        claude_sonnet: hasClaudeKey,
        zero_fallback: true,
        max_creativity: true,
        temperature: 0.9
      },
      model: 'claude-3-5-sonnet-20240620',
      endpoint: '/api/claude/generate'
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
