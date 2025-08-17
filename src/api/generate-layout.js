const express = require('express');
const router = express.Router();
const DatabaseStorage = require('../storage/database-storage');
const DesignIntelligence = require('../ai/design-intelligence');

// 🧠 ENHANCED LAYOUT GENERATION
// Utilizza pattern estratti per layout più intelligenti

// 🔄 MAPPING BUSINESS TYPES (Italiano → Inglese per training data)
const BUSINESS_TYPE_MAPPING = {
  'alimentare': ['restaurant', 'food', 'catering', 'cafe'],
  'restaurant': ['restaurant', 'food', 'catering'],
  'ristorante': ['restaurant', 'food', 'catering'],
  'cibo': ['restaurant', 'food', 'catering'],
  'tecnologia': ['technology', 'tech', 'software', 'startup'],
  'moda': ['fashion', 'clothing', 'style'],
  'ecommerce': ['ecommerce', 'shop', 'store'],
  'portfolio': ['portfolio', 'personal', 'freelance'],
  'azienda': ['business', 'corporate', 'company'],
  'servizi': ['services', 'consulting', 'professional']
};

// Middleware per autenticazione API
const authenticateAPI = (req, res, next) => {
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
  
  next();
};

// 🧠 POST /api/generate/layout - Enhanced with Design Intelligence
router.post('/layout', authenticateAPI, async (req, res) => {
  try {
    console.log('🧠 AI-Enhanced Layout Generation:', {
      businessType: req.body.businessType,
      blocksCount: req.body.currentBlocks?.length || 0,
      timestamp: new Date().toISOString()
    });

    const { businessType, businessName, style = 'modern', currentBlocks = [] } = req.body;
    
    if (!businessType) {
      return res.status(400).json({
        success: false,
        error: 'Business type is required'
      });
    }

    // Traduzione business type per compatibilità con training data
    const englishBusinessType = BUSINESS_TYPE_MAPPING[businessType.toLowerCase()]?.[0] || businessType;
    
    console.log(`🔄 Business type mapping: ${businessType} → ${englishBusinessType}`);

    // Verifica disponibilità database prima di procedere
    const designAI = new DesignIntelligence();
    
    try {
      // Test rapido per verificare se il database ai_design_patterns esiste
      await designAI.pool.query('SELECT 1 FROM ai_design_patterns LIMIT 1');
    } catch (dbError) {
      console.log(`❌ Database ai_design_patterns not available: ${dbError.message}`);
      await designAI.close();
      
      // Restituisci modalità manutenzione quando il database non è disponibile
      return res.status(503).json({
        success: false,
        error: 'Service temporarily unavailable - database maintenance in progress',
        isFallback: true,
        redirect: '/maintenance'
      });
    }

    // Utilizza Design Intelligence per generare design ottimizzato
    const designRecommendation = await designAI.generateCompleteDesignRecommendation(englishBusinessType, {
      style,
      contentType: 'layout',
      tone: 'professional'
    });
    
    const layoutSuggestions = await designAI.generateLayoutSuggestions(englishBusinessType, 'layout');
    await designAI.close();

    // Genera blocchi semantici ottimizzati
    const semanticBlocks = generateEnhancedBlocks(
      englishBusinessType, 
      businessName, 
      designRecommendation.design,
      currentBlocks
    );
    
    const response = {
      success: true,
      source: 'ai-design-intelligence',
      layoutData: {
        blocks: semanticBlocks,
        design: designRecommendation.design,
        layout: layoutSuggestions,
        metadata: {
          businessType: englishBusinessType,
          originalBusinessType: businessType,
          style,
          confidence: designRecommendation.confidence,
          generatedAt: new Date().toISOString(),
          aiEnhanced: true
        }
      },
      businessType: englishBusinessType,
      semanticScore: calculateSemanticScore(semanticBlocks, englishBusinessType),
      suggestedBlocks: semanticBlocks.map(block => block.type),
      designConfidence: designRecommendation.confidence
    };
    
    console.log(`✅ AI-enhanced layout generated with ${designRecommendation.confidence}% confidence`);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error generating layout:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      fallback: generateFallbackLayout()
    });
  }
});

// POST /api/generate/template
router.post('/template', async (req, res) => {
  try {
    console.log('🎯 Creative template generation request:', req.body);
    
    const { businessData, inspirationDataset, creativityLevel } = req.body;
    
    // Mock creative template response
    const mockTemplate = {
      success: true,
      template: {
        name: `${businessData?.businessType || 'Custom'} Creative Pro`,
        layout: ['navigation-modern', 'hero-animated', 'features-grid', 'testimonials-video', 'cta-prominent'],
        colorPalette: ['#667EEA', '#764BA2', '#F093FB', '#F5F7FA'],
        typography: {
          primary: 'Inter',
          secondary: 'JetBrains Mono'
        },
        customBlocks: [
          'interactive-demo',
          'pricing-calculator',
          'feature-comparison'
        ]
      },
      creativityScore: 89,
      businessAlignment: 92,
      metadata: {
        generatedAt: new Date().toISOString(),
        processingTime: 250
      }
    };
    
    res.json(mockTemplate);
    
  } catch (error) {
    console.error('❌ Template generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Template generation failed',
      details: error.message
    });
  }
});

// 🔄 Fallback per quando non ci sono dati di training
function generateFallbackLayout(businessType) {
  console.log(`🔄 Using fallback layout for ${businessType}`);
  
  const fallbackLayouts = {
    restaurant: [
      'navigation-elegant',
      'hero-restaurant', 
      'menu-showcase',
      'about-story',
      'gallery-food',
      'reviews-customers',
      'contact-reservation',
      'footer-social'
    ],
    ecommerce: [
      'navigation-shop',
      'hero-product',
      'categories-grid',
      'featured-products',
      'testimonials-customers',
      'newsletter-signup',
      'footer-ecommerce'
    ],
    technology: [
      'navigation-tech',
      'hero-tech',
      'features-tech',
      'case-studies',
      'pricing-plans',
      'contact-tech',
      'footer-tech'
    ],
    default: [
      'navigation-standard',
      'hero-default',
      'features-grid',
      'about-section',
      'contact-form',
      'footer-standard'
    ]
  };
  
  return {
    blocks: fallbackLayouts[businessType] || fallbackLayouts.default,
    confidence: 75,
    trainingData: {
      sessionsAnalyzed: 0,
      samplesAnalyzed: 0,
      sitesAnalyzed: 0,
      patternsFound: ['fallback-mode']
    }
  };
}

/**
 * Genera blocchi migliorati utilizzando i pattern di design estratti
 */
function generateEnhancedBlocks(businessType, businessName, designData, currentBlocks = []) {
  console.log(`🧠 Generating enhanced blocks for ${businessType} with AI design data`);
  
  // 🎨 ENHANCED: Working image service function
  const getWorkingImage = (type, businessType) => {
    const businessImages = {
      restaurant: {
        logo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=100&fit=crop&crop=center',
        hero: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=600&fit=crop&crop=center'
      },
      ecommerce: {
        logo: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=100&fit=crop&crop=center',
        hero: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop&crop=center'
      },
      technology: {
        logo: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=100&fit=crop&crop=center',
        hero: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop&crop=center'
      },
      default: {
        logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=100&fit=crop&crop=center',
        hero: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=1200&h=600&fit=crop&crop=center'
      }
    };
    
    const images = businessImages[businessType] || businessImages.default;
    return images[type] || images.hero;
  };
  
  const blocks = [];
  
  // 1. Navigation (sempre ottimizzata con design patterns e logo)
  blocks.push({
    id: `nav-${Date.now()}`,
    type: 'navigation-modern',
    content: {
      title: businessName,
      logo: getWorkingImage('logo', businessType),
      menuItems: ['Home', 'Servizi', 'Chi Siamo', 'Contatti']
    },
    style: {
      backgroundColor: designData?.backgroundColor || '#FFFFFF',
      textColor: designData?.textColor || '#1F2937',
      primaryFont: designData?.typography?.primaryFont || 'Inter'
    },
    aiEnhanced: true,
    confidence: 95
  });
  
  // 2. Hero Section (personalizzata per business type con immagine)
  blocks.push({
    id: `hero-${Date.now()}`,
    type: getOptimalHeroType(businessType),
    content: {
      title: `Benvenuto in ${businessName}`,
      subtitle: getBusinessSubtitle(businessType, businessName),
      description: getBusinessDescription(businessType),
      image: getWorkingImage('hero', businessType),
      cta: getBusinessCTA(businessType)
    },
    style: {
      backgroundColor: designData?.primaryColor || '#3B82F6',
      textColor: '#FFFFFF',
      accentColor: designData?.accentColor || '#F59E0B'
    },
    aiEnhanced: true,
    confidence: 90
  });
  
  // 3. Content blocks basati sui pattern estratti
  const contentBlocks = generateBusinessSpecificBlocks(businessType, businessName, designData);
  blocks.push(...contentBlocks);
  
  return blocks;
}

// 🎯 Helper functions for business-specific content
function getBusinessSubtitle(businessType, businessName) {
  const subtitles = {
    restaurant: `Sapori autentici e tradizione culinaria`,
    ecommerce: `La tua destinazione per lo shopping online`,
    technology: `Innovazione e soluzioni tecnologiche avanzate`,
    default: `Qualità e professionalità al tuo servizio`
  };
  return subtitles[businessType] || subtitles.default;
}

function getBusinessDescription(businessType) {
  const descriptions = {
    restaurant: 'Vieni a scoprire la nostra cucina, dove tradizione e innovazione si incontrano per offrirti un\'esperienza gastronomica indimenticabile.',
    ecommerce: 'Scopri la nostra vasta selezione di prodotti di alta qualità, con spedizioni rapide e un servizio clienti sempre a tua disposizione.',
    technology: 'Trasformiamo le tue idee in soluzioni digitali innovative, utilizzando le tecnologie più avanzate per far crescere il tuo business.',
    default: 'Siamo qui per offrirti il meglio dei nostri servizi, con professionalità e dedizione per soddisfare ogni tua esigenza.'
  };
  return descriptions[businessType] || descriptions.default;
}

function getBusinessCTA(businessType) {
  const ctas = {
    restaurant: 'Prenota un Tavolo',
    ecommerce: 'Inizia a Comprare',
    technology: 'Richiedi Preventivo',
    default: 'Scopri di Più'
  };
  return ctas[businessType] || ctas.default;
}

function getOptimalHeroType(businessType) {
  const heroTypes = {
    restaurant: 'hero-restaurant-showcase',
    ecommerce: 'hero-product-featured',
    technology: 'hero-tech-innovation',
    portfolio: 'hero-creative-showcase',
    default: 'hero-modern-clean'
  };
  return heroTypes[businessType] || heroTypes.default;
}

function generateBusinessSpecificBlocks(businessType, businessName, designData) {
  // 🎨 ENHANCED: Generate structured content with working images
  const getWorkingImage = (type) => {
    const imageServices = {
      'menu-showcase': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&crop=center',
      'gallery-food': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop&crop=center',
      'reviews-customers': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      'featured-products': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop&crop=center',
      'categories-grid': 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&h=400&fit=crop&crop=center',
      'testimonials-social': 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
      'features-tech': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&crop=center',
      'case-studies': 'https://images.unsplash.com/photo-1552581234-26160f608093?w=800&h=600&fit=crop&crop=center',
      'pricing-plans': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop&crop=center'
    };
    return imageServices[type] || 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=800&h=600&fit=crop&crop=center';
  };

  const businessBlocks = {
    restaurant: [
      {
        type: 'menu-showcase',
        content: {
          title: `Menu ${businessName}`,
          subtitle: 'I nostri piatti più amati dai clienti',
          description: 'Scopri la nostra selezione di specialità culinarie preparate con ingredienti freschi e di alta qualità.',
          image: getWorkingImage('menu-showcase'),
          cta: 'Guarda il Menu'
        },
        priority: 1
      },
      {
        type: 'gallery-food',
        content: {
          title: 'Galleria Gastronomica',
          subtitle: 'Un viaggio visivo nei nostri sapori',
          description: 'Ogni piatto è una piccola opera d\'arte culinaria.',
          image: getWorkingImage('gallery-food'),
          cta: 'Vedi Tutte le Foto'
        },
        priority: 2
      },
      {
        type: 'reviews-customers',
        content: {
          title: 'Testimonianze',
          subtitle: 'Cosa dicono i nostri clienti',
          description: 'La soddisfazione dei nostri ospiti è la nostra priorità.',
          image: getWorkingImage('reviews-customers'),
          cta: 'Leggi Tutte le Recensioni'
        },
        priority: 3
      }
    ],
    ecommerce: [
      {
        type: 'featured-products',
        content: {
          title: `Prodotti in Evidenza - ${businessName}`,
          subtitle: 'I più venduti del mese',
          description: 'Scopri i prodotti che stanno conquistando i nostri clienti.',
          image: getWorkingImage('featured-products'),
          cta: 'Acquista Ora'
        },
        priority: 1
      },
      {
        type: 'categories-grid',
        content: {
          title: 'Categorie Prodotti',
          subtitle: 'Trova quello che cerchi',
          description: 'Naviga tra le nostre categorie per trovare il prodotto perfetto.',
          image: getWorkingImage('categories-grid'),
          cta: 'Esplora Categorie'
        },
        priority: 2
      },
      {
        type: 'testimonials-social',
        content: {
          title: 'Recensioni Clienti',
          subtitle: 'Fiducia e qualità garantita',
          description: 'Migliaia di clienti soddisfatti che ci hanno scelto.',
          image: getWorkingImage('testimonials-social'),
          cta: 'Leggi le Recensioni'
        },
        priority: 3
      }
    ],
    technology: [
      {
        type: 'features-tech',
        content: {
          title: `Funzionalità ${businessName}`,
          subtitle: 'Tecnologia all\'avanguardia',
          description: 'Scopri le caratteristiche innovative che rendono unica la nostra soluzione.',
          image: getWorkingImage('features-tech'),
          cta: 'Scopri di Più'
        },
        priority: 1
      },
      {
        type: 'case-studies',
        content: {
          title: 'Casi di Successo',
          subtitle: 'Risultati che parlano da soli',
          description: 'Scopri come abbiamo aiutato i nostri clienti a raggiungere i loro obiettivi.',
          image: getWorkingImage('case-studies'),
          cta: 'Leggi i Casi Studio'
        },
        priority: 2
      },
      {
        type: 'pricing-plans',
        content: {
          title: 'Piani e Prezzi',
          subtitle: 'La soluzione giusta per ogni esigenza',
          description: 'Scegli il piano più adatto al tuo business.',
          image: getWorkingImage('pricing-plans'),
          cta: 'Scegli il Tuo Piano'
        },
        priority: 3
      }
    ]
  };
  
  const blocks = businessBlocks[businessType] || businessBlocks.technology;
  
  return blocks.map((block, index) => ({
    id: `${block.type}-${Date.now()}-${index}`,
    type: block.type,
    content: block.content,
    style: {
      backgroundColor: designData?.backgroundColor || '#FFFFFF',
      textColor: designData?.textColor || '#1F2937',
      primaryColor: designData?.primaryColor || '#3B82F6'
    },
    aiEnhanced: true,
    confidence: Math.max(85 - (block.priority * 5), 70),
    priority: block.priority
  }));
}

function calculateSemanticScore(blocks, businessType) {
  if (!blocks || blocks.length === 0) return 50;
  
  const businessRelevantTypes = {
    restaurant: ['menu', 'food', 'gallery', 'reviews', 'reservation'],
    ecommerce: ['product', 'shop', 'cart', 'testimonials', 'categories'],
    technology: ['features', 'tech', 'case-studies', 'pricing', 'demo']
  };
  
  const relevantTypes = businessRelevantTypes[businessType] || businessRelevantTypes.technology;
  
  const relevantBlocks = blocks.filter(block => 
    relevantTypes.some(type => block.type?.includes(type))
  );
  
  const baseScore = Math.min((relevantBlocks.length / blocks.length) * 100, 95);
  const aiBonus = blocks.some(block => block.aiEnhanced) ? 10 : 0;
  
  return Math.round(Math.min(baseScore + aiBonus, 99));
}

module.exports = router;
