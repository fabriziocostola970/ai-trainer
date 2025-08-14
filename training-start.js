// 🚀 AI-Trainer: START TRAINING COLLECTION
// Script per iniziare la raccolta dataset

const DataCollector = require('./src/training/data-collector');
const HybridTrainer = require('./src/training/hybrid-trainer');

// 🎯 SAMPLE SOURCES - High Quality Websites
const TRAINING_SOURCES = [
  // Restaurants
  {
    url: 'https://www.elevenmadisonpark.com/',
    businessType: 'restaurant',
    style: 'elegant-fine-dining',
    targetAudience: 'high-end-customers'
  },
  {
    url: 'https://www.shakeshack.com/',
    businessType: 'restaurant', 
    style: 'casual-modern',
    targetAudience: 'general-public'
  },
  
  // Tech Startups
  {
    url: 'https://linear.app/',
    businessType: 'tech-startup',
    style: 'minimal-modern',
    targetAudience: 'developers'
  },
  {
    url: 'https://stripe.com/',
    businessType: 'fintech',
    style: 'professional-clean', 
    targetAudience: 'businesses'
  },
  
  // E-commerce
  {
    url: 'https://www.allbirds.com/',
    businessType: 'ecommerce',
    style: 'sustainable-minimal',
    targetAudience: 'eco-conscious'
  },
  
  // Portfolios
  {
    url: 'https://www.dennissnellenberg.com/',
    businessType: 'portfolio',
    style: 'creative-developer',
    targetAudience: 'clients-agencies'
  },
  
  // Healthcare
  {
    url: 'https://www.headspace.com/',
    businessType: 'wellness',
    style: 'calming-friendly',
    targetAudience: 'wellness-seekers'
  },
  
  // Real Estate
  {
    url: 'https://www.compass.com/',
    businessType: 'real-estate',
    style: 'luxury-professional',
    targetAudience: 'home-buyers'
  }
];

// 🤖 MAIN TRAINING WORKFLOW
async function startTrainingCollection() {
  console.log('🚀 AI-Trainer: Starting Training Data Collection');
  console.log(`📊 Collecting ${TRAINING_SOURCES.length} high-quality samples`);
  
  const collector = new DataCollector();
  const trainer = new HybridTrainer();
  
  try {
    await collector.initialize();
    
    for (let i = 0; i < TRAINING_SOURCES.length; i++) {
      const source = TRAINING_SOURCES[i];
      console.log(`\n📍 Sample ${i+1}/${TRAINING_SOURCES.length}: ${source.businessType}`);
      
      try {
        // 1. Collect raw data (HTML + Screenshots)
        const sampleData = await collector.collectTrainingSample(source);
        
        // 2. AI Analysis with GPT-4V + Claude
        const analysis = await trainer.analyzeWithAI(sampleData);
        
        // 3. Generate perfect template from analysis
        const perfectTemplate = await trainer.generatePerfectTemplate(analysis);
        
        // 4. Save processed sample
        await collector.saveSample(sampleData, analysis, perfectTemplate);
        
        console.log(`✅ Sample completed: ${sampleData.id}`);
        
        // Rate limiting (be nice to sites)
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error) {
        console.error(`❌ Failed sample ${source.url}:`, error.message);
        continue; // Skip failed samples
      }
    }
    
    console.log('\n🎉 Training data collection completed!');
    console.log('📊 Starting AI model training...');
    
    // 5. Train AI models on collected data
    await trainer.trainModels();
    
    console.log('✅ AI-Trainer is now trained and ready!');
    
  } catch (error) {
    console.error('❌ Training collection failed:', error);
  } finally {
    await collector.cleanup();
  }
}

// 🚀 START TRAINING
if (require.main === module) {
  startTrainingCollection().catch(console.error);
}

module.exports = { startTrainingCollection, TRAINING_SOURCES };
