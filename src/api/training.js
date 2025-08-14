const express = require('express');
const router = express.Router();
const DatabaseStorage = require('../storage/database-storage');
const RailwayDataCollector = require('../training/railway-data-collector');

// �️ Initialize PostgreSQL storage with file fallback
const storage = new DatabaseStorage();
const collector = new RailwayDataCollector();
let trainingState = null;
let customSites = [];

// Initialize storage on startup
(async () => {
  await storage.initialize();
  await collector.initialize();
  trainingState = await storage.loadTrainingState();
  customSites = await storage.loadCustomSites();
  
  const healthCheck = await storage.healthCheck();
  console.log(`🚀 Training API initialized with ${healthCheck.storage} storage`);
  console.log(`📊 Current sessions: ${healthCheck.totalSessions || 0}`);
})();

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

    const trainingId = `custom-train-${Date.now()}`;
    
    trainingState = {
      isTraining: true,
      trainingId,
      progress: 0,
      samplesCollected: 0,
      totalSamples: customSites.length,
      currentStep: 'analyzing-custom-sites',
      startTime: new Date(),
      accuracy: null,
      customSites: customSites
    };

    // 💾 Save state and custom sites to persistent storage
    await storage.saveTrainingState(trainingState);
    await storage.saveCustomSites(customSites);

    console.log(`🔗 Starting custom training: ${trainingId}`);
    console.log(`📊 Custom sites: ${customSites.length}`);
    customSites.forEach(site => {
      console.log(`  - ${site.url} (${site.businessType}, ${site.style})`);
    });
    
    // Start custom training asynchronously
    startCustomTrainingAsync(trainingId, customSites, aiAnalysis);
    
    res.json({
      success: true,
      trainingId,
      sitesCount: customSites.length,
      estimatedTime: `${customSites.length * 2} minutes`,
      message: 'Custom training started with your selected sites'
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
      
      // Log current site being processed
      if (i < customSites.length) {
        const currentSite = customSites[i];
        console.log(`🔍 Processing: ${currentSite.url} (${currentSite.businessType})`);
        trainingState.samplesCollected = i + 1;
      }
      
      // Simulate work time (shorter for custom sites)
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds per step
    }
    
    // Custom training completed
    trainingState.isTraining = false;
    trainingState.progress = 100;
    trainingState.currentStep = 'custom-completed';
    trainingState.accuracy = 89 + Math.round(Math.random() * 8); // Higher accuracy for custom
    
    // 💾 Save final custom training state
    await storage.saveTrainingState(trainingState);
    
    console.log(`🎉 Custom Training ${trainingId} completed with ${trainingState.accuracy}% accuracy`);
    console.log(`🔗 Learned patterns from ${customSites.length} custom sites`);
    
  } catch (error) {
    console.error(`❌ Custom Training ${trainingId} failed:`, error);
    trainingState.isTraining = false;
    trainingState.currentStep = 'failed';
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

module.exports = router;
