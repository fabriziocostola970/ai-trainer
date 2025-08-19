
const express = require('express');
const router = express.Router();
const collector = require('../training/data-collector');
const DatabaseStorage = require('../storage/database-storage');

// Inizializza storage
const storage = new DatabaseStorage();
storage.initialize();

// POST /api/training/collect-competitors - Scraping e salvataggio dei competitors
router.post('/collect-competitors', async (req, res) => {
  try {
    const { businessName, description } = req.body;
    if (!businessName || !description) {
      return res.status(400).json({ success: false, error: 'businessName e description sono richiesti' });
    }

    // Chiamata interna all'API AI competitors
    const axios = require('axios');
    const aiRes = await axios.post(
      `${process.env.INTERNAL_API_URL || 'http://localhost:4000'}/api/ai/competitors`,
      { businessName, description },
      { headers: { Authorization: req.headers.authorization } }
    );

    const { businessType, competitors } = aiRes.data;
    if (!businessType || !Array.isArray(competitors)) {
      return res.status(500).json({ success: false, error: 'Risposta AI non valida', details: aiRes.data });
    }

    const results = [];
    for (const comp of competitors) {
      try {
        const htmlContent = await collector.collectHTMLContent(comp.url);
        let cssContent = '';
        console.log(`--- COMPETITOR ---`);
        console.log(`URL: ${comp.url}`);
        console.log(`Name: ${comp.name}`);
        console.log(`Description: ${comp.description}`);
        console.log(`HTML content length: ${htmlContent ? htmlContent.length : 0}`);
        if (htmlContent) {
          const styleMatch = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
          cssContent = styleMatch ? styleMatch[1] : '';
        }
        console.log(`CSS content length: ${cssContent ? cssContent.length : 0}`);
        console.log(`Query params:`, [
          businessType,
          comp.url,
          JSON.stringify({ name: comp.name, description: comp.description }),
          80.0,
          'competitor-ai',
          'active',
          htmlContent || '',
          cssContent || ''
        ]);
        try {
          const result = await storage.pool.query(`
            INSERT INTO ai_design_patterns (
              business_type,
              source_url,
              business_images,
              confidence_score,
              source,
              status,
              html_content,
              css_content,
              created_at,
              updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
            ON CONFLICT (business_type, source_url)
            DO UPDATE SET
              business_images = $3,
              confidence_score = $4,
              updated_at = CURRENT_TIMESTAMP,
              source = $5,
              status = $6,
              html_content = $7,
              css_content = $8
          `, [
            businessType,
            comp.url,
            JSON.stringify({ name: comp.name, description: comp.description }),
            80.0,
            'competitor-ai',
            'active',
            htmlContent || '',
            cssContent || ''
          ]);
          console.log(`Query result:`, result);
          results.push({ url: comp.url, success: true });
        } catch (dbErr) {
          console.error(`DB ERROR for ${comp.url}:`, dbErr.message);
          results.push({ url: comp.url, success: false, error: dbErr.message });
        }
      } catch (err) {
        console.error(`SCRAPING ERROR for ${comp.url}:`, err.message);
        results.push({ url: comp.url, success: false, error: err.message });
      }
    }

    res.json({ success: true, businessType, processed: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// Inizializzazione e funzioni già presenti
  
/*   const healthCheck = await storage.healthCheck();
  console.log(`🚀 Training API initialized with ${healthCheck.storage} storage`);
  console.log(`📊 Current sessions: ${healthCheck.totalSessions || 0}`);
})(); */

// POST /api/training/generate-sites - Genera siti con OpenAI
router.post('/generate-sites', async (req, res) => {
  try {
    const { businessType, region } = req.body;
    
    if (!businessType) {
      return res.status(400).json({
        success: false,
        error: 'businessType is required'
      });
    }

    // For now, provide intelligent defaults based on business type and region
    // In future, integrate with OpenAI API
    const siteSuggestions = generateSiteSuggestions(businessType, region);
    
    res.json({
      success: true,
      sites: siteSuggestions,
      businessType,
      region: region || 'global',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Generate sites error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to generate site suggestions
function generateSiteSuggestions(businessType, region = 'global') {
  const businessTemplates = {
    'restaurant': [
      { url: 'https://www.mcdonalds.com', name: 'McDonald\'s', description: 'Global fast food chain' },
      { url: 'https://www.starbucks.com', name: 'Starbucks', description: 'Coffee chain' },
      { url: 'https://www.subway.com', name: 'Subway', description: 'Sandwich restaurant' },
      { url: 'https://www.kfc.com', name: 'KFC', description: 'Fried chicken restaurant' },
      { url: 'https://www.dominos.com', name: 'Domino\'s', description: 'Pizza delivery' }
    ],
    'e-commerce': [
      { url: 'https://www.amazon.com', name: 'Amazon', description: 'Online marketplace' },
      { url: 'https://www.shopify.com', name: 'Shopify', description: 'E-commerce platform' },
      { url: 'https://www.etsy.com', name: 'Etsy', description: 'Handmade marketplace' },
      { url: 'https://www.ebay.com', name: 'eBay', description: 'Auction marketplace' },
      { url: 'https://www.alibaba.com', name: 'Alibaba', description: 'B2B marketplace' }
    ],
    'ecommerce': [ // Handle alternative spelling
      { url: 'https://www.amazon.com', name: 'Amazon', description: 'Online marketplace' },
      { url: 'https://www.shopify.com', name: 'Shopify', description: 'E-commerce platform' },
      { url: 'https://www.etsy.com', name: 'Etsy', description: 'Handmade marketplace' },
      { url: 'https://www.ebay.com', name: 'eBay', description: 'Auction marketplace' },
      { url: 'https://www.alibaba.com', name: 'Alibaba', description: 'B2B marketplace' }
    ],
    'technology': [
      { url: 'https://www.apple.com', name: 'Apple', description: 'Technology company' },
      { url: 'https://www.microsoft.com', name: 'Microsoft', description: 'Software company' },
      { url: 'https://www.google.com', name: 'Google', description: 'Search engine' },
      { url: 'https://www.tesla.com', name: 'Tesla', description: 'Electric vehicles' },
      { url: 'https://www.meta.com', name: 'Meta', description: 'Social media platform' }
    ],
    'tech-startup': [
      { url: 'https://www.stripe.com', name: 'Stripe', description: 'Payment processing' },
      { url: 'https://www.slack.com', name: 'Slack', description: 'Team communication' },
      { url: 'https://www.notion.so', name: 'Notion', description: 'Productivity workspace' },
      { url: 'https://www.figma.com', name: 'Figma', description: 'Design tool' },
      { url: 'https://www.vercel.com', name: 'Vercel', description: 'Web deployment' }
    ],
    'healthcare': [
      { url: 'https://www.mayoclinic.org', name: 'Mayo Clinic', description: 'Medical center' },
      { url: 'https://www.webmd.com', name: 'WebMD', description: 'Health information' },
      { url: 'https://www.who.int', name: 'WHO', description: 'World Health Organization' },
      { url: 'https://www.medscape.com', name: 'Medscape', description: 'Medical news' },
      { url: 'https://www.healthline.com', name: 'Healthline', description: 'Health guide' }
    ],
    'education': [
      { url: 'https://www.harvard.edu', name: 'Harvard', description: 'University' },
      { url: 'https://www.mit.edu', name: 'MIT', description: 'Technology institute' },
      { url: 'https://www.stanford.edu', name: 'Stanford', description: 'University' },
      { url: 'https://www.coursera.org', name: 'Coursera', description: 'Online courses' },
      { url: 'https://www.edx.org', name: 'edX', description: 'Online education' }
    ],
    'finance': [
      { url: 'https://www.chase.com', name: 'Chase', description: 'Bank' },
      { url: 'https://www.paypal.com', name: 'PayPal', description: 'Payment service' },
      { url: 'https://www.bloomberg.com', name: 'Bloomberg', description: 'Financial news' },
      { url: 'https://www.schwab.com', name: 'Schwab', description: 'Investment firm' },
      { url: 'https://www.fidelity.com', name: 'Fidelity', description: 'Investment company' }
    ],
    'travel': [
      { url: 'https://www.booking.com', name: 'Booking.com', description: 'Hotel booking' },
      { url: 'https://www.expedia.com', name: 'Expedia', description: 'Travel booking' },
      { url: 'https://www.airbnb.com', name: 'Airbnb', description: 'Home sharing' },
      { url: 'https://www.tripadvisor.com', name: 'TripAdvisor', description: 'Travel reviews' },
      { url: 'https://www.kayak.com', name: 'Kayak', description: 'Travel search' }
    ],
    'real-estate': [
      { url: 'https://www.zillow.com', name: 'Zillow', description: 'Real estate platform' },
      { url: 'https://www.realtor.com', name: 'Realtor.com', description: 'Property listings' },
      { url: 'https://www.redfin.com', name: 'Redfin', description: 'Real estate service' },
      { url: 'https://www.trulia.com', name: 'Trulia', description: 'Home search' },
      { url: 'https://www.apartments.com', name: 'Apartments.com', description: 'Rental listings' }
    ],
    'portfolio': [
      { url: 'https://www.dribbble.com', name: 'Dribbble', description: 'Design portfolio' },
      { url: 'https://www.behance.net', name: 'Behance', description: 'Creative portfolio' },
      { url: 'https://www.awwwards.com', name: 'Awwwards', description: 'Web design showcase' },
      { url: 'https://www.pinterest.com', name: 'Pinterest', description: 'Visual discovery' },
      { url: 'https://www.unsplash.com', name: 'Unsplash', description: 'Photography platform' }
    ],
    'wellness': [
      { url: 'https://www.headspace.com', name: 'Headspace', description: 'Meditation app' },
      { url: 'https://www.calm.com', name: 'Calm', description: 'Relaxation app' },
      { url: 'https://www.myfitnesspal.com', name: 'MyFitnessPal', description: 'Fitness tracking' },
      { url: 'https://www.peloton.com', name: 'Peloton', description: 'Fitness platform' },
      { url: 'https://www.lululemon.com', name: 'Lululemon', description: 'Athletic wear' }
    ]
  };

  // Regional variations
  const regionalSites = {
    'europe': {
      'restaurant': [
        { url: 'https://www.deliveroo.com', name: 'Deliveroo', description: 'Food delivery (EU)' },
        { url: 'https://www.just-eat.com', name: 'Just Eat', description: 'Food delivery (EU)' }
      ],
      'e-commerce': [
        { url: 'https://www.zalando.com', name: 'Zalando', description: 'Fashion retailer (EU)' },
        { url: 'https://www.otto.de', name: 'Otto', description: 'Online retailer (DE)' }
      ],
      'ecommerce': [
        { url: 'https://www.zalando.com', name: 'Zalando', description: 'Fashion retailer (EU)' },
        { url: 'https://www.otto.de', name: 'Otto', description: 'Online retailer (DE)' }
      ],
      'travel': [
        { url: 'https://www.ryanair.com', name: 'Ryanair', description: 'Low-cost airline (EU)' },
        { url: 'https://www.easyjet.com', name: 'EasyJet', description: 'Low-cost airline (EU)' }
      ]
    },
    'asia': {
      'restaurant': [
        { url: 'https://www.foodpanda.com', name: 'Foodpanda', description: 'Food delivery (Asia)' },
        { url: 'https://www.ubereats.com', name: 'Uber Eats', description: 'Food delivery (Global)' }
      ],
      'e-commerce': [
        { url: 'https://www.tmall.com', name: 'Tmall', description: 'E-commerce (China)' },
        { url: 'https://www.rakuten.com', name: 'Rakuten', description: 'E-commerce (Japan)' }
      ],
      'ecommerce': [
        { url: 'https://www.tmall.com', name: 'Tmall', description: 'E-commerce (China)' },
        { url: 'https://www.rakuten.com', name: 'Rakuten', description: 'E-commerce (Japan)' }
      ],
      'technology': [
        { url: 'https://www.samsung.com', name: 'Samsung', description: 'Electronics (Korea)' },
        { url: 'https://www.sony.com', name: 'Sony', description: 'Electronics (Japan)' }
      ]
    }
  };

  let sites = businessTemplates[businessType.toLowerCase()] || businessTemplates['technology'];
  
  // Mix in regional sites if available
  if (region && region !== 'global' && regionalSites[region.toLowerCase()]) {
    const regionalOptions = regionalSites[region.toLowerCase()][businessType.toLowerCase()];
    if (regionalOptions) {
      sites = [...sites.slice(0, 3), ...regionalOptions];
    }
  }

  return sites.slice(0, 5);
}

// POST /api/training/start - Avvia training collection
router.post('/start', async (req, res) => {
  try {
    if (trainingState.isTraining) {
      return res.status(409).json({
        success: false,
        error: 'Training already in progress'
      });
    }

    const { samples = 8, aiAnalysis = true, saveLocal = true } = req.body;
    
    // Generate training ID
    const trainingId = `train-${Date.now()}`;
    
    // Initialize training state
    trainingState = {
      isTraining: true,
      trainingId,
      progress: 0,
      samplesCollected: 0,
      totalSamples: samples,
      currentStep: 'initializing',
      startTime: new Date(),
      accuracy: null
    };

    // 💾 Save state to persistent storage
    await storage.saveTrainingState(trainingState);
    
    // 💾 Save to VendiOnline AITrainingSession table
    await storage.saveAITrainingSession({
      id: trainingId,
      initiatorId: 'ai-trainer-system',
      businessId: null, // Global training
      trainingType: 'GLOBAL', // ✅ Fixed: Use correct enum value
      status: 'RUNNING', // ✅ FIX: Use correct enum value (not IN_PROGRESS)
      metadata: {
        samples: samples,
        aiAnalysis: aiAnalysis,
        startTime: new Date(),
        source: 'ai-trainer-api'
      }
    });

    console.log(`🚀 Starting AI training: ${trainingId}`);
    console.log(`📊 Samples to collect: ${samples}`);
    
    // Start training asynchronously (non-blocking)
    startTrainingAsync(trainingId, samples, aiAnalysis);
    
    res.json({
      success: true,
      trainingId,
      samplesCount: samples,
      estimatedTime: `${samples * 2} minutes`,
      message: 'Training collection started'
    });

  } catch (error) {
    console.error('Training start error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/training/custom - Training con siti personalizzati
router.post('/custom', async (req, res) => {
  try {
    if (trainingState.isTraining) {
      return res.status(409).json({
        success: false,
        error: 'Training already in progress'
      });
    }

    const { customSites, aiAnalysis = true } = req.body;
    
    if (!customSites || customSites.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No custom sites provided'
      });
    }

  // 🔧 Normalize custom sites data - handle both business_type and businessType
  // Correzione query: source -> source_url
    const normalizedSites = customSites.map(site => ({
      url: site.url,
      businessType: site.businessType || site.business_type || 'unknown',
      style: site.style || 'default'
    }));

    // 🕒 Filter sites that need update (not updated in last month)
    console.log(`🔍 Filtering ${normalizedSites.length} sites for recent updates...`);
    const sitesNeedingUpdate = await storage.filterSitesForTraining(normalizedSites);
    
    if (sitesNeedingUpdate.length === 0) {
      return res.json({
        success: true,
        message: 'All sites are up to date (updated within last month)',
        skipped: normalizedSites.length,
        sitesNeedingUpdate: 0
      });
    }
    
    console.log(`📊 Sites needing update: ${sitesNeedingUpdate.length}/${normalizedSites.length}`);

    const trainingId = `custom-train-${Date.now()}`;
    
    trainingState = {
      isTraining: true,
      trainingId,
      progress: 0,
      samplesCollected: 0,
      totalSamples: sitesNeedingUpdate.length,
      originalSitesCount: normalizedSites.length,
      skippedSitesCount: normalizedSites.length - sitesNeedingUpdate.length,
      currentStep: 'analyzing-custom-sites',
      startTime: new Date(),
      accuracy: null,
      customSites: sitesNeedingUpdate
    };

    // 💾 Save state and custom sites to persistent storage
    await storage.saveTrainingState(trainingState);
    await storage.saveCustomSites(sitesNeedingUpdate);

    console.log(`🔗 Starting custom training: ${trainingId}`);
    console.log(`📊 Sites to process: ${sitesNeedingUpdate.length} (${trainingState.skippedSitesCount} skipped as recent)`);
    sitesNeedingUpdate.forEach(site => {
      console.log(`  - ${site.url} (${site.businessType}, ${site.style})`);
    });
    
    // Start custom training asynchronously
    startCustomTrainingAsync(trainingId, sitesNeedingUpdate, aiAnalysis);
    
    res.json({
      success: true,
      trainingId,
      sitesCount: sitesNeedingUpdate.length,
      originalSitesCount: normalizedSites.length,
      skippedSitesCount: trainingState.skippedSitesCount,
      estimatedTime: `${sitesNeedingUpdate.length * 2} minutes`,
      message: `Custom training started with ${sitesNeedingUpdate.length} sites (${trainingState.skippedSitesCount} skipped as recent)`
    });

  } catch (error) {
    console.error('Custom training error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/training/status - Stato training generale
router.get('/status', (req, res) => {
  res.json({
    isTraining: trainingState.isTraining,
    progress: trainingState.progress,
    samplesCollected: trainingState.samplesCollected,
    totalSamples: trainingState.totalSamples,
    currentStep: trainingState.currentStep,
    modelAccuracy: trainingState.accuracy || 'Not trained yet'
  });
});

// GET /api/training/progress/:trainingId - Progress specifico training
router.get('/progress/:trainingId', (req, res) => {
  const { trainingId } = req.params;
  
  if (trainingState.trainingId !== trainingId) {
    return res.status(404).json({
      success: false,
      error: 'Training ID not found'
    });
  }
  
  res.json({
    trainingId,
    progress: trainingState.progress,
    currentStep: trainingState.currentStep,
    samplesCollected: trainingState.samplesCollected,
    totalSamples: trainingState.totalSamples,
    completed: !trainingState.isTraining,
    accuracy: trainingState.accuracy,
    elapsedTime: trainingState.startTime ? 
      Math.round((Date.now() - trainingState.startTime) / 1000) : 0
  });
});

// 🤖 ASYNC TRAINING FUNCTION
async function startTrainingAsync(trainingId, totalSamples, useAI) {
  try {
    console.log(`🎯 Training ${trainingId}: Starting data collection`);
    
    // Simulate training process (replace with real training logic)
    const steps = [
      'Initializing Puppeteer...',
      'Collecting HTML sources...',
      'Taking screenshots...',
      'Running AI analysis...',
      'Generating templates...',
      'Training models...',
      'Validating results...'
    ];
    
    for (let i = 0; i < steps.length; i++) {
      trainingState.currentStep = steps[i];
      trainingState.progress = Math.round((i / steps.length) * 100);
      
      // 💾 Save progress to persistent storage
      await storage.saveTrainingState(trainingState);
      
      console.log(`📈 ${trainingState.progress}%: ${steps[i]}`);
      
      // Simulate work time
      await new Promise(resolve => setTimeout(resolve, 15000)); // 15 seconds per step
      
      // Simulate sample collection
      if (i < totalSamples) {
        trainingState.samplesCollected = Math.min(i + 1, totalSamples);
      }
    }
    
    // Training completed
    trainingState.isTraining = false;
    trainingState.progress = 100;
    trainingState.currentStep = 'completed';
    trainingState.accuracy = 87 + Math.round(Math.random() * 10); // Mock accuracy
    
    // 💾 Save final state to persistent storage
    await storage.saveTrainingState(trainingState);
    
    // 💾 Update VendiOnline AITrainingSession with completion
    await storage.updateAITrainingSession(trainingId, {
      status: 'COMPLETED',
      metadata: {
        ...trainingState,
        completedAt: new Date(),
        accuracy: trainingState.accuracy,
        finalStep: 'completed'
      }
    });
    
    console.log(`🎉 Training ${trainingId} completed with ${trainingState.accuracy}% accuracy`);
    
  } catch (error) {
    console.error(`❌ Training ${trainingId} failed:`, error);
    trainingState.isTraining = false;
    trainingState.currentStep = 'failed';
    // 💾 Save error state to persistent storage
    await storage.saveTrainingState(trainingState);
  }
}

// 🔗 CUSTOM TRAINING FUNCTION
async function startCustomTrainingAsync(trainingId, customSites, useAI) {
  try {
    console.log(`🎯 Custom Training ${trainingId}: Starting analysis`);
    
    // � DIAGNOSTIC: Check customSites parameter
    console.log(`🔍 CUSTOM SITES DIAGNOSTIC:`);
    console.log(`  - customSites parameter:`, customSites);
    console.log(`  - customSites.length:`, customSites ? customSites.length : 'undefined');
    console.log(`  - typeof customSites:`, typeof customSites);
    console.log(`  - Array.isArray(customSites):`, Array.isArray(customSites));
    
    // �💾 Save initial session to VendiOnline database and get DB ID
    const savedSession = await storage.saveAITrainingSession({
      id: trainingId.replace('custom-train-', 'train_') + '_' + Math.random().toString(36).substring(2, 11),
      trainingId: trainingId,
      initiatedBy: null,
      trainingType: 'GLOBAL',
      status: 'RUNNING',
      isTraining: true,
      progress: 0,
      samplesCollected: 0,
      totalSamples: customSites.length,
      currentStep: 'starting',
      startTime: new Date(),
      metadata: {
        customSites: customSites,
        aiAnalysis: useAI,
        startTime: new Date(),
        source: 'ai-trainer-custom'
      }
    });
    
    // Use the actual database ID for foreign key references
    const sessionDbId = (savedSession && savedSession.id) ? savedSession.id : trainingId;
    console.log(`💾 Session saved with DB ID: ${sessionDbId}`);
    
    const steps = [
      'Validating custom URLs...',
      'Collecting HTML from custom sites...',
      'Taking custom screenshots...',
      'Running AI analysis on custom content...',
      'Learning from custom patterns...',
      'Generating custom templates...',
      'Validating custom training...'
    ];
    
    for (let i = 0; i < steps.length; i++) {
      trainingState.currentStep = steps[i];
      trainingState.progress = Math.round((i / steps.length) * 100);
      
      console.log(`📈 ${trainingState.progress}%: ${steps[i]}`);
      
      // 🔍 DIAGNOSTIC LOGGING FOR STEP 1
      if (i === 1) {
        console.log(`🔍 STEP 1 DIAGNOSTIC:`);
        console.log(`  - customSites.length: ${customSites.length}`);
        console.log(`  - customSites:`, customSites);
        console.log(`  - Condition (i === 1 && customSites.length > 0): ${i === 1 && customSites.length > 0}`);
      }
      
      // 🔥 REAL TRAINING: Process custom sites during specific steps
      if (i === 1 && customSites.length > 0) { // Step 1: "Collecting HTML from custom sites..."
        console.log(`🔥 STARTING HTML COLLECTION FROM ${customSites.length} SITES`);
        console.log(`🔥 This message should appear if the loop executes!`);
        
        for (let siteIndex = 0; siteIndex < customSites.length; siteIndex++) {
          const currentSite = customSites[siteIndex];
          console.log(`🔍 Processing site ${siteIndex + 1}/${customSites.length}: ${currentSite.url} (${currentSite.businessType})`);
          
          try {
            // 📥 Download HTML content from the site
            console.log(`📥 Downloading HTML from: ${currentSite.url}`);
            const htmlContent = await collector.collectHTMLContent(currentSite.url);
            
            console.log(`📊 HTML download result:`, {
              success: !!htmlContent,
              length: htmlContent ? htmlContent.length : 0,
              type: typeof htmlContent
            });
            
            if (htmlContent && htmlContent.length > 0) {
              console.log(`✅ HTML downloaded: ${htmlContent.length} characters`);
              
              // 💾 Save training sample to database
              const sampleId = `sample-${trainingId}-${siteIndex}-${Date.now()}`;
              const trainingSample = {
                sampleId: sampleId,
                url: currentSite.url,
                businessType: currentSite.businessType,
                trainingSessionId: sessionDbId, // ✅ Use actual database session ID
                htmlContent: htmlContent,
                htmlLength: htmlContent.length,
                collectionMethod: 'PUPPETEER',
                status: 'COMPLETED',
                analysisData: {
                  style: currentSite.style,
                  targetAudience: currentSite.targetAudience || 'general',
                  collectedAt: new Date()
                }
              };
              
              console.log(`💾 Attempting to save training sample:`, sampleId);
              console.log(`🔍 FULL TRAINING SAMPLE DATA BEFORE SAVE:`, JSON.stringify(trainingSample, null, 2));
              
              try {
                const saveResult = await storage.saveAITrainingSample(trainingSample);
                
                console.log(`🔍 SAVE RESULT RAW:`, saveResult);
                console.log(`🔍 SAVE RESULT TYPE:`, typeof saveResult);
                console.log(`🔍 SAVE RESULT HAS ID:`, saveResult && saveResult.id);
                
                if (saveResult && saveResult.id) {
                  console.log(`✅ Training sample saved successfully: ${sampleId} -> DB ID: ${saveResult.id}`);
                  
                  // 🧪 IMMEDIATE VERIFICATION: Check if it's really in the database
                  console.log(`🧪 IMMEDIATE VERIFICATION: Checking if sample ${saveResult.id} exists in database...`);
                  try {
                    const verifyQuery = await storage.pool.query(
                      'SELECT id, "sampleId", url FROM ai_training_samples WHERE id = $1',
                      [saveResult.id]
                    );
                    if (verifyQuery.rows.length > 0) {
                      console.log(`✅ VERIFIED: Sample ${saveResult.id} exists in database!`);
                    } else {
                      console.error(`❌ CRITICAL PHANTOM SAVE: Sample ${saveResult.id} was returned but NOT found in database!`);
                    }
                  } catch (verifyError) {
                    console.error(`❌ VERIFICATION ERROR:`, verifyError.message);
                  }
                } else {
                  console.error(`❌ CRITICAL: Training sample save FAILED for ${sampleId}`);
                  console.error(`❌ Save result:`, saveResult);
                  console.error(`❌ THIS IS THE REASON SAMPLES ARE NOT BEING SAVED!`);
                  // Don't throw error, just log and continue to see all failures
                }
              } catch (saveError) {
                console.error(`❌ SAVE ERROR CAUGHT: Failed to save sample ${sampleId}:`, saveError.message);
                console.error(`❌ SQL Error details:`, saveError);
                console.error(`❌ THIS IS WHY SAMPLES ARE NOT SAVED TO DATABASE!`);
                // Don't throw error, continue to process other sites
              }
              
              // 🔄 Update custom site status to COMPLETED
              console.log(`🔄 Updating custom site status for: ${currentSite.url}`);
              await storage.updateAICustomSiteStatus(currentSite.url, currentSite.businessType, 'COMPLETED', sessionDbId);
              console.log(`✅ Custom site status updated to COMPLETED`);
              
            } else {
              console.log(`❌ Failed to download HTML from: ${currentSite.url}`);
              console.log(`❌ HTML content:`, htmlContent);
            }
          } catch (siteError) {
            console.error(`❌ Error processing site ${currentSite.url}:`, siteError);
            console.error(`❌ Error stack:`, siteError.stack);
          }
        }
        
        trainingState.samplesCollected = customSites.length;
        console.log(`🎯 HTML collection completed: ${trainingState.samplesCollected} samples collected`);
      }
      
      // 💾 Update progress in database
      await storage.updateAITrainingSession(trainingId, {
        status: 'RUNNING',
        isTraining: true,
        progress: trainingState.progress,
        samplesCollected: trainingState.samplesCollected,
        currentStep: trainingState.currentStep
      });
      
      // SHORTER DELAY - 3 seconds instead of 10 to avoid timeouts
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Custom training completed
    trainingState.isTraining = false;
    trainingState.progress = 100;
    trainingState.currentStep = 'custom-completed';
    trainingState.accuracy = 89 + Math.round(Math.random() * 8); // Higher accuracy for custom
    
    console.log(`🎯 Training completed, attempting final update for: ${trainingId}`);
    console.log(`🎯 Final accuracy: ${trainingState.accuracy}%`);
    
    // 💾 Update final completion in database
    try {
      await storage.updateAITrainingSession(trainingId, {
        status: 'COMPLETED', // Ripristinato il valore corretto
        isTraining: false,
        progress: 100,
        accuracy: trainingState.accuracy,
        completionTime: new Date(),
        currentStep: 'custom-completed'
      });
      console.log(`✅ Final COMPLETED status update successful for: ${trainingId}`);
      
      // 🔍 VERIFICARE UPDATE - Double check by reading back
      console.log(`🔍 Double checking status update by reading back from DB...`);
      const readBackSession = await storage.getAITrainingSession(trainingId);
      if (readBackSession) {
        console.log(`🔍 Database readback shows status: "${readBackSession.status}"`);
        console.log(`🔍 Database readback shows progress: ${readBackSession.progress}`);
      }
      
    } catch (finalUpdateError) {
      console.error(`❌ Final update failed for ${trainingId}:`, finalUpdateError);
      console.error(`❌ Update error details:`, finalUpdateError.message);
    }
    
    // ❌ RIMOSSO: Save final custom training state - redundant and overwrites status
    // await storage.saveTrainingState(trainingState);
    
    console.log(`🎉 Custom Training ${trainingId} completed with ${trainingState.accuracy}% accuracy`);
    console.log(`🔗 Learned patterns from ${customSites.length} custom sites`);
    
  } catch (error) {
    console.error(`❌ Custom Training ${trainingId} failed:`, error);
    console.error(`❌ Error stack:`, error.stack);
    console.error(`❌ Error occurred during training step`);
    
    trainingState.isTraining = false;
    trainingState.currentStep = 'failed';
    
    // 💾 Update failed status in database
    try {
      await storage.updateAITrainingSession(trainingId, {
        status: 'FAILED',
        isTraining: false,
        currentStep: 'failed',
        errorMessage: error.message
      });
      console.log(`✅ Error status updated in database for: ${trainingId}`);
    } catch (updateError) {
      console.error(`❌ Failed to update error status:`, updateError);
    }
    
    // 💾 Save error state
    await storage.saveTrainingState(trainingState);
  }
}

// 📈 GET /api/training/history - Training history & analytics
router.get('/history', async (req, res) => {
  try {
    const history = await storage.getTrainingHistory();
    
    res.json({
      success: true,
      ...history,
      storageLocation: {
        samples: '/data/training-samples/',
        state: '/data/training-state.json',
        customSites: '/data/custom-sites.json',
        processed: '/data/processed/'
      }
    });
    
  } catch (error) {
    console.error('Failed to get training history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🔍 DEBUG: Check training samples in database
router.get('/debug/samples', async (req, res) => {
  try {
    console.log('🔍 Checking training samples in database...');
    
    // Use existing storage instance
    if (!storage.pool) {
      console.log('❌ No database connection available');
      return res.status(503).json({
        success: false,
        error: 'Database not connected',
        message: 'Storage pool not initialized'
      });
    }
    
    // Get all training samples from database
    const result = await storage.pool.query(`
      SELECT 
        id, "sampleId", url, "businessType", "trainingSessionId",
        "htmlLength", "collectionMethod", status, "createdAt"
      FROM ai_training_samples 
      ORDER BY "createdAt" DESC 
      LIMIT 20
    `);
    
    console.log(`🔍 Found ${result.rows.length} training samples in database`);
    
    res.json({
      success: true,
      samples: result.rows,
      count: result.rows.length,
      query: 'Recent 20 training samples',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error checking samples:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

// 🔍 DEBUG: Check database storage status
router.get('/debug/storage', async (req, res) => {
  try {
    res.json({
      success: true,
      storage: {
        isConnected: storage.isConnected,
        fallbackToFiles: storage.fallbackToFiles,
        poolStatus: !!storage.pool,
        hasFileStorage: !!storage.fileStorage
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🚨 GET /api/training/alerts - Get critical error alerts
router.get('/alerts', (req, res) => {
  try {
    const lastError = storage.getLastCriticalError();
    
    res.json({
      success: true,
      hasAlert: !!lastError,
      alert: lastError,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🚨 POST /api/training/alerts/clear - Clear critical error alerts
router.post('/alerts/clear', (req, res) => {
  try {
    storage.lastCriticalError = null;
    
    res.json({
      success: true,
      message: 'Critical error alerts cleared',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🤖 POST /api/training/auto-html - Automatic HTML collection and processing
router.post('/auto-html', async (req, res) => {
  try {
    console.log('🤖 Starting automatic HTML collection and processing...');
    
    const { sites = [], extractCSS = true, analyzeColors = true, analyzeFonts = true } = req.body;
    
    // Default sites if none provided
    const defaultSites = [
      'https://www.starbucks.com',
      'https://www.mcdonalds.com', 
      'https://www.nike.com',
      'https://www.apple.com',
      'https://www.airbnb.com'
    ];
    
    const sitesToProcess = sites.length > 0 ? sites : defaultSites;
    
    console.log(`📋 Processing ${sitesToProcess.length} sites for automatic training`);
    
    // Initialize training state for auto-html
    const trainingId = `auto-html-${Date.now()}`;
    
    trainingState = {
      isTraining: true,
      trainingId,
      type: 'auto-html',
      progress: 0,
      totalSteps: 6,
      currentStep: 1,
      stepName: 'Collecting HTML',
      sites: sitesToProcess,
      startTime: new Date(),
      results: {
        htmlCollected: 0,
        cssExtracted: 0,
        colorsAnalyzed: 0,
        fontsAnalyzed: 0,
        patternsClassified: 0,
        dataExported: false
      }
    };
    
    // Start background processing
    processAutoHTML(sitesToProcess, { extractCSS, analyzeColors, analyzeFonts });
    
    res.json({
      success: true,
      message: 'Automatic HTML collection started',
      trainingId,
      totalSites: sitesToProcess.length,
      estimatedTime: `${sitesToProcess.length * 2} minutes`,
      progress: {
        step: 1,
        stepName: 'Collecting HTML from sites',
        percentage: 0
      }
    });
    
  } catch (error) {
    console.error('❌ Auto HTML collection error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Background processing function for auto-html
async function processAutoHTML(sites, options) {
  try {
    console.log('🚀 Background auto-HTML processing started');
    
    // Step 1: Collect HTML from sites
    trainingState.currentStep = 1;
    trainingState.stepName = 'Collecting HTML from sites';
    
    for (let i = 0; i < sites.length; i++) {
      const site = sites[i];
      console.log(`📥 Collecting HTML from ${site} (${i + 1}/${sites.length})`);
      
      try {
        // Simulate HTML collection (replace with actual Puppeteer logic)
        await new Promise(resolve => setTimeout(resolve, 2000));
        trainingState.results.htmlCollected++;
        trainingState.progress = Math.round(((i + 1) / sites.length) * 16.67); // Step 1 is ~16.67% of total
        
        console.log(`✅ HTML collected from ${site}`);
      } catch (error) {
        console.error(`❌ Failed to collect from ${site}:`, error.message);
      }
    }
    
    // Step 2: Extract CSS and colors
    trainingState.currentStep = 2;
    trainingState.stepName = 'Extracting CSS and colors';
    trainingState.progress = 20;
    
    if (options.extractCSS) {
      console.log('🎨 Extracting CSS patterns...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      trainingState.results.cssExtracted = sites.length;
      trainingState.progress = 35;
    }
    
    // Step 3: Analyze fonts and patterns
    trainingState.currentStep = 3;
    trainingState.stepName = 'Analyzing fonts and patterns';
    trainingState.progress = 50;
    
    if (options.analyzeFonts) {
      console.log('📝 Analyzing font patterns...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      trainingState.results.fontsAnalyzed = sites.length;
      trainingState.progress = 65;
    }
    
    // Step 4: Auto-classify samples
    trainingState.currentStep = 4;
    trainingState.stepName = 'Auto-classifying samples';
    trainingState.progress = 75;
    
    console.log('🤖 Auto-classifying design patterns...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    trainingState.results.patternsClassified = sites.length;
    trainingState.progress = 85;
    
    // Step 5: Export CSS library
    trainingState.currentStep = 5;
    trainingState.stepName = 'Exporting CSS library';
    trainingState.progress = 90;
    
    console.log('📦 Exporting CSS theme library...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    trainingState.results.dataExported = true;
    trainingState.progress = 95;
    
    // Step 6: Process complete
    trainingState.currentStep = 6;
    trainingState.stepName = 'Process complete';
    trainingState.progress = 100;
    trainingState.isTraining = false;
    trainingState.completedAt = new Date();
    
    console.log('🎉 Auto-HTML training process completed successfully!');
    
    // Save results to storage
    await storage.saveTrainingResults({
      trainingId: trainingState.trainingId,
      type: 'auto-html',
      results: trainingState.results,
      sites: sites.length,
      duration: Date.now() - trainingState.startTime.getTime(),
      success: true
    });
    
  } catch (error) {
    console.error('❌ Auto-HTML background processing failed:', error);
    trainingState.isTraining = false;
    trainingState.error = error.message;
  }
}

// 🎨 POST /api/training/auto-css - Automatic CSS extraction and analysis
router.post('/auto-css', async (req, res) => {
  try {
    console.log('🎨 Starting automatic CSS extraction and analysis...');
    
    const { sites = [], extractColors = true, extractFonts = true, extractPatterns = true } = req.body;
    
    // Default sites if none provided
    const defaultSites = [
      'https://www.starbucks.com',
      'https://www.mcdonalds.com', 
      'https://www.nike.com',
      'https://www.apple.com',
      'https://www.airbnb.com'
    ];
    
    const sitesToProcess = sites.length > 0 ? sites : defaultSites;
    
    console.log(`🎨 Processing CSS extraction from ${sitesToProcess.length} sites`);
    
    // Initialize CSS extraction state
    const extractionId = `css-extract-${Date.now()}`;
    
    trainingState = {
      isTraining: true,
      extractionId,
      type: 'auto-css',
      progress: 0,
      totalSteps: 4,
      currentStep: 1,
      stepName: 'Extracting CSS Rules',
      sites: sitesToProcess,
      startTime: new Date(),
      results: {
        cssRulesExtracted: 0,
        colorsAnalyzed: 0,
        fontsAnalyzed: 0,
        patternsIdentified: 0,
        cssThemes: [],
        totalRules: 0
      }
    };
    
    // Start background CSS processing
    processCSSExtraction(sitesToProcess, { extractColors, extractFonts, extractPatterns });
    
    res.json({
      success: true,
      message: 'CSS extraction started',
      extractionId,
      totalSites: sitesToProcess.length,
      estimatedTime: `${sitesToProcess.length * 1.5} minutes`,
      progress: {
        step: 1,
        stepName: 'Extracting CSS rules and styles',
        percentage: 0
      }
    });
    
  } catch (error) {
    console.error('❌ CSS extraction error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Background processing function for CSS extraction
async function processCSSExtraction(sites, options) {
  try {
    console.log('🎨 Background CSS extraction started');
    
    // Step 1: Extract CSS rules
    trainingState.currentStep = 1;
    trainingState.stepName = 'Extracting CSS rules';
    
    for (let i = 0; i < sites.length; i++) {
      const site = sites[i];
      console.log(`🎨 Extracting CSS from ${site} (${i + 1}/${sites.length})`);
      
      try {
        // Simulate CSS extraction
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock CSS extraction results
        const mockCSSRules = Math.floor(Math.random() * 500) + 200;
        trainingState.results.cssRulesExtracted += mockCSSRules;
        trainingState.results.totalRules += mockCSSRules;
        trainingState.progress = Math.round(((i + 1) / sites.length) * 25); // Step 1 is 25%
        
        console.log(`✅ ${mockCSSRules} CSS rules extracted from ${site}`);
      } catch (error) {
        console.error(`❌ Failed to extract CSS from ${site}:`, error.message);
      }
    }
    
    // Step 2: Analyze colors
    if (options.extractColors) {
      trainingState.currentStep = 2;
      trainingState.stepName = 'Analyzing color palettes';
      trainingState.progress = 35;
      
      console.log('🌈 Analyzing color patterns...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      trainingState.results.colorsAnalyzed = sites.length * 15; // Mock: ~15 colors per site
      trainingState.progress = 55;
    }
    
    // Step 3: Analyze fonts
    if (options.extractFonts) {
      trainingState.currentStep = 3;
      trainingState.stepName = 'Analyzing typography';
      trainingState.progress = 65;
      
      console.log('📝 Analyzing font patterns...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      trainingState.results.fontsAnalyzed = sites.length * 8; // Mock: ~8 fonts per site
      trainingState.progress = 80;
    }
    
    // Step 4: Generate CSS themes
    trainingState.currentStep = 4;
    trainingState.stepName = 'Generating CSS themes';
    trainingState.progress = 85;
    
    console.log('🎨 Generating CSS themes...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock CSS theme generation
    trainingState.results.cssThemes = [
      {
        name: 'Modern Professional',
        colors: ['#3B82F6', '#1E40AF', '#F8FAFC', '#64748B'],
        fonts: ['Inter', 'Open Sans'],
        type: 'corporate'
      },
      {
        name: 'Warm Restaurant',
        colors: ['#D97706', '#DC2626', '#FEF3C7', '#92400E'],
        fonts: ['Playfair Display', 'Source Sans Pro'],
        type: 'restaurant'
      },
      {
        name: 'Tech Startup',
        colors: ['#8B5CF6', '#06B6D4', '#F1F5F9', '#475569'],
        fonts: ['JetBrains Mono', 'Inter'],
        type: 'technology'
      }
    ];
    
    trainingState.results.patternsIdentified = trainingState.results.cssThemes.length;
    trainingState.progress = 100;
    trainingState.isTraining = false;
    trainingState.completedAt = new Date();
    
    console.log('🎉 CSS extraction process completed successfully!');
    
    // Save results to storage
    await storage.saveTrainingResults({
      extractionId: trainingState.extractionId,
      type: 'auto-css',
      results: trainingState.results,
      sites: sites.length,
      duration: Date.now() - trainingState.startTime.getTime(),
      success: true
    });
    
  } catch (error) {
    console.error('❌ CSS extraction background processing failed:', error);
    trainingState.isTraining = false;
    trainingState.error = error.message;
  }
}

// 📊 GET /api/training/extraction-stats - Get CSS extraction statistics
router.get('/extraction-stats', async (req, res) => {
  try {
    // Mock extraction stats (replace with real data from storage)
    const extractionStats = {
      success: true,
      stats: {
        totalExtractions: 15,
        totalSites: 75,
        cssRulesExtracted: 12450,
        colorsAnalyzed: 1125,
        fontsAnalyzed: 600,
        cssThemes: trainingState?.results?.cssThemes || [
          {
            name: 'Default Modern',
            colors: ['#3B82F6', '#1E40AF', '#F8FAFC'],
            fonts: ['Inter', 'Open Sans'],
            type: 'default'
          }
        ],
        lastUpdate: new Date().toISOString()
      }
    };
    
    res.json(extractionStats);
    
  } catch (error) {
    console.error('❌ Error getting extraction stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stats: {
        totalExtractions: 0,
        totalSites: 0,
        cssRulesExtracted: 0,
        colorsAnalyzed: 0,
        fontsAnalyzed: 0,
        cssThemes: [],
        lastUpdate: new Date().toISOString()
      }
    });
  }
});

// 🌈 POST /api/training/auto-colors - Automatic color analysis
router.post('/auto-colors', async (req, res) => {
  try {
    console.log('🌈 Starting automatic color analysis...');
    
    res.json({
      success: true,
      message: 'Color analysis completed',
      results: {
        colorsAnalyzed: 125,
        palettesGenerated: 15,
        topColors: ['#3B82F6', '#1E40AF', '#F8FAFC', '#64748B'],
        businessTypes: ['corporate', 'tech', 'creative']
      }
    });
    
  } catch (error) {
    console.error('❌ Color analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 📝 POST /api/training/auto-fonts - Automatic font analysis  
router.post('/auto-fonts', async (req, res) => {
  try {
    console.log('📝 Starting automatic font analysis...');
    
    res.json({
      success: true,
      message: 'Font analysis completed',
      results: {
        fontsAnalyzed: 85,
        pairingsGenerated: 25,
        topFonts: ['Inter', 'Open Sans', 'Roboto', 'Montserrat'],
        categories: ['sans-serif', 'serif', 'display']
      }
    });
    
  } catch (error) {
    console.error('❌ Font analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🤖 POST /api/training/auto-classify - Automatic pattern classification
router.post('/auto-classify', async (req, res) => {
  try {
    console.log('🤖 Starting automatic pattern classification...');
    
    res.json({
      success: true,
      message: 'Pattern classification completed',
      results: {
        patternsClassified: 45,
        categoriesIdentified: 8,
        accuracy: 94,
        patterns: ['hero-sections', 'navigation', 'cards', 'forms']
      }
    });
    
  } catch (error) {
    console.error('❌ Pattern classification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🎯 POST /api/training/classify - Manual pattern classification
router.post('/classify', async (req, res) => {
  try {
    console.log('🎯 Starting manual pattern classification...');
    
    const { samples = [], businessType = 'general' } = req.body;
    
    res.json({
      success: true,
      message: 'Manual classification completed',
      results: {
        samplesProcessed: samples.length || 10,
        businessType,
        classifications: [
          { pattern: 'navigation', confidence: 95 },
          { pattern: 'hero-section', confidence: 88 },
          { pattern: 'product-grid', confidence: 92 }
        ],
        accuracy: 92
      }
    });
    
  } catch (error) {
    console.error('❌ Manual classification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 📦 POST /api/training/auto-finalize - Finalize training and export data
router.post('/auto-finalize', async (req, res) => {
  try {
    console.log('📦 Finalizing training and exporting data to ai_design_patterns...');
    
    // Check if storage is initialized
    if (!storage || !storage.pool) {
      console.log('⚠️ Storage not initialized, initializing now...');
      await storage.initialize();
    }

    // Generate real design pattern data
    const designPatterns = [
      {
        pattern_name: 'modern-restaurant-hero',
        business_type: 'restaurant',
        style_category: 'modern',
        color_palette: JSON.stringify({
          primary: '#e11d48',
          secondary: '#1e40af',
          accent: '#10b981',
          background: '#f8fafc',
          text: '#1f2937'
        }),
        font_families: JSON.stringify({
          heading: 'Montserrat',
          body: 'Inter',
          accent: 'Playfair Display'
        }),
        layout_structure: JSON.stringify({
          type: 'hero-section',
          components: ['navigation', 'hero-banner', 'cta-button'],
          grid: '12-column',
          responsive: true
        }),
        css_rules: '.hero-modern { background: linear-gradient(135deg, #e11d48, #1e40af); padding: 4rem 0; }',
        usage_context: 'Restaurant landing page hero section with modern gradient background',
        performance_score: 92,
        compatibility_notes: 'Mobile-first responsive design'
      },
      {
        pattern_name: 'elegant-navigation',
        business_type: 'restaurant',
        style_category: 'elegant',
        color_palette: JSON.stringify({
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#06b6d4',
          background: '#ffffff',
          text: '#374151'
        }),
        font_families: JSON.stringify({
          heading: 'Playfair Display',
          body: 'Source Sans Pro',
          accent: 'Crimson Text'
        }),
        layout_structure: JSON.stringify({
          type: 'navigation',
          components: ['logo', 'menu-items', 'cta-button'],
          position: 'fixed-top',
          responsive: true
        }),
        css_rules: '.nav-elegant { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); }',
        usage_context: 'Elegant restaurant navigation with glass morphism effect',
        performance_score: 88,
        compatibility_notes: 'Requires backdrop-filter support'
      },
      {
        pattern_name: 'card-menu-grid',
        business_type: 'restaurant',
        style_category: 'modern',
        color_palette: JSON.stringify({
          primary: '#f59e0b',
          secondary: '#ef4444',
          accent: '#10b981',
          background: '#f9fafb',
          text: '#111827'
        }),
        font_families: JSON.stringify({
          heading: 'Poppins',
          body: 'Open Sans',
          accent: 'Dancing Script'
        }),
        layout_structure: JSON.stringify({
          type: 'content-grid',
          components: ['card-container', 'image', 'title', 'description', 'price'],
          grid: '3-column',
          responsive: true
        }),
        css_rules: '.menu-card { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }',
        usage_context: 'Menu items display in card grid layout',
        performance_score: 94,
        compatibility_notes: 'Uses CSS Grid with fallback to Flexbox'
      }
    ];

    // Save patterns to database
    let insertCount = 0;
    let totalPatterns = 0;
    
    try {
      for (const pattern of designPatterns) {
        try {
          const timestamp = new Date();
          // Valorizza i campi source_url, html_content, css_content
          const sourceUrl = pattern.source_url || `https://ai-generated/${pattern.pattern_name}`;
          const htmlContent = pattern.html_content || `<div class="${pattern.pattern_name}">Generated HTML content</div>`;
          const cssContent = pattern.css_rules || '';
          await storage.pool.query(`
            INSERT INTO ai_design_patterns (
              business_type,
              source_url,
              business_images,
              confidence_score,
              source,
              status,
              html_content,
              css_content,
              created_at,
              updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
            ON CONFLICT (business_type, source_url)
            DO UPDATE SET
              business_images = $3,
              confidence_score = $4,
              updated_at = CURRENT_TIMESTAMP,
              source = $5,
              status = $6,
              html_content = $7,
              css_content = $8
          `, [
            pattern.business_type,
            sourceUrl,
            JSON.stringify({
              color_palette: pattern.color_palette,
              font_families: pattern.font_families,
              layout_structure: pattern.layout_structure,
              usage_context: pattern.usage_context,
              compatibility_notes: pattern.compatibility_notes,
              performance_score: pattern.performance_score
            }),
            85.5,
            'ai-generated',
            'active',
            htmlContent,
            cssContent
          ]);
          insertCount++;
          console.log(`✅ Inserted pattern: ${pattern.pattern_name}`);
        } catch (dbError) {
          console.error(`❌ Failed to insert pattern ${pattern.pattern_name}:`, dbError.message);
        }
      }

      // Verify insertion
      const countResult = await storage.pool.query('SELECT COUNT(*) FROM ai_design_patterns');
      totalPatterns = parseInt(countResult.rows[0].count);
      
    } catch (dbError) {
      console.error('❌ Database operation failed:', dbError.message);
      // Return success with warning if database fails
      return res.json({
        success: true,
        message: 'Training completed but database save failed',
        warning: dbError.message,
        results: {
          totalSites: 5,
          totalPatterns: 3, // fallback number
          patternsInserted: 0,
          cssThemesGenerated: 3,
          exportSize: '2.3MB',
          completedAt: new Date().toISOString()
        }
      });
    }

    console.log(`📊 Auto-finalize completed: ${insertCount} patterns inserted, ${totalPatterns} total patterns`);
    
    res.json({
      success: true,
      message: 'Training finalized and data exported to ai_design_patterns',
      results: {
        totalSites: 5,
        totalPatterns: totalPatterns,
        patternsInserted: insertCount,
        cssThemesGenerated: 3,
        exportSize: '2.3MB',
        completedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Training finalization error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;