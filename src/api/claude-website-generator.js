const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

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

    // 🔥 PROMPT CLAUDE MASSIMA CREATIVITÀ
    const claudePrompt = `SEI UN WEB DESIGNER GENIALE E COMPLETAMENTE LIBERO!

Crea un sito web STRAORDINARIO per: ${businessName} (${businessType || 'business'})

DESCRIZIONE: ${businessDescription || 'Business innovativo'}

LIBERTÀ TOTALE - SENTI LA TUA CREATIVITÀ:
- Inventa nomi di servizi FOLLI e ORIGINALI
- Usa COLORI AUDACI e combinazioni WOW  
- Scrivi testi EMOZIONANTI che colpiscono il cuore
- Crea titoli MAGNETICI che fanno venire voglia di leggere
- Pensa come Steve Jobs + Van Gogh insieme!

STRUTTURA JSON ESATTA:
{
  "title": "TITOLO SITO INCREDIBILE",
  "description": "Descrizione che fa sognare",
  "sections": [
    {
      "id": "hero",
      "type": "hero",
      "title": "TITOLO HERO CHE SPACCA",
      "content": {
        "subtitle": "Sottotitolo magnetico",
        "description": "Storia epica in HTML con grassetti e corsivi"
      }
    },
    {
      "id": "services",
      "type": "services", 
      "title": "SERVIZI DAI NOMI CREATIVI",
      "content": {
        "subtitle": "Tagline indimenticabile",
        "description": "Intro servizi coinvolgente",
        "items": [
          {
            "title": "Nome Servizio PAZZESCO #1",
            "description": "Descrizione che vende emozioni"
          },
          {
            "title": "Nome Servizio GENIALE #2", 
            "description": "Descrizione che fa sognare"
          },
          {
            "title": "Nome Servizio INCREDIBILE #3",
            "description": "Descrizione che conquista"
          }
        ]
      }
    },
    {
      "id": "about",
      "type": "about",
      "title": "LA NOSTRA LEGGENDA EPICA", 
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
    "primaryColor": "#FF6B6B",
    "secondaryColor": "#4ECDC4",
    "accentColor": "#45B7D1", 
    "backgroundColor": "#FFFFFF",
    "textColor": "#2C3E50",
    "dynamicCSS": "CSS MAGICO QUI con animazioni STRAORDINARIE, gradienti FANTASTICI, effetti hover SPETTACOLARI! Usa la tua immaginazione più selvaggia per creare CSS che fa WOW!"
  }
}

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

    // 🔍 PARSING RESPONSE CLAUDE
    let websiteData;
    try {
      websiteData = JSON.parse(claudeResponseText);
      console.log('✅ CLAUDE SUCCESS - REAL AI CONTENT GENERATED');
      console.log('🎯 Title:', websiteData.title);
      console.log('📱 Sections:', websiteData.sections?.length || 0);
      console.log('🎨 Has Dynamic CSS:', !!websiteData.design?.dynamicCSS);
      
      if (websiteData.design?.dynamicCSS) {
        console.log('💫 CSS Length:', websiteData.design.dynamicCSS.length);
      }
      
    } catch (parseError) {
      console.error('❌ Claude JSON Parse Error:', parseError.message);
      console.log('🔍 Raw Response:', claudeResponseText);
      throw new Error('Failed to parse Claude response as JSON');
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
