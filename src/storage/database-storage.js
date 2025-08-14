// 🗄️ PostgreSQL Database Integration for AI-Trainer
// Sostituisce file storage con database persistente

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

class DatabaseStorage {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.RAILWAY_DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    this.isConnected = false;
    this.fallbackToFiles = false;
    this.fileStorage = null;
  }

  // 🆔 Generate unique ID
  generateId() {
    return 'tr_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
  }

  // 🆔 Generate unique ID
  generateId() {
    return 'train_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 🔌 Initialize Database Connection
  async initialize() {
    try {
      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.isConnected = true;
      console.log('✅ PostgreSQL connected successfully');
      
      // Run schema setup
      await this.setupSchema();
      
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error.message);
      console.log('🔄 Falling back to file storage...');
      
      this.fallbackToFiles = true;
      this.isConnected = false;
      
      // Initialize file storage as fallback
      const TrainingStorage = require('./training-storage');
      this.fileStorage = new TrainingStorage();
      await this.fileStorage.initialize();
    }
  }

  // 📋 Setup Database Schema
  async setupSchema() {
    try {
      const schemaPath = path.join(__dirname, '../database/schema.sql');
      const schemaSql = await fs.readFile(schemaPath, 'utf8');
      
      await this.pool.query(schemaSql);
      console.log('📋 Database schema initialized');
      
    } catch (error) {
      console.error('❌ Schema setup failed:', error.message);
      // Don't fall back here, schema issues are critical
    }
  }

    // 💾 Save AI Training Session to VendiOnline Database
  async saveAITrainingSession(sessionData) {
    if (!this.isConnected) return this.fallbackMethod('saveAITrainingSession');
    
    try {
      const query = `
        INSERT INTO ai_training_sessions (
          id,
          initiator_id,
          business_id, 
          training_type,
          status,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const values = [
        sessionData.id || this.generateId(),
        sessionData.initiatorId || 'system',
        sessionData.businessId || null,
        sessionData.trainingType || 'GLOBAL_TRAINING',
        sessionData.status || 'STARTED',
        JSON.stringify(sessionData.metadata || {})
      ];
      
      const result = await this.pool.query(query, values);
      console.log('✅ AI Training session saved to database:', result.rows[0].id);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Failed to save AI training session:', error.message);
      return null;
    }
  }

  // 🔄 Update AI Training Session
  async updateAITrainingSession(sessionId, updates) {
    if (!this.isConnected) return this.fallbackMethod('updateAITrainingSession');
    
    try {
      const setClause = Object.keys(updates).map((key, index) => {
        const dbColumn = key === 'trainingType' ? 'training_type' :
                        key === 'businessId' ? 'business_id' :
                        key === 'initiatorId' ? 'initiator_id' :
                        key === 'updatedAt' ? 'updated_at' : key;
        return `${dbColumn} = $${index + 2}`;
      }).join(', ');
      
      const query = `
        UPDATE ai_training_sessions 
        SET ${setClause}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const values = [sessionId, ...Object.values(updates)];
      const result = await this.pool.query(query, values);
      
      if (result.rows.length > 0) {
        console.log('✅ AI Training session updated:', sessionId);
        return result.rows[0];
      } else {
        console.log('⚠️ AI Training session not found:', sessionId);
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to update AI training session:', error.message);
      return null;
    }
  }
  async saveTrainingState(state) {
    if (this.fallbackToFiles) {
      return await this.fileStorage.saveTrainingState(state);
    }

    try {
      const query = `
        INSERT INTO training_sessions (
          training_id, is_training, progress, samples_collected, 
          total_samples, current_step, start_time, accuracy, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (training_id) 
        DO UPDATE SET 
          is_training = $2, progress = $3, samples_collected = $4,
          total_samples = $5, current_step = $6, accuracy = $8,
          metadata = $9, updated_at = CURRENT_TIMESTAMP
      `;
      
      const values = [
        state.trainingId,
        state.isTraining,
        state.progress,
        state.samplesCollected,
        state.totalSamples,
        state.currentStep,
        state.startTime ? new Date(state.startTime) : null,
        state.accuracy,
        JSON.stringify(state)
      ];
      
      await this.pool.query(query, values);
      console.log(`💾 Training state saved to DB: ${state.trainingId}`);
      
    } catch (error) {
      console.error('❌ Failed to save training state to DB:', error.message);
    }
  }

  async loadTrainingState() {
    if (this.fallbackToFiles) {
      return await this.fileStorage.loadTrainingState();
    }

    try {
      const query = `
        SELECT * FROM training_sessions 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const result = await this.pool.query(query);
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        const state = {
          isTraining: row.is_training,
          trainingId: row.training_id,
          progress: row.progress,
          samplesCollected: row.samples_collected,
          totalSamples: row.total_samples,
          currentStep: row.current_step,
          startTime: row.start_time,
          accuracy: row.accuracy,
          lastUpdated: row.updated_at
        };
        
        console.log(`📖 Training state loaded from DB: ${state.trainingId}`);
        return state;
      }
      
      return this.getDefaultState();
      
    } catch (error) {
      console.error('❌ Failed to load training state from DB:', error.message);
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

  // 🔗 Custom Sites Management
  async saveCustomSites(sites) {
    if (this.fallbackToFiles) {
      return await this.fileStorage.saveCustomSites(sites);
    }

    try {
      // Clear existing sites (or implement smarter merge logic)
      await this.pool.query('DELETE FROM custom_sites');
      
      // Insert new sites
      for (const site of sites) {
        const query = `
          INSERT INTO custom_sites (url, business_type, style, metadata)
          VALUES ($1, $2, $3, $4)
        `;
        
        const values = [
          site.url,
          site.businessType,
          site.style,
          JSON.stringify(site)
        ];
        
        await this.pool.query(query, values);
      }
      
      console.log(`🔗 Saved ${sites.length} custom sites to DB`);
      
    } catch (error) {
      console.error('❌ Failed to save custom sites to DB:', error.message);
    }
  }

  async loadCustomSites() {
    if (this.fallbackToFiles) {
      return await this.fileStorage.loadCustomSites();
    }

    try {
      const query = 'SELECT * FROM custom_sites ORDER BY created_at DESC';
      const result = await this.pool.query(query);
      
      const sites = result.rows.map(row => ({
        url: row.url,
        businessType: row.business_type,
        style: row.style,
        priority: row.priority,
        status: row.status,
        lastCollected: row.last_collected,
        metadata: row.metadata
      }));
      
      console.log(`📖 Loaded ${sites.length} custom sites from DB`);
      return sites;
      
    } catch (error) {
      console.error('❌ Failed to load custom sites from DB:', error.message);
      return [];
    }
  }

  // 📊 Training Sample Storage
  async saveSample(sampleId, sampleData) {
    if (this.fallbackToFiles) {
      return await this.fileStorage.saveSample(sampleId, sampleData);
    }

    try {
      const query = `
        INSERT INTO training_samples (
          sample_id, url, business_type, collection_method, 
          html_content, html_length, analysis_data, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (sample_id) DO UPDATE SET
          html_content = $5, html_length = $6, analysis_data = $7, 
          status = $8, updated_at = CURRENT_TIMESTAMP
      `;
      
      const values = [
        sampleId,
        sampleData.url || sampleData.metadata?.url,
        sampleData.businessType || sampleData.metadata?.businessType,
        sampleData.method || 'unknown',
        sampleData.html || '',
        sampleData.html ? sampleData.html.length : 0,
        JSON.stringify(sampleData.analysis || {}),
        'completed'
      ];
      
      await this.pool.query(query, values);
      console.log(`📊 Sample saved to DB: ${sampleId}`);
      
    } catch (error) {
      console.error(`❌ Failed to save sample ${sampleId} to DB:`, error.message);
    }
  }

  // 📈 Analytics & History
  async getTrainingHistory() {
    if (this.fallbackToFiles) {
      return await this.fileStorage.getTrainingHistory();
    }

    try {
      const sessionsQuery = 'SELECT COUNT(*) as total_sessions FROM training_sessions';
      const samplesQuery = 'SELECT COUNT(*) as total_samples FROM training_samples';
      const sitesQuery = 'SELECT COUNT(*) as custom_sites_count FROM custom_sites';
      const latestQuery = `
        SELECT * FROM training_sessions 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const [sessions, samples, sites, latest] = await Promise.all([
        this.pool.query(sessionsQuery),
        this.pool.query(samplesQuery),
        this.pool.query(sitesQuery),
        this.pool.query(latestQuery)
      ]);
      
      const currentTraining = latest.rows.length > 0 ? {
        trainingId: latest.rows[0].training_id,
        isTraining: latest.rows[0].is_training,
        progress: latest.rows[0].progress,
        accuracy: latest.rows[0].accuracy,
        lastUpdated: latest.rows[0].updated_at
      } : null;
      
      return {
        totalSessions: parseInt(sessions.rows[0].total_sessions),
        totalSamples: parseInt(samples.rows[0].total_samples),
        customSitesCount: parseInt(sites.rows[0].custom_sites_count),
        currentTraining,
        lastTrainingDate: currentTraining?.lastUpdated,
        storageLocation: {
          type: 'postgresql',
          samples: 'training_samples table',
          state: 'training_sessions table',
          customSites: 'custom_sites table'
        }
      };
      
    } catch (error) {
      console.error('❌ Failed to get training history from DB:', error.message);
      return {
        totalSessions: 0,
        totalSamples: 0,
        customSitesCount: 0,
        currentTraining: null
      };
    }
  }

  // 🔧 Database Health Check
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', storage: 'file_fallback' };
      }
      
      const result = await this.pool.query('SELECT COUNT(*) as total FROM training_sessions');
      return { 
        status: 'connected', 
        storage: 'postgresql',
        totalSessions: parseInt(result.rows[0].total)
      };
      
    } catch (error) {
      return { 
        status: 'error', 
        storage: 'unknown',
        error: error.message 
      };
    }
  }

  // 🔄 Close connections
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('🔌 Database connection closed');
    }
  }
}

module.exports = DatabaseStorage;
