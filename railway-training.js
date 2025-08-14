// 🚀 Railway-Optimized AI Training Starter
// Sistema di training che funziona sia con che senza Puppeteer

const RailwayDataCollector = require('./src/training/railway-data-collector');

// 🎯 CURATED TRAINING SOURCES (Railway optimized)
const TRAINING_SOURCES = [
  {
    url: 'https://linear.app',
    businessType: 'tech-startup',
    priority: 'high',
    style: 'minimal'
  },
  {
    url: 'https://stripe.com',
    businessType: 'tech-startup', 
    priority: 'high',
    style: 'professional'
  },
  {
    url: 'https://allbirds.com',
    businessType: 'ecommerce',
    priority: 'medium',
    style: 'minimal'
  }
];

class RailwayTrainer {
  constructor() {
    this.collector = new RailwayDataCollector();
    this.trainingResults = [];
  }

  async initialize() {
    console.log('🚀 Railway AI Trainer starting...');
    await this.collector.initialize();
    console.log(`📊 Training sources: ${TRAINING_SOURCES.length}`);
  }

  async startTraining(options = {}) {
    const { maxSamples = 3 } = options;
    
    console.log(`🎯 Starting Railway-optimized training (max: ${maxSamples})`);
    
    const selectedSources = TRAINING_SOURCES.slice(0, maxSamples);
    
    for (let i = 0; i < selectedSources.length; i++) {
      const source = selectedSources[i];
      
      console.log(`\n📈 Progress: ${i + 1}/${selectedSources.length}`);
      console.log(`🎯 Processing: ${source.url}`);
      
      try {
        const result = await this.collector.collectTrainingSample({
          url: source.url,
          businessType: source.businessType,
          metadata: {
            priority: source.priority,
            style: source.style,
            trainingIndex: i + 1
          }
        });
        
        if (result.success) {
          this.trainingResults.push(result);
          console.log(`✅ Collected: ${result.sampleId} (${result.method})`);
        }
        
        // Railway-friendly delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing ${source.url}:`, error.message);
      }
    }
    
    return this.generateTrainingReport();
  }

  generateTrainingReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalSources: TRAINING_SOURCES.length,
      successfulCollections: this.trainingResults.length,
      summary: {
        success: this.trainingResults.length > 0,
        accuracy: Math.round((this.trainingResults.length / TRAINING_SOURCES.length) * 100),
        samples: this.trainingResults.map(r => r.sampleId)
      }
    };

    console.log('\n🎉 RAILWAY TRAINING COMPLETED!');
    console.log(`📊 Success Rate: ${report.summary.accuracy}%`);
    console.log(`✅ Samples Collected: ${report.successfulCollections}`);
    
    return report;
  }
}

module.exports = { RailwayTrainer, TRAINING_SOURCES };
