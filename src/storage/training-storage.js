// 🗄️ Persistent Training Storage System
// Sostituisce in-memory storage con database + file system

const fs = require('fs').promises;
const path = require('path');

class TrainingStorage {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.trainingStateFile = path.join(this.dataDir, 'training-state.json');
    this.customSitesFile = path.join(this.dataDir, 'custom-sites.json');
    this.samplesDir = path.join(this.dataDir, 'training-samples');
    this.processedDir = path.join(this.dataDir, 'processed');
  }

  // 📁 INITIALIZE STORAGE DIRECTORIES
  async initialize() {
    const dirs = [this.dataDir, this.samplesDir, this.processedDir];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      } catch (error) {
        if (error.code !== 'EEXIST') {
          console.error(`❌ Failed to create ${dir}:`, error);
        }
      }
    }
  }

  // 💾 TRAINING STATE PERSISTENCE
  async saveTrainingState(state) {
    try {
      const stateWithTimestamp = {
        ...state,
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };
      
      await fs.writeFile(
        this.trainingStateFile, 
        JSON.stringify(stateWithTimestamp, null, 2)
      );
      
      console.log(`💾 Training state saved: ${state.trainingId}`);
    } catch (error) {
      console.error('❌ Failed to save training state:', error);
    }
  }

  async loadTrainingState() {
    try {
      const data = await fs.readFile(this.trainingStateFile, 'utf8');
      const state = JSON.parse(data);
      console.log(`📖 Training state loaded: ${state.trainingId || 'none'}`);
      return state;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('📝 No previous training state found, starting fresh');
        return this.getDefaultState();
      }
      console.error('❌ Failed to load training state:', error);
      return this.getDefaultState();
    }
  }

  getDefaultState() {
    return {
      isTraining: false,
      trainingId: null,
      progress: 0,
      samplesCollected: 0,
      totalSamples: 0,
      currentStep: 'idle',
      startTime: null,
      accuracy: null,
      lastUpdated: new Date().toISOString()
    };
  }

  // 🔗 CUSTOM SITES MANAGEMENT
  async saveCustomSites(sites) {
    try {
      const sitesData = {
        sites: sites,
        totalSites: sites.length,
        lastUpdated: new Date().toISOString(),
        statistics: this.calculateSiteStatistics(sites)
      };
      
      await fs.writeFile(
        this.customSitesFile,
        JSON.stringify(sitesData, null, 2)
      );
      
      console.log(`🔗 Saved ${sites.length} custom sites`);
    } catch (error) {
      console.error('❌ Failed to save custom sites:', error);
    }
  }

  async loadCustomSites() {
    try {
      const data = await fs.readFile(this.customSitesFile, 'utf8');
      const sitesData = JSON.parse(data);
      return sitesData.sites || [];
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      console.error('❌ Failed to load custom sites:', error);
      return [];
    }
  }

  calculateSiteStatistics(sites) {
    const businessTypes = {};
    const styles = {};
    
    sites.forEach(site => {
      businessTypes[site.businessType] = (businessTypes[site.businessType] || 0) + 1;
      styles[site.style] = (styles[site.style] || 0) + 1;
    });
    
    return { businessTypes, styles };
  }

  // 📊 TRAINING SAMPLES MANAGEMENT
  async saveSample(sampleId, sampleData) {
    try {
      const sampleDir = path.join(this.samplesDir, sampleId);
      await fs.mkdir(sampleDir, { recursive: true });
      
      // Save metadata
      const metadataFile = path.join(sampleDir, 'metadata.json');
      await fs.writeFile(metadataFile, JSON.stringify(sampleData.metadata, null, 2));
      
      // Save HTML source
      if (sampleData.html) {
        const htmlFile = path.join(sampleDir, 'source.html');
        await fs.writeFile(htmlFile, sampleData.html);
      }
      
      // Save AI analysis
      if (sampleData.analysis) {
        const analysisDir = path.join(sampleDir, 'analysis');
        await fs.mkdir(analysisDir, { recursive: true });
        
        const analysisFile = path.join(analysisDir, 'ai-analysis.json');
        await fs.writeFile(analysisFile, JSON.stringify(sampleData.analysis, null, 2));
      }
      
      console.log(`📊 Sample saved: ${sampleId}`);
      return sampleDir;
      
    } catch (error) {
      console.error(`❌ Failed to save sample ${sampleId}:`, error);
    }
  }

  async listSamples() {
    try {
      const samples = await fs.readdir(this.samplesDir);
      return samples.filter(name => !name.startsWith('.'));
    } catch (error) {
      console.error('❌ Failed to list samples:', error);
      return [];
    }
  }

  // 🎯 PROCESSED DATA MANAGEMENT
  async saveProcessedData(type, data) {
    try {
      const fileName = `${type}-${Date.now()}.json`;
      const filePath = path.join(this.processedDir, fileName);
      
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      console.log(`🎯 Processed data saved: ${fileName}`);
      
    } catch (error) {
      console.error(`❌ Failed to save processed data:`, error);
    }
  }

  // 📈 TRAINING HISTORY & ANALYTICS
  async getTrainingHistory() {
    try {
      const samples = await this.listSamples();
      const customSites = await this.loadCustomSites();
      const currentState = await this.loadTrainingState();
      
      return {
        totalSamples: samples.length,
        customSitesCount: customSites.length,
        currentTraining: currentState,
        lastTrainingDate: currentState.lastUpdated,
        samplesCollected: samples
      };
      
    } catch (error) {
      console.error('❌ Failed to get training history:', error);
      return null;
    }
  }
}

module.exports = TrainingStorage;
