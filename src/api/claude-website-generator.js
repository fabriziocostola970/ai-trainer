const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const UnifiedImageService = require('../services/unified-image-service.js');
const BusinessPreProcessor = require('../services/business-preprocessor.js');

// CLAUDE SONNET 4 - SMART PREPROCESSING SYSTEM
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

/**
 * ENDPOINT GENERAZIONE WEBSITE CON CLAUDE SONNET + SMART PREPROCESSING
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

    console.log('CLAUDE + SMART PRE-PROCESSOR - GENERAZIONE WEBSITE');
    console.log('Business:', { businessName, businessType, businessDescription });
    
    // MODALITA GENERAZIONE: creative | professional
    let generationMode = mode.toLowerCase();
    
    if (mode === 'creative' && businessType) {
      const professionalTypes = ['consulenza', 'avvocato', 'medico', 'dentista', 'commercialista', 
                                'agenzia', 'studio', 'clinica', 'banca', 'assicurazione', 'contabilità'];
      
      if (professionalTypes.some(type => businessType.toLowerCase().includes(type))) {
        generationMode = 'professional';
        console.log('AUTO-DETECTED: Professional mode per business type');
      }
    }
    
    console.log('Mode:', generationMode.toUpperCase());

    // SMART PRE-PROCESSING - ANALISI INTELLIGENTE RICHIESTA CLIENTE
    console.log('Starting smart pre-processing...');
    const preProcessedData = await BusinessPreProcessor.processBusinessRequest(
      businessName,
      businessType, 
      businessDescription,
      generationMode
    );
    
    console.log('Pre-processing completed:', {
      extractedSections: preProcessedData.extractedSections.length,
      imageRequests: preProcessedData.imageRequests.length,
      designContext: preProcessedData.designContext.style
    });

    // RECUPERO IMMAGINI CON SISTEMA UNIFICATO - Pexels → Unsplash fallback
    console.log('Fetching images with unified service (Pexels → Unsplash)...');
    
    // Immagini generiche per il business
    const businessImages = await UnifiedImageService.getBusinessImages(
      businessType || 'business', 
      businessName, 
      3
    );
    
    // Immagini specifiche dalle richieste PRE-PROCESSATE
    const specificImages = [];
    for (const request of preProcessedData.imageRequests) {
      try {
        console.log(`Searching for: ${request.searchKeywords}`);
        const specificImageResults = await UnifiedImageService.searchImages(request.searchKeywords, 1);
        if (specificImageResults && specificImageResults.length > 0) {
          specificImages.push({
            ...specificImageResults[0],
            requestDescription: request.description,
            category: request.category
          });
        }
      } catch (error) {
        console.log(`Failed to find image for: ${request.searchKeywords}`);
      }
    }
    
    console.log(`Retrieved ${businessImages.total} generic + ${specificImages.length} specific images`);

    // TEMPERATURA DINAMICA BASATA SU MODALITA
    const temperature = generationMode === 'professional' ? 0.3 : 0.9;

    // PROMPT CLAUDE CON PRE-PROCESSING INTELLIGENTE
    const claudePrompt = `SEI UN WEB DESIGNER ESPERTO CHE SEGUE SEMPRE LE SPECIFICHE DEL CLIENTE!

Crea un sito web PERFETTO per: ${businessName} (${businessType || 'business'})

DESCRIZIONE E RICHIESTE SPECIFICHE DEL CLIENTE:
${businessDescription || 'Business innovativo'}

ISTRUZIONI SMART PRE-PROCESSATE:
${preProcessedData.claudeInstructions}

IMPORTANTISSIMO: SEGUI ESATTAMENTE LE RICHIESTE DELLA DESCRIZIONE SOPRA!
- Se il cliente chiede sezioni specifiche, creale esattamente come richiesto
- Se chiede funzionalità particolari (filtri, categorie, ecc.), includile nel design
- Se specifica stili o colori, rispettali
- Se richiede elementi specifici, non inventarne altri
- La creatività deve RISPETTARE sempre le specifiche del cliente

IMMAGINI DISPONIBILI PER IL SITO:
HERO IMAGES (per header/hero section):
${businessImages.hero?.map((img, i) => `${i+1}. ${img.urls?.regular || img.url} (${img.alt})`).join('\n') || 'Nessuna immagine hero disponibile'}

SERVICE IMAGES (per servizi/prodotti):  
${(businessImages.services || businessImages.service)?.map((img, i) => `${i+1}. ${img.urls?.regular || img.url} (${img.alt})`).join('\n') || 'Nessuna immagine servizi disponibile'}

BACKGROUND IMAGES (per sfondi sezioni):
${(businessImages.backgrounds || businessImages.background)?.map((img, i) => `${i+1}. ${img.urls?.regular || img.url} (${img.alt})`).join('\n') || 'Nessuna immagine background disponibile'}

IMMAGINI SPECIFICHE RICHIESTE DAL CLIENTE:
${specificImages.length > 0 
  ? specificImages.map((img, i) => `${i+1}. ${img.url} (per: ${img.requestDescription}, categoria: ${img.category})`).join('\n')
  : 'Nessuna immagine specifica richiesta'
}

PRIORITA IMMAGINI: USA SEMPRE le "IMMAGINI SPECIFICHE RICHIESTE DAL CLIENTE" quando disponibili per le sezioni corrispondenti!

DESIGN CONTEXT PRE-ANALIZZATO:
- Modalità: ${generationMode === 'professional' ? 'PROFESSIONALE (elegante, pulito, tradizionale)' : 'CREATIVO (audace, colorato, originale)'}
- Settore: ${preProcessedData.designContext.industry}
- Stile: ${preProcessedData.designContext.style}
- Mood: ${preProcessedData.designContext.mood}
- Colori suggeriti: ${preProcessedData.designContext.colors.join(', ')}

REGOLE RIGIDE PER CONTATTI E SPECIFICHE:
- Se il cliente fornisce INDIRIZZO, TELEFONO, WHATSAPP, ORARI - usali ESATTAMENTE
- Se specifica SEZIONI precise (es: "Alberi da Frutta", "Giardinaggio Casalingo") - creale con QUESTI NOMI ESATTI
- Se elenca PRODOTTI specifici (orchidee, rose rosse, piante ornamentali) - scrivili nel contenuto
- NO template generici quando il cliente è specifico
- SI a ogni singolo dettaglio richiesto nella descrizione

STOP AL RAGGRUPPAMENTO GENERICO:
- NON raggruppare tutto in "I Nostri Servizi" o "Servizi"
- Se il cliente chiede 4 sezioni separate, crea 4 sezioni separate
- Ogni sezione deve avere il suo ID univoco e il titolo esatto richiesto
- Esempio: se chiede "Alberi da Frutta" + "Giardinaggio Casalingo" = 2 sezioni separate, non 1 sezione "Servizi"

STRUTTURA JSON ESATTA:
{
  "website": {
    "name": "${businessName}",
    "title": "Titolo Specifico Based on Request",
    "description": "Meta description SEO",
    "sections": [
      {
        "id": "hero",
        "type": "hero",
        "title": "Hero Title che rispetta richiesta cliente",
        "content": "Hero content with specific business info",
        "image": "URL_HERO_IMAGE",
        "backgroundColor": "#HEX_COLOR",
        "textColor": "#FFFFFF"
      },
      {
        "id": "section_name_exact_from_request",
        "type": "service",
        "title": "EXACT TITLE from client request",
        "content": "Specific content for this exact section",
        "image": "URL_SPECIFIC_IMAGE_IF_REQUESTED",
        "backgroundColor": "#HEX_COLOR"
      }
    ],
    "contact": {
      "phone": "ONLY if specified by client",
      "email": "ONLY if specified by client", 
      "address": "ONLY if specified by client",
      "whatsapp": "ONLY if specified by client",
      "hours": "ONLY if specified by client"
    },
    "colors": {
      "primary": "${preProcessedData.designContext.colors[0] || '#2196F3'}",
      "secondary": "${preProcessedData.designContext.colors[1] || '#FF5722'}",
      "accent": "${preProcessedData.designContext.colors[2] || '#4CAF50'}"
    },
    "fonts": {
      "heading": "Modern font appropriate for ${businessType}",
      "body": "Clean readable font"
    }
  }
}

REGOLE ASSOLUTE:
1. RISPETTA OGNI SINGOLA RICHIESTA della descrizione cliente
2. USA le immagini specifiche per le sezioni corrispondenti  
3. CREA sezioni separate se richieste separate
4. NON inventare contatti se non forniti
5. SEGUI il design context pre-analizzato
6. OUTPUT: SOLO JSON valido, nessun testo extra`;

    console.log('Calling Claude Sonnet 4...');
    
    // CHIAMATA A CLAUDE SONNET 4
    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: temperature,
      messages: [
        {
          role: 'user',
          content: claudePrompt
        }
      ]
    });

    const responseText = claudeResponse.content[0].text;
    
    // PARSE JSON RESPONSE
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Claude response');
    }

    const website = JSON.parse(jsonMatch[0]);
    
    // SALVA DATI DI TRAINING
    preProcessedData.trainingData.output = website;
    preProcessedData.trainingData.claude_response_length = responseText.length;
    
    console.log('Training data prepared for future ML:', {
      sections_requested: preProcessedData.extractedSections.length,
      sections_generated: website.website.sections.length,
      images_used: specificImages.length
    });

    // RESPONSE
    res.json({
      success: true,
      website: website.website,
      metadata: {
        temperature: temperature,
        mode: generationMode,
        preprocessing: {
          sectionsExtracted: preProcessedData.extractedSections.length,
          imagesRequested: preProcessedData.imageRequests.length,
          designContext: preProcessedData.designContext
        },
        trainingData: preProcessedData.trainingData
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
