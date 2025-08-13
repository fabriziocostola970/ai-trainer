// 🎨 Web Interface for Training Dataset Management
// Dashboard per gestire raccolta, analisi e training del dataset

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const TrainingDataCollector = require('./data-collector');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// 📊 TRAINING DASHBOARD
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await getTrainingStats();
    const samples = await getRecentSamples();
    
    res.json({
      success: true,
      dashboard: {
        stats,
        recentSamples: samples,
        aiModelsStatus: await getAIModelsStatus(),
        trainingProgress: await getTrainingProgress()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🌐 ADD WEBSITE TO TRAINING SET
router.post('/collect/website', async (req, res) => {
  try {
    const { url, businessType, metadata } = req.body;
    
    // Validate input
    if (!url || !businessType) {
      return res.status(400).json({
        success: false,
        error: 'URL and businessType are required'
      });
    }

    // Start collection process
    const collector = new TrainingDataCollector();
    const result = await collector.collectTrainingSample({
      url,
      businessType,
      metadata: {
        businessType,
        style: metadata.style || 'modern',
        targetAudience: metadata.targetAudience || [],
        collectionMethod: 'manual-interface',
        collectedBy: req.user?.id || 'anonymous',
        collectionDate: new Date().toISOString(),
        ...metadata
      }
    });

    await collector.close();

    if (result.success) {
      // Update training statistics
      await updateTrainingStats('sample_collected', result.sampleId);
      
      res.json({
        success: true,
        message: 'Website successfully added to training dataset',
        sample: {
          id: result.sampleId,
          url,
          businessType,
          collectionDate: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to collect website data',
        details: result.error
      });
    }

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 📁 UPLOAD MANUAL SAMPLE (HTML + Images)
router.post('/upload/manual', upload.fields([
  { name: 'html', maxCount: 1 },
  { name: 'desktop', maxCount: 1 },
  { name: 'tablet', maxCount: 1 },
  { name: 'mobile', maxCount: 1 }
]), async (req, res) => {
  try {
    const { businessType, metadata } = req.body;
    const files = req.files;

    if (!files.html || !files.desktop) {
      return res.status(400).json({
        success: false,
        error: 'HTML file and desktop screenshot are required'
      });
    }

    // Process manual upload
    const result = await processManualUpload(files, businessType, JSON.parse(metadata));
    
    res.json({
      success: true,
      message: 'Manual sample successfully processed',
      sample: result
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🎯 BATCH COLLECTION (Multiple URLs)
router.post('/collect/batch', async (req, res) => {
  try {
    const { websites, options } = req.body;
    
    if (!Array.isArray(websites) || websites.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'websites array is required'
      });
    }

    // Start batch collection (background process)
    const batchId = generateBatchId();
    processBatchCollection(batchId, websites, options);
    
    res.json({
      success: true,
      message: 'Batch collection started',
      batchId,
      estimatedTime: `${websites.length * 30} seconds`,
      status: 'processing'
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 📊 GET BATCH STATUS
router.get('/batch/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    const status = await getBatchStatus(batchId);
    
    res.json({
      success: true,
      batchId,
      status
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🗂️ LIST TRAINING SAMPLES
router.get('/samples', async (req, res) => {
  try {
    const { businessType, style, limit = 20, offset = 0 } = req.query;
    const samples = await getTrainingSamples({ businessType, style, limit, offset });
    
    res.json({
      success: true,
      samples,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: await getTrainingSamplesCount({ businessType, style })
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔍 GET SAMPLE DETAILS
router.get('/samples/:sampleId', async (req, res) => {
  try {
    const { sampleId } = req.params;
    const sample = await getSampleDetails(sampleId);
    
    if (!sample) {
      return res.status(404).json({
        success: false,
        error: 'Sample not found'
      });
    }
    
    res.json({
      success: true,
      sample
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ❌ DELETE SAMPLE
router.delete('/samples/:sampleId', async (req, res) => {
  try {
    const { sampleId } = req.params;
    await deleteSample(sampleId);
    
    res.json({
      success: true,
      message: 'Sample deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🤖 START AI TRAINING
router.post('/train/start', async (req, res) => {
  try {
    const { modelType, samples, config } = req.body;
    
    // Start training process
    const trainingId = await startAITraining(modelType, samples, config);
    
    res.json({
      success: true,
      message: 'AI training started',
      trainingId,
      estimatedTime: calculateTrainingTime(samples.length),
      status: 'initializing'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 📈 GET TRAINING STATUS
router.get('/train/:trainingId', async (req, res) => {
  try {
    const { trainingId } = req.params;
    const status = await getTrainingStatus(trainingId);
    
    res.json({
      success: true,
      trainingId,
      status
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🧪 TEST TRAINED MODEL
router.post('/test/model', async (req, res) => {
  try {
    const { modelId, testData } = req.body;
    const results = await testTrainedModel(modelId, testData);
    
    res.json({
      success: true,
      testResults: results
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 📊 ANALYTICS & INSIGHTS
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await getTrainingAnalytics();
    
    res.json({
      success: true,
      analytics: {
        sampleDistribution: analytics.samplesByBusinessType,
        qualityMetrics: analytics.averageQualityScores,
        designTrends: analytics.popularDesignPatterns,
        performanceMetrics: analytics.collectionPerformance,
        aiModelPerformance: analytics.modelAccuracyTrends
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🛠️ UTILITY FUNCTIONS

async function getTrainingStats() {
  const samplesDir = path.join(__dirname, '../../data/training-samples');
  
  try {
    const samples = await fs.readdir(samplesDir);
    const businessTypes = {};
    
    for (const sample of samples) {
      const metadataPath = path.join(samplesDir, sample, 'metadata.json');
      try {
        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
        businessTypes[metadata.businessType] = (businessTypes[metadata.businessType] || 0) + 1;
      } catch (err) {
        console.warn(`Could not read metadata for ${sample}`);
      }
    }
    
    return {
      totalSamples: samples.length,
      businessTypes,
      collectionDate: new Date().toISOString(),
      storageUsed: await calculateStorageUsage(samplesDir)
    };
  } catch (error) {
    return {
      totalSamples: 0,
      businessTypes: {},
      error: error.message
    };
  }
}

async function processBatchCollection(batchId, websites, options) {
  const collector = new TrainingDataCollector();
  const results = [];
  
  for (let i = 0; i < websites.length; i++) {
    const website = websites[i];
    try {
      console.log(`📊 Processing ${i + 1}/${websites.length}: ${website.url}`);
      
      const result = await collector.collectTrainingSample(website);
      results.push({ ...result, url: website.url });
      
      // Update batch progress
      await updateBatchProgress(batchId, {
        processed: i + 1,
        total: websites.length,
        currentUrl: website.url,
        results
      });
      
      // Rate limiting
      if (options.delay) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }
      
    } catch (error) {
      results.push({ 
        success: false, 
        url: website.url, 
        error: error.message 
      });
    }
  }
  
  await collector.close();
  
  // Mark batch as completed
  await updateBatchProgress(batchId, {
    status: 'completed',
    processed: websites.length,
    total: websites.length,
    results,
    completedAt: new Date().toISOString()
  });
}

function generateBatchId() {
  return `batch-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

module.exports = router;
