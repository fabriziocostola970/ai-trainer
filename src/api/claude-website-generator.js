const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const UnifiedImageService = require('../services/unified-image-service.js');
const RequirementValidator = require('../services/requirement-validator.js');

// CLAUDE SONNET 4 - CREATIVE GENERATION + REQUIREMENT VALIDATION
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
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

    // 🎨 PROMPT CLAUDE COMPLETAMENTE CREATIVO E LIBERO
    const claudePrompt = `SEI UN WEB DESIGNER ESPERTO E ALTAMENTE CREATIVO!

Crea un sito web COMPLETO per: ${businessName}
Settore: ${businessType || 'business'}

RICHIESTA COMPLETA DEL CLIENTE:
${businessDescription}

ISTRUZIONI IMPORTANTI:
- Analizza ATTENTAMENTE la richiesta del cliente sopra
- Implementa OGNI singolo elemento richiesto (sezioni, funzionalità, filtri, ecc.)
- Se il cliente chiede FILTRI di ricerca, creali funzionanti con JavaScript
- Se chiede specifiche categorie di prodotti, organizzale nel layout
- Mantieni lo stile richiesto (aggressivo/colorato/professionale/ecc.)
- Sii CREATIVO nella struttura e nel design, ma RISPETTA ogni richiesta

IMMAGINI DISPONIBILI (usa queste URL esatte):
${businessImages.hero?.map((img, i) => `HERO ${i+1}: ${getImageUrl(img)}`).join('\n') || 'Nessuna immagine hero'}
${(businessImages.services || []).map((img, i) => `CONTENT ${i+1}: ${getImageUrl(img)}`).join('\n') || 'Nessuna immagine content'}
${(businessImages.backgrounds || []).map((img, i) => `BACKGROUND ${i+1}: ${getImageUrl(img)}`).join('\n') || 'Nessuna immagine background'}

IMPORTANTE: Usa SOLO le immagini elencate sopra con le loro URL esatte!

CREATIVITÀ TOTALE PERMESSA:
- Design layout innovativo e accattivante
- Usa colori, animazioni, effetti creativi 
- Struttura creativa delle sezioni
- Typography moderna e impattante
- Interazioni JavaScript creative
- Layout responsive e moderno

PERO' RISPETTA SEMPRE:
- Ogni richiesta specifica del cliente
- Sezioni e funzionalità richieste
- Stile generale indicato dal cliente
- Filtri o funzionalità specifiche menzionate

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

REGOLE ASSOLUTE:
1. RISPETTA OGNI SINGOLA RICHIESTA della descrizione cliente
2. USA le immagini fornite con le URL esatte
3. CREA sezioni separate se richieste separate
4. NON inventare contatti se non forniti
5. SFRUTTA tutta la creatività per design e layout
6. OUTPUT: SOLO JSON valido, nessun testo extra

STRUTTURA JSON:
{
  "website": {
    "name": "${businessName}",
    "title": "Titolo creativo basato sulla richiesta",
    "description": "Meta description SEO",
    "sections": [
      {
        "id": "hero",
        "type": "hero", 
        "title": "Hero Title",
        "content": "Hero content",
        "image": "URL_HERO_IMAGE",
        "backgroundColor": "#HEX_COLOR",
        "textColor": "#FFFFFF"
      }
      // ... altre sezioni richieste dal cliente
    ],
    "contact": {
      "phone": "SOLO se specificato dal cliente",
      "email": "SOLO se specificato dal cliente", 
      "address": "SOLO se specificato dal cliente",
      "whatsapp": "SOLO se specificato dal cliente",
      "hours": "SOLO se specificato dal cliente"
    },
    "colors": {
      "primary": "#colore_principale",
      "secondary": "#colore_secondario", 
      "accent": "#colore_accento"
    },
    "fonts": {
      "heading": "Font moderno per titoli",
      "body": "Font leggibile per testo"
    }
  }
}`;

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

    const responseText = claudeResponse.content[0].text;
    console.log('✅ Claude response received');
    
    // PARSE JSON RESPONSE
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Claude response');
    }

    const website = JSON.parse(jsonMatch[0]);
    console.log(`🏗️  Website generated with ${website.website.sections.length} sections`);

    // 🔍 VALIDAZIONE POST-GENERAZIONE CON REQUIREMENT VALIDATOR
    console.log('🔍 Validating generated website against client requirements...');
    
    const validator = new RequirementValidator();
    const clientRequirements = validator.extractRequirements(businessDescription);
    const validationResult = validator.validateGeneratedHTML(
      JSON.stringify(website), 
      clientRequirements
    );

    console.log('📋 Client requirements found:', clientRequirements.sections?.length || 0);
    console.log('✅ Requirements satisfied:', validationResult.satisfied.length);
    console.log('❌ Requirements missing:', validationResult.missing.length);

    // 🚨 SE CI SONO REQUISITI MANCANTI, COMPLETA AUTOMATICAMENTE
    if (validationResult.missing.length > 0) {
      console.log('🔧 Auto-completing missing requirements...');
      
      const completionPrompt = validator.generateCompletionPrompt(
        website, 
        validationResult.missing
      );

      const completionResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: completionPrompt
          }
        ]
      });

      const completionText = completionResponse.content[0].text;
      const completionMatch = completionText.match(/\{[\s\S]*\}/);
      
      if (completionMatch) {
        const completedWebsite = JSON.parse(completionMatch[0]);
        website.website = completedWebsite.website;
        console.log('✅ Website completed with missing requirements');
      }
    }

    // RESPONSE
    res.json({
      success: true,
      website: website.website,
      metadata: {
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
        website_id: websiteId,
        creative_system: 'v2.0 - Post-validation requirements'
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
