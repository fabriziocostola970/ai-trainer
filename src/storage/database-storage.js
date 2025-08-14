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
    return 'train_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 🔌 Initialize Database Connection
  async initialize() {
    try {
      // Test connection to VendiOnline PostgreSQL
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.isConnected = true;
      console.log('✅ PostgreSQL connected to VendiOnline database');
      
      // Verify VendiOnline AI training tables exist
      await this.verifyVendiOnlineTables();
      
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

  // 📋 Verify VendiOnline AI Training Tables
  async verifyVendiOnlineTables() {
    try {
      const requiredTables = [
        'ai_training_sessions',
        'ai_custom_sites', 
        'ai_training_samples'
      ];
      
      for (const table of requiredTables) {
        const result = await this.pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [table]);
        
        if (!result.rows[0].exists) {
          throw new Error(`Table ${table} not found in VendiOnline database`);
        }
      }
      
      console.log('✅ VendiOnline AI training tables verified');
      
    } catch (error) {
      console.error('❌ VendiOnline table verification failed:', error.message);
      console.log('🔄 Falling back to file storage...');
      
      this.fallbackToFiles = true;
      this.isConnected = false;
      
      // Initialize file storage as fallback
      const TrainingStorage = require('./training-storage');
      this.fileStorage = new TrainingStorage();
      await this.fileStorage.initialize();
    }
  }

    // 💾 Save AI Training Session to VendiOnline Database
  async saveAITrainingSession(sessionData) {
    if (!this.isConnected || this.fallbackToFiles) {
      console.log('🔄 Using file storage fallback for saveAITrainingSession');
      return await this.fileStorage.saveTrainingState(sessionData);
    }
    
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
    if (!this.isConnected || this.fallbackToFiles) {
      console.log('🔄 Using file storage fallback for updateAITrainingSession');
      return await this.fileStorage.saveTrainingState(updates);
    }
    
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
    // Delegate to the proper AI training session save method
    return await this.saveAITrainingSession(state);
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
      const sessionsQuery = 'SELECT COUNT(*) as total_sessions FROM ai_training_sessions';
      const samplesQuery = 'SELECT COUNT(*) as total_samples FROM ai_training_samples';
      const sitesQuery = 'SELECT COUNT(*) as custom_sites_count FROM ai_custom_sites';
      const latestQuery = `
        SELECT * FROM ai_training_sessions 
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
        trainingId: latest.rows[0].session_id,
        isTraining: latest.rows[0].status === 'running',
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
          samples: 'ai_training_samples table',
          state: 'ai_training_sessions table',
          customSites: 'ai_custom_sites table'
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
      
      const result = await this.pool.query('SELECT COUNT(*) as total FROM ai_training_sessions');
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
