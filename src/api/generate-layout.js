const express = require('express');
const router = express.Router();
const DatabaseStorage = require('../storage/database-storage');
const DesignIntelligence = require('../ai/design-intelligence');
const OpenAI = require('openai');

// 🤖 OpenAI content generation with fallback
async function generateBusinessContentWithAI(businessType, businessName) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API key not configured, using static content');
      return null;
    }

    const prompt = `Genera contenuti specifici per un business di tipo "${businessType}" chiamato "${businessName}".
    
    Fornisci contenuti in formato JSON per:
    1. Hero section (titolo, sottotitolo, descrizione, CTA)
    2. Menu/Prodotti (3 elementi con nome, descrizione, prezzo indicativo)
    3. Galleria (4 descrizioni per immagini)
    4. Recensioni (3 testimonianze con nome cliente e rating)
    5. About section (storia del business)
    
    Rispondi SOLO con JSON valido, senza markdown:
    {
      "hero": {
        "title": "...",
        "subtitle": "...",
        "description": "...",
        "cta": "..."
      },
      "menu": {
        "title": "...",
        "subtitle": "...",
        "description": "...",
        "items": [{"name": "...", "description": "...", "price": "..."}]
      },
      "gallery": {
        "title": "...",
        "subtitle": "...",
        "description": "...",
        "items": ["descrizione1", "descrizione2", "descrizione3", "descrizione4"]
      },
      "reviews": {
        "title": "...",
        "subtitle": "...",
        "description": "...",
        "testimonials": [{"name": "...", "text": "...", "rating": 5}]
      },
      "about": {
        "title": "...",
        "subtitle": "...",
        "description": "..."
      }
    }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
      temperature: 0.7
    });

    const content = JSON.parse(completion.choices[0].message.content);
    console.log('✅ Generated AI content for:', businessName);
    return content;
    
  } catch (error) {
    console.log('⚠️ AI content generation failed, using fallback:', error.message);
    return null;
  }
}

// 🖼️ DATABASE-DRIVEN Gallery Images (DINAMICO - Auto-genera competitor)
async function getBusinessImagesFromDB(businessType, count = 4, attempt = 1) {
  const maxAttempts = 2; // Evita loop infiniti
  
  try {
    const storage = new DatabaseStorage();
    await storage.initialize(); // ✅ INIZIALIZZA IL DATABASE
    
    console.log(`🔍 Checking database for business type: ${businessType} (attempt ${attempt})`);
    
    // 1. Query dal database per immagini esistenti
    const result = await storage.query(
      'SELECT business_images FROM ai_design_patterns WHERE business_type = $1 AND status = $2',
      [businessType, 'active']
    );
    
    if (result.rows.length > 0 && result.rows[0].business_images) {
      console.log(`✅ Found existing images for business type: ${businessType}`);
      const images = result.rows[0].business_images;
      return images.gallery ? images.gallery.slice(0, count) : [];
    }
    
    // 2. ⚡ NUOVO BUSINESS TYPE → SISTEMA DINAMICO AUTOMATICO
    if (attempt === 1) {
      console.log(`🔍 NEW BUSINESS TYPE "${businessType}" - Starting dynamic competitor analysis...`);
      
      // 2a. Chiama OpenAI per generare 5 competitor reali
      const competitorSites = await generateCompetitorSites(businessType);
      
      if (competitorSites && competitorSites.length > 0) {
        // 2b. Avvia training automatico con le funzioni esistenti
        const success = await triggerDynamicTraining(businessType, competitorSites);
        
        if (success) {
          // 2c. 🔄 RICORSIONE SICURA: Richiama per usare i nuovi dati
          console.log(`🔄 Recursive call to get newly generated data for: ${businessType}`);
          return await getBusinessImagesFromDB(businessType, count, attempt + 1);
        }
      }
    }
    
    // 3. Fallback se tutto fallisce o è il secondo tentativo
    console.log(`⚠️ Using stock fallback for: ${businessType} (attempt ${attempt})`);
    return generateFallbackStockImages(businessType, count);
    
  } catch (error) {
    console.log('⚠️ Database error, using fallback stock images:', error.message);
    return generateFallbackStockImages(businessType, count);
  }
}

// 🤖 Chiama OpenAI per generare competitor automaticamente
async function generateCompetitorSites(businessType) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API key not configured for competitor generation');
      return [];
    }
    
    const prompt = `Find 5 real competitor websites for a "${businessType}" business in Italy.
    
    Return ONLY a JSON array with this exact format:
    [
      {
        "name": "Nome Azienda",
        "url": "https://example.com",
        "description": "Breve descrizione del business"
      }
    ]
    
    Requirements:
    - Real, existing Italian websites only
    - Include local and national competitors  
    - Websites that likely use Unsplash or stock images
    - No major corporations with strict copyright
    - Focus on small to medium businesses`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
      temperature: 0.3
    });

    const sites = JSON.parse(completion.choices[0].message.content);
    console.log(`✅ Generated ${sites.length} competitor sites for ${businessType}`);
    return sites;
    
  } catch (error) {
    console.log('⚠️ OpenAI competitor generation failed:', error.message);
    return [];
  }
}

// 🚀 Trigger training usando l'endpoint esistente /api/training/start
async function triggerDynamicTraining(businessType, competitorSites) {
  try {
    console.log(`🚀 Starting dynamic training for ${businessType} with ${competitorSites.length} sites`);
    
    // Costruisce il payload per l'endpoint esistente
    const trainingPayload = {
      businessType: businessType,
      sites: competitorSites.map(site => site.url), // Array di URL come si aspetta l'endpoint
      autoGenerated: true,
      extractOptions: {
        images: true,
        colors: true, 
        layouts: true,
        onlyStockImages: true, // 🔒 SOLO IMMAGINI COPYRIGHT-FREE
        maxSites: 5
      }
    };
    
    // Chiama l'endpoint di training esistente tramite HTTP interno
    const response = await fetch(`http://localhost:${process.env.PORT || 4000}/api/training/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_TRAINER_API_KEY}`,
        'User-Agent': 'AI-Trainer-Internal'
      },
      body: JSON.stringify(trainingPayload)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Training started for ${businessType}:`, result.sessionId || 'no-session-id');
      
      // Attendi il completamento del training
      return await waitForTrainingCompletion(businessType, result.sessionId);
    } else {
      const errorText = await response.text();
      console.log(`❌ Training failed for ${businessType}:`, response.status, errorText);
      return false;
    }
    
  } catch (error) {
    console.log('⚠️ Dynamic training trigger failed:', error.message);
    return false;
  }
}

// ⏰ Attende completamento training e verifica salvataggio nel DB
async function waitForTrainingCompletion(businessType, sessionId, maxWait = 120000) {
  const startTime = Date.now();
  const checkInterval = 15000; // 15 secondi
  
  console.log(`⏰ Waiting for training completion for ${businessType}... (max ${maxWait/1000}s)`);
  
  while (Date.now() - startTime < maxWait) {
    try {
      // Controlla se i dati sono stati salvati nel database
      const storage = new DatabaseStorage();
      const result = await storage.query(
        'SELECT business_images, pattern_data FROM ai_design_patterns WHERE business_type = $1 AND status = $2',
        [businessType, 'active']
      );
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        const images = row.business_images;
        const patterns = row.pattern_data;
        
        // Verifica che abbia dati validi
        if (images && images.gallery && images.gallery.length > 0) {
          console.log(`✅ Training completed successfully for ${businessType}`);
          console.log(`📸 Extracted ${images.gallery.length} copyright-free images`);
          console.log(`🎨 Extracted design patterns:`, patterns ? Object.keys(patterns).length : 0);
          return true;
        }
      }
      
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`⏰ Still training ${businessType}... (${elapsed}s elapsed)`);
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      
    } catch (error) {
      console.log('⚠️ Error checking training progress:', error.message);
    }
  }
  
  console.log(`⚠️ Training timeout for ${businessType} after ${maxWait/1000}s`);
  return false;
}

// 🎨 Genera immagini stock sicure per settore specifico
async function generateStockImagesForBusiness(businessType) {
  // 🔍 Mapping intelligente settore → parole chiave Unsplash
  const sectorKeywords = {
    restaurant: ['restaurant', 'food', 'dining', 'chef'],
    ecommerce: ['shopping', 'products', 'retail', 'store'],
    technology: ['technology', 'computer', 'office', 'innovation'],
    fashion: ['fashion', 'clothing', 'style', 'boutique'],
    dentist: ['dental', 'medical', 'healthcare', 'clinic'],
    gym: ['fitness', 'workout', 'gym', 'health'],
    bakery: ['bakery', 'bread', 'pastry', 'oven'],
    lawyer: ['law', 'justice', 'legal', 'office'],
    beauty: ['beauty', 'salon', 'spa', 'wellness'],
    automotive: ['car', 'automotive', 'garage', 'repair'],
    real_estate: ['house', 'property', 'real-estate', 'home'],
    photography: ['camera', 'photography', 'studio', 'portrait'],
    consulting: ['business', 'meeting', 'consulting', 'office'],
    education: ['education', 'school', 'learning', 'classroom'],
    default: ['business', 'professional', 'modern', 'clean']
  };
  
  const keywords = sectorKeywords[businessType] || sectorKeywords.default;
  
  // ✅ Generate Unsplash URLs (copyright-free)
  const businessImages = {
    hero: `https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=1200&h=600&fit=crop&crop=center&q=${keywords[0]}`,
    logo: `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=100&fit=crop&crop=center&q=${keywords[1]}`,
    gallery: keywords.map((keyword, index) => 
      `https://images.unsplash.com/photo-${getUnsplashPhotoId(keyword, index)}?w=800&h=600&fit=crop&crop=center`
    )
  };
  
  return businessImages;
}

// 🎯 Mappa settori specifici a foto Unsplash verificate
function getUnsplashPhotoId(keyword, index) {
  const stockPhotos = {
    restaurant: ['1517248135467-4c7edcad34c4', '1565299624946-b28f40a0ca4b', '1546069901-ba9599a7e63c', '1414235077428-338989a2e8c0'],
    food: ['1546069901-ba9599a7e63c', '1565299624946-b28f40a0ca4b', '1504674900247-0877df9cc836', '1559339352-11d035aa65de'],
    technology: ['1460925895917-afdab827c52f', '1552581234-26160f608093', '1518709268805-4e9042af2176', '1504384308090-c894fdcc538d'],
    shopping: ['1441986300917-64674bd600d8', '1472851294608-062f824d29cc', '1441984904996-e0b6ba687e04', '1556742049-0cfed4f6a45d'],
    medical: ['1559757148-5c350d0d3c56', '1576091160399-112ba8d25d1f', '1582750433449-648ed127bb54', '1559757175-5c350d0d3c56'],
    fitness: ['1571019613454-1cb2f99b2d8b', '1534438327276-14e5300c3a48', '1571019614242-c5c5dee9f50b', '1544367567-0f2fcb009e0b'],
    business: ['1497032628192-86f99bcd76bc', '1552581234-26160f608093', '1507003211169-0a1dd7228f2d', '1554224155-6726b3ff858f'],
    default: ['1497032628192-86f99bcd76bc', '1552581234-26160f608093', '1507003211169-0a1dd7228f2d', '1554224155-6726b3ff858f']
  };
  
  const photos = stockPhotos[keyword] || stockPhotos.default;
  return photos[index % photos.length];
}

// 💾 Salva immagini nel database
async function saveBusinessImages(businessType, businessImages) {
  try {
    const storage = new DatabaseStorage();
    await storage.initialize(); // ✅ INIZIALIZZA IL DATABASE
    
    console.log(`💾 Saving business images for: ${businessType}`);
    
    await storage.query(`
      INSERT INTO ai_design_patterns (business_type, pattern_data, business_images, confidence_score, source)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (business_type) 
      DO UPDATE SET 
        business_images = $3,
        confidence_score = $4,
        updated_at = CURRENT_TIMESTAMP
    `, [
      businessType,
      {}, // pattern_data placeholder
      businessImages,
      85, // confidence score for stock images
      'ai-stock-generated'
    ]);
    
    console.log(`✅ Saved stock images for business type: ${businessType}`);
  } catch (error) {
    console.log('⚠️ Failed to save business images:', error.message);
  }
}

// 🔄 Fallback immagini stock sicure
function generateFallbackStockImages(businessType, count = 4) {
  const fallbackImages = [
    'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552581234-26160f608093?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop'
  ];
  
  return fallbackImages.slice(0, count);
}

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
    
    // 🤖 Try to generate content with OpenAI first
    console.log('🤖 Attempting AI content generation...');
    const aiContent = await generateBusinessContentWithAI(englishBusinessType, businessName);
    
    // 🖼️ Generate gallery images from database (stock images only)
    const galleryImages = await getBusinessImagesFromDB(englishBusinessType, 6);
    
    // 🎨 Initialize Design Intelligence
    const designIntelligence = new DesignIntelligence();
    let designData;
    
    try {
      designData = await designIntelligence.generateDesignForBusiness(englishBusinessType, style);
      console.log('✅ Design Intelligence generated:', {
        colors: designData.colors,
        typography: designData.typography?.primary,
        confidence: designData.confidence
      });
    } catch (designError) {
      console.log('⚠️ Design Intelligence fallback:', designError.message);
      designData = {
        colors: { primary: '#3B82F6', secondary: '#10B981', accent: '#F59E0B' },
        typography: { primary: 'Inter', secondary: 'system-ui' },
        confidence: 70
      };
    }
    
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

    // Genera blocchi semantici ottimizzati con contenuto AI
    const semanticBlocks = generateEnhancedBlocks(
      englishBusinessType, 
      businessName, 
      designRecommendation.design,
      currentBlocks,
      aiContent,
      galleryImages
    );
    
    const response = {
      success: true,
      source: 'ai-design-intelligence',
      layoutData: {
        blocks: semanticBlocks,
        design: designRecommendation.design,
        layout: layoutSuggestions,
        // 🎨 NEW: Include complete CSS for injection
        css: designRecommendation.design.css ? {
          variables: designRecommendation.design.css.rootVariables,
          typography: designRecommendation.design.css.typography,
          components: designRecommendation.design.css.components,
          utilities: designRecommendation.design.css.utilities,
          combined: [
            designRecommendation.design.css.rootVariables,
            designRecommendation.design.css.typography,
            designRecommendation.design.css.components,
            designRecommendation.design.css.utilities
          ].join('\n\n')
        } : null,
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
function generateEnhancedBlocks(businessType, businessName, designData, currentBlocks = [], aiContent = null, galleryImages = []) {
  console.log(`🧠 Generating enhanced blocks for ${businessType} with AI design data${aiContent ? ' and AI content' : ''}`);
  
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

  // 🎨 NEW: Generate complete CSS styles for each block based on design intelligence
  const generateBlockStyles = (blockType, designData) => {
    const colors = designData?.colors || {};
    const typography = designData?.typography || {};
    const css = designData?.css || {};
    
    const baseStyles = {
      backgroundColor: colors.background || '#FFFFFF',
      color: colors.text || '#1F2937',
      fontFamily: typography.primary || 'Inter, sans-serif',
      fontSize: '16px',
      lineHeight: '1.6'
    };

    // Block-specific style overrides
    const blockSpecificStyles = {
      'navigation-modern': {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${colors.accent || '#E5E7EB'}`,
        padding: '1rem 0',
        position: 'sticky',
        top: '0',
        zIndex: '1000'
      },
      'hero-restaurant-showcase': {
        background: colors.primary ? 
          `linear-gradient(135deg, ${colors.primary}, ${colors.secondary || colors.primary})` :
          'linear-gradient(135deg, #D97706, #DC2626)',
        color: '#FFFFFF',
        padding: '5rem 2rem',
        textAlign: 'center',
        borderRadius: '12px',
        marginBottom: '2rem'
      },
      'menu-showcase': {
        backgroundColor: colors.background || '#FFFFFF',
        border: `1px solid ${colors.accent || '#E5E7EB'}`,
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      },
      'gallery-food': {
        backgroundColor: colors.background || '#FFFFFF',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      },
      'reviews-customers': {
        backgroundColor: colors.background || '#F9FAFB',
        border: `1px solid ${colors.accent || '#E5E7EB'}`,
        borderRadius: '12px',
        padding: '2rem'
      }
    };

    return {
      ...baseStyles,
      ...(blockSpecificStyles[blockType] || {}),
      // Add CSS custom properties for dynamic styling
      '--primary-color': colors.primary || '#3B82F6',
      '--secondary-color': colors.secondary || '#8B5CF6',
      '--accent-color': colors.accent || '#F59E0B',
      '--font-primary': typography.primary || 'Inter',
      '--font-secondary': typography.secondary || 'system-ui'
    };
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
    style: generateBlockStyles('navigation-modern', designData),
    cssClass: 'ai-navigation-modern',
    aiEnhanced: true,
    confidence: 95
  });
  
  // 2. Hero Section (personalizzata per business type con immagine e contenuto AI)
  const heroContent = aiContent?.hero ? {
    title: aiContent.hero.title || `Benvenuto in ${businessName}`,
    subtitle: aiContent.hero.subtitle || getBusinessSubtitle(businessType, businessName),
    description: aiContent.hero.description || getBusinessDescription(businessType),
    image: getWorkingImage('hero', businessType),
    cta: aiContent.hero.cta || getBusinessCTA(businessType)
  } : {
    title: `Benvenuto in ${businessName}`,
    subtitle: getBusinessSubtitle(businessType, businessName),
    description: getBusinessDescription(businessType),
    image: getWorkingImage('hero', businessType),
    cta: getBusinessCTA(businessType)
  };

  blocks.push({
    id: `hero-${Date.now()}`,
    type: getOptimalHeroType(businessType),
    content: heroContent,
    style: generateBlockStyles('hero-restaurant-showcase', designData),
    cssClass: 'ai-hero-section',
    aiEnhanced: true,
    confidence: 90
  });
  
  // 3. Content blocks basati sui pattern estratti con stili AI e contenuto personalizzato
  const contentBlocks = generateBusinessSpecificBlocks(businessType, businessName, designData, aiContent, galleryImages);
  
  // Apply AI styles to content blocks
  const styledContentBlocks = contentBlocks.map(block => ({
    ...block,
    style: generateBlockStyles(block.type, designData),
    cssClass: `ai-${block.type.replace('-', '_')}`,
    aiEnhanced: true
  }));
  
  blocks.push(...styledContentBlocks);
  
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

function generateBusinessSpecificBlocks(businessType, businessName, designData, aiContent = null, galleryImages = []) {
  // 🎨 ENHANCED: Generate structured content with working images and AI content
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

  // 🤖 Use AI content if available, otherwise fallback to static content
  const getContentWithAI = (blockType, fallbackContent) => {
    if (!aiContent) return fallbackContent;
    
    // Map AI content to specific blocks
    switch (blockType) {
      case 'menu-showcase':
        return {
          ...fallbackContent,
          title: aiContent.menu?.title || fallbackContent.title,
          subtitle: aiContent.menu?.subtitle || fallbackContent.subtitle,
          description: aiContent.menu?.description || fallbackContent.description,
          items: aiContent.menu?.items || []
        };
      case 'gallery-food':
      case 'gallery-tech':
      case 'gallery-products':
        return {
          ...fallbackContent,
          title: aiContent.gallery?.title || fallbackContent.title,
          subtitle: aiContent.gallery?.subtitle || fallbackContent.subtitle,
          description: aiContent.gallery?.description || fallbackContent.description,
          images: galleryImages.slice(0, 4),
          galleryItems: aiContent.gallery?.items || []
        };
      case 'reviews-customers':
      case 'testimonials-social':
        return {
          ...fallbackContent,
          title: aiContent.reviews?.title || fallbackContent.title,
          subtitle: aiContent.reviews?.subtitle || fallbackContent.subtitle,
          description: aiContent.reviews?.description || fallbackContent.description,
          testimonials: aiContent.reviews?.testimonials || []
        };
      default:
        return fallbackContent;
    }
  };

  const businessBlocks = {
    restaurant: [
      {
        type: 'menu-showcase',
        content: getContentWithAI('menu-showcase', {
          title: `Menu ${businessName}`,
          subtitle: 'I nostri piatti più amati dai clienti',
          description: 'Scopri la nostra selezione di specialità culinarie preparate con ingredienti freschi e di alta qualità.',
          image: getWorkingImage('menu-showcase'),
          cta: 'Guarda il Menu'
        }),
        priority: 1
      },
      {
        type: 'gallery-food',
        content: getContentWithAI('gallery-food', {
          title: 'Galleria Gastronomica',
          subtitle: 'Un viaggio visivo nei nostri sapori',
          description: 'Ogni piatto è una piccola opera d\'arte culinaria.',
          image: getWorkingImage('gallery-food'),
          images: galleryImages.slice(0, 4),
          cta: 'Vedi Tutte le Foto'
        }),
        priority: 2
      },
      {
        type: 'reviews-customers',
        content: getContentWithAI('reviews-customers', {
          title: 'Testimonianze',
          subtitle: 'Cosa dicono i nostri clienti',
          description: 'La soddisfazione dei nostri ospiti è la nostra priorità.',
          image: getWorkingImage('reviews-customers'),
          cta: 'Leggi Tutte le Recensioni'
        }),
        priority: 3
      }
    ],
    ecommerce: [
      {
        type: 'featured-products',
        content: getContentWithAI('featured-products', {
          title: `Prodotti in Evidenza - ${businessName}`,
          subtitle: 'I più venduti del mese',
          description: 'Scopri i prodotti che stanno conquistando i nostri clienti.',
          image: getWorkingImage('featured-products'),
          cta: 'Acquista Ora'
        }),
        priority: 1
      },
      {
        type: 'gallery-products',
        content: getContentWithAI('gallery-products', {
          title: 'Galleria Prodotti',
          subtitle: 'La nostra collezione',
          description: 'Esplora la varietà dei nostri prodotti di alta qualità.',
          image: getWorkingImage('categories-grid'),
          images: galleryImages.slice(0, 4),
          cta: 'Esplora Categorie'
        }),
        priority: 2
      },
      {
        type: 'testimonials-social',
        content: getContentWithAI('testimonials-social', {
          title: 'Recensioni Clienti',
          subtitle: 'Fiducia e qualità garantita',
          description: 'Migliaia di clienti soddisfatti che ci hanno scelto.',
          image: getWorkingImage('testimonials-social'),
          cta: 'Leggi le Recensioni'
        }),
        priority: 3
      }
    ],
    technology: [
      {
        type: 'features-tech',
        content: getContentWithAI('features-tech', {
          title: `Funzionalità ${businessName}`,
          subtitle: 'Tecnologia all\'avanguardia',
          description: 'Scopri le caratteristiche innovative che rendono unica la nostra soluzione.',
          image: getWorkingImage('features-tech'),
          cta: 'Scopri di Più'
        }),
        priority: 1
      },
      {
        type: 'gallery-tech',
        content: getContentWithAI('gallery-tech', {
          title: 'Progetti e Innovazioni',
          subtitle: 'Le nostre realizzazioni',
          description: 'Esplora i progetti che abbiamo sviluppato per i nostri clienti.',
          image: getWorkingImage('case-studies'),
          images: galleryImages.slice(0, 4),
          cta: 'Vedi Tutti i Progetti'
        }),
        priority: 2
      },
      {
        type: 'case-studies',
        content: getContentWithAI('case-studies', {
          title: 'Casi di Successo',
          subtitle: 'Risultati che parlano da soli',
          description: 'Scopri come abbiamo aiutato i nostri clienti a raggiungere i loro obiettivi.',
          image: getWorkingImage('case-studies'),
          cta: 'Leggi i Casi Studio'
        }),
        priority: 3
      }
    ]
  };
  
  const blocks = businessBlocks[businessType] || businessBlocks.technology;
  
  return blocks.map((block, index) => ({
    id: `${block.type}-${Date.now()}-${index}`,
    type: block.type,
    content: block.content,
    // Style will be applied by generateBlockStyles in the calling function
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
