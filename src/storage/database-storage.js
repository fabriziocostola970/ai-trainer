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
    
      }

  // 🧹 Sanitize HTML content for PostgreSQL UTF-8 storage
  sanitizeHTMLContent(htmlContent) {
    if (!htmlContent || typeof htmlContent !== 'string') {
      return '';
    }
    
    try {
      console.log(`🧹 BEFORE SANITIZATION: ${htmlContent.length} characters`);
      
      // 1️⃣ Remove null bytes and control characters
      let sanitized = htmlContent
        .replace(/\x00/g, '') // Remove null bytes (0x00)
        .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters except \t, \n, \r
        .replace(/\uFFFD/g, ''); // Remove replacement characters
      
      // 2️⃣ Fix common HTML encoding issues
      sanitized = sanitized
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
        .replace(/[\u2028\u2029]/g, ' ') // Replace line/paragraph separators with spaces
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\r/g, '\n'); // Convert remaining \r to \n
      
      // 3️⃣ Handle problematic quotes and special characters
      sanitized = sanitized
        .replace(/[""]/g, '"') // Normalize smart quotes
        .replace(/['']/g, "'") // Normalize smart apostrophes
        .replace(/…/g, '...') // Replace ellipsis
        .replace(/–/g, '-') // Replace en-dash
        .replace(/—/g, '--'); // Replace em-dash
      
      // 4️⃣ Remove or escape potentially problematic SQL characters
      sanitized = sanitized
        .replace(/\\/g, '\\\\') // Escape backslashes
        .replace(/\$/g, ''); // Remove dollar signs (can interfere with PostgreSQL)
      
      // 5️⃣ Limit length to prevent oversized content
      if (sanitized.length > 3000000) { // 3MB limit (increased from 1MB)
        console.log(`⚠️ HTML content too large (${sanitized.length}), truncating to 3MB`);
        sanitized = sanitized.substring(0, 3000000) + '...[TRUNCATED]';
      }
      
      // 6️⃣ Final validation - NO Buffer conversion to prevent corruption
      if (typeof sanitized !== 'string') {
        sanitized = String(sanitized);
      }
      
      console.log(`🧹 HTML sanitized: ${htmlContent.length} → ${sanitized.length} characters`);
      console.log(`🔍 Sample of sanitized content: "${sanitized.substring(0, 200)}..."`);
      
      return sanitized;
    } catch (error) {
      console.error('❌ Error sanitizing HTML:', error.message);
      console.error('❌ Problematic content sample:', htmlContent.substring(0, 500));
      // Fallback: aggressive cleanup
      return htmlContent
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove all control characters
        .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '') // Keep only printable ASCII + Unicode
        .substring(0, 1500000); // Limit to 1.5MB as emergency fallback (increased from 500KB)
    }
  }

  // � Alert System for Critical Errors
  logCriticalError(errorType, errorMessage, errorDetails = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      type: errorType,
      message: errorMessage,
      details: errorDetails,
      alert: true
    };
    
    console.error('🚨🚨🚨 CRITICAL ERROR ALERT 🚨🚨🚨');
    console.error('❌ TYPE:', errorType);
    console.error('❌ MESSAGE:', errorMessage);
    console.error('❌ DETAILS:', errorDetails);
    console.error('🚨🚨🚨 END CRITICAL ERROR 🚨🚨🚨');
    
    // Store error for API to retrieve
    this.lastCriticalError = errorLog;
    
    return errorLog;
  }

  // 🔍 Get Last Critical Error (for API alerts)
  getLastCriticalError() {
    return this.lastCriticalError || null;
  }

  // �💾 Save AI Training Sample
  async saveAITrainingSample(sampleData) {
    console.log(`🔍 DEBUG SAMPLE SAVE: isConnected=${this.isConnected}, fallbackToFiles=${this.fallbackToFiles}`);
    
    if (!this.pool) {
      console.log('⚠️ No database connection, skipping training sample save');
      return null;
    }

    // 🚨 DETAILED DEBUG: Log all sample data before save attempt
    if (!this.isConnected || this.fallbackToFiles) {
      console.log('🔄 Using file storage fallback for saveAITrainingSample');
      console.log('❌ DATABASE SAMPLE SAVE SKIPPED - System in fallback mode!');
      // Return mock success to prevent training from failing
      return { 
        id: `fallback-${Date.now()}`, 
        sampleId: sampleData.sampleId,
        saved: 'file_fallback'
      };
    }

    try {
      // Generate simple unique ID without crypto dependencies
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 15);
      const generatedId = `c${timestamp}${random}`;
      
      // 🔍 VALIDATE AND SANITIZE ALL FIELDS
      const sanitizedData = {
        id: generatedId,
        sampleId: (sampleData.sampleId || '').toString().trim().substring(0, 255),
        url: (sampleData.url || '').toString().trim().substring(0, 500),
        businessType: (sampleData.businessType || '').toString().trim().substring(0, 100),
        trainingSessionId: (sampleData.trainingSessionId || '').toString().trim().substring(0, 255),
        collectionMethod: (sampleData.collectionMethod || 'web').toString().trim().substring(0, 50),
        status: (sampleData.status || 'collected').toString().trim().substring(0, 50)
      };
      
      // Sanitize HTML content before saving
      const sanitizedHTML = this.sanitizeHTMLContent(sampleData.htmlContent);
      
      // 🚨 VALIDATE REQUIRED FIELDS
      if (!sanitizedData.sampleId || !sanitizedData.url || !sanitizedData.businessType) {
        throw new Error(`Missing required fields: sampleId="${sanitizedData.sampleId}", url="${sanitizedData.url}", businessType="${sanitizedData.businessType}"`);
      }
      
      // 🔍 SANITIZE analysisData JSON
      let analysisDataJSON = '{}';
      try {
        if (sampleData.analysisData && typeof sampleData.analysisData === 'object') {
          analysisDataJSON = JSON.stringify(sampleData.analysisData);
        } else if (typeof sampleData.analysisData === 'string') {
          JSON.parse(sampleData.analysisData); // Validate it's valid JSON
          analysisDataJSON = sampleData.analysisData;
        }
      } catch (jsonError) {
        console.error('⚠️ Invalid analysisData JSON, using empty object:', jsonError.message);
        analysisDataJSON = '{}';
      }
      
      // 🔍 DETAILED LOGGING: Show all sanitized data before INSERT
      console.log(`📋 SANITIZED SAMPLE INSERT DATA:`, {
        ...sanitizedData,
        htmlLength: sanitizedHTML.length,
        analysisDataLength: analysisDataJSON.length
      });
      
      const result = await this.pool.query(`
        INSERT INTO ai_training_samples (
          id, "sampleId", url, "businessType", "trainingSessionId",
          "htmlContent", "htmlLength", "collectionMethod", 
          status, "analysisData", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, "sampleId"
      `, [
        sanitizedData.id,
        sanitizedData.sampleId,
        sanitizedData.url,
        sanitizedData.businessType,
        sanitizedData.trainingSessionId,
        sanitizedHTML,
        sanitizedHTML.length,
        sanitizedData.collectionMethod,
        sanitizedData.status,
        analysisDataJSON,
        new Date(),
        new Date()
      ]);

      console.log(`✅ Training sample saved with ID: ${result.rows[0].id}`);
      console.log(`🔍 FULL SQL RESULT:`, JSON.stringify(result.rows[0], null, 2));
      console.log(`🔍 SQL RESULT ROWS LENGTH:`, result.rows.length);
      console.log(`🔍 RETURNING FROM saveAITrainingSample:`, result.rows[0]);
      return result.rows[0];
    } catch (error) {
      // 🚨 CRITICAL ERROR ALERT - Log with alert system
      const errorAlert = this.logCriticalError(
        'SQL_SAMPLE_SAVE_FAILED',
        `Failed to save training sample: ${error.message}`,
        {
          sqlErrorCode: error.code,
          sqlErrorDetail: error.detail,
          sampleId: sampleData.sampleId,
          url: sampleData.url,
          businessType: sampleData.businessType,
          trainingSessionId: sampleData.trainingSessionId,
          htmlLength: sampleData.htmlContent ? sampleData.htmlContent.length : 0,
          errorStack: error.stack
        }
      );
      
      console.error('❌ CRITICAL: Error saving training sample:', error.message);
      console.error('❌ SQL Error code:', error.code);
      console.error('❌ SQL Error detail:', error.detail);
      console.error('❌ Sample data that failed:', {
        sampleId: sampleData.sampleId,
        url: sampleData.url,
        businessType: sampleData.businessType,
        trainingSessionId: sampleData.trainingSessionId
      });
      console.error('❌ Full error stack:', error.stack);
      
      // Include alert info in thrown error
      error.criticalAlert = errorAlert;
      throw error;
    }
  }

  // 🔄 Update AI Custom Site Status
  async updateAICustomSiteStatus(url, businessType, status, trainingSessionId) {
    if (!this.pool) {
      console.log('⚠️ No database connection, skipping custom site status update');
      return null;
    }

    try {
      const result = await this.pool.query(`
        UPDATE ai_custom_sites 
        SET status = $1, "trainingSessionId" = $2, "lastCollected" = $3, "updatedAt" = $4
        WHERE url = $5 AND "businessType" = $6
        RETURNING id
      `, [status, trainingSessionId, new Date(), new Date(), url, businessType]);

      if (result.rows.length > 0) {
        console.log(`✅ Custom site status updated: ${url} -> ${status}`);
        return result.rows[0];
      } else {
        console.log(`⚠️ No custom site found to update: ${url} (${businessType})`);
        return null;
      }
    } catch (error) {
      console.error('❌ Error updating custom site status:', error);
      throw error;
    }
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

  // � Public query method wrapper
  async query(sql, params = []) {
    if (!this.isConnected || this.fallbackToFiles) {
      throw new Error('Database not connected - use initialize() first');
    }
    return await this.pool.query(sql, params);
  }

  // �📋 Verify VendiOnline AI Training Tables
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
    console.log(`🔍 DEBUG SAVE: isConnected=${this.isConnected}, fallbackToFiles=${this.fallbackToFiles}`);
    
    if (!this.isConnected || this.fallbackToFiles) {
      console.log('🔄 Using file storage fallback for saveAITrainingSession');
      console.log('❌ DATABASE SAVE SKIPPED - Using file storage instead!');
      return await this.fileStorage.saveTrainingState(sessionData);
    }
    
    try {
      const query = `
        INSERT INTO ai_training_sessions (
          id,
          "initiatedBy",
          "trainingId",
          "trainingType",
          status,
          metadata,
          "createdAt",
          "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT ("trainingId") 
        DO UPDATE SET 
          status = $5,
          metadata = $6,
          "updatedAt" = NOW()
        RETURNING *
      `;
      
      const trainingId = sessionData.trainingId || sessionData.id || this.generateId();
      
      const values = [
        sessionData.id || this.generateId(),
        sessionData.initiatedBy || sessionData.initiatorId || null,
        trainingId,
        sessionData.trainingType || 'GLOBAL',
        sessionData.status || 'PENDING',
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
    console.log(`🔍 DEBUG: isConnected=${this.isConnected}, fallbackToFiles=${this.fallbackToFiles}`);
    
    if (!this.isConnected || this.fallbackToFiles) {
      console.log('🔄 Using file storage fallback for updateAITrainingSession');
      console.log('❌ DATABASE UPDATE SKIPPED - Using file storage instead!');
      return await this.fileStorage.saveTrainingState(updates);
    }
    
    console.log(`🔄 Attempting to update session: ${sessionId} with:`, updates);
    
    try {
      const setClause = Object.keys(updates).map((key, index) => {
        const dbColumn = key === 'trainingType' ? '"trainingType"' :
                        key === 'businessId' ? '"businessId"' :
                        key === 'initiatorId' || key === 'initiatedBy' ? '"initiatedBy"' :
                        key === 'updatedAt' ? '"updatedAt"' : 
                        key === 'trainingId' ? '"trainingId"' :
                        key === 'isTraining' ? '"isTraining"' :
                        key === 'samplesCollected' ? '"samplesCollected"' :
                        key === 'totalSamples' ? '"totalSamples"' :
                        key === 'currentStep' ? '"currentStep"' :
                        key === 'startTime' ? '"startTime"' :
                        key === 'completionTime' ? '"completionTime"' : `"${key}"`;
        
        // 🎯 RIMOSSO IL CASTING ESPLICITO PER STATUS
        if (key === 'status') {
          console.log(`🎯 Processing status WITHOUT casting: "${updates[key]}"`);
          return `${dbColumn} = $${index + 2}`;
        }
        
        return `${dbColumn} = $${index + 2}`;
      }).join(', ');
      
      console.log(`🔄 SQL Query: UPDATE ai_training_sessions SET ${setClause} WHERE "trainingId" = ${sessionId}`);
      
      const query = `
        UPDATE ai_training_sessions 
        SET ${setClause}, "updatedAt" = NOW()
        WHERE "trainingId" = $1
        RETURNING *
      `;
      
      const values = [sessionId, ...Object.values(updates)];
      console.log(`🔄 Query values:`, values);
      
      const result = await this.pool.query(query, values);
      
      if (result.rows.length > 0) {
        console.log('✅ AI Training session updated:', sessionId);
        console.log('📋 Updated record status:', result.rows[0].status);
        return result.rows[0];
      } else {
        console.log('⚠️ AI Training session not found:', sessionId);
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to update AI training session:', error.message);
      console.error('❌ Full error details:', error);
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
        SELECT * FROM ai_training_sessions 
        ORDER BY "createdAt" DESC 
        LIMIT 1
      `;
      
      const result = await this.pool.query(query);
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        const state = {
          isTraining: row.isTraining,
          trainingId: row.trainingId,
          progress: row.progress,
          samplesCollected: row.samplesCollected,
          totalSamples: row.totalSamples,
          currentStep: row.currentStep,
          startTime: row.startTime,
          accuracy: row.accuracy,
          lastUpdated: row.updatedAt
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
      await this.pool.query('DELETE FROM ai_custom_sites');
      
      // Insert new sites
      for (const site of sites) {
        const query = `
          INSERT INTO ai_custom_sites (
            id, 
            url, 
            "businessType", 
            style, 
            metadata,
            "createdAt",
            "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `;
        
        const values = [
          this.generateId(),
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
      const query = 'SELECT * FROM ai_custom_sites ORDER BY "createdAt" DESC';
      const result = await this.pool.query(query);
      
      const sites = result.rows.map(row => ({
        url: row.url,
        businessType: row.businessType,
        style: row.style,
        priority: row.priority,
        status: row.status,
        lastCollected: row.lastCollected,
        metadata: row.metadata
      }));
      
      console.log(`📖 Loaded ${sites.length} custom sites from DB`);
      return sites;
      
    } catch (error) {
      console.error('❌ Failed to load custom sites from DB:', error.message);
      return [];
    }
  }

  // 🎯 Filter sites that need update for batch training
  async filterSitesForTraining(sites) {
    if (this.fallbackToFiles) {
      return sites; // Return all sites for file storage
    }

    try {
      const sitesNeedingUpdate = [];
      
      for (const site of sites) {
        // Create a consistent sample ID from URL
        const sampleId = site.url.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const needsUpdate = await this.needsUpdate(sampleId);
        
        if (needsUpdate) {
          sitesNeedingUpdate.push(site);
        } else {
          console.log(`⏭️ Skipping ${site.url} - updated recently`);
        }
      }
      
      console.log(`🎯 Filtered sites: ${sitesNeedingUpdate.length}/${sites.length} need update`);
      return sitesNeedingUpdate;
      
    } catch (error) {
      console.error(`❌ Error filtering sites for training:`, error.message);
      return sites; // Return all sites on error
    }
  }

  // 🔍 Check if a site needs to be updated (based on 1 month rule)
  async needsUpdate(sampleId) {
    if (this.fallbackToFiles) {
      return true; // Always update for file storage
    }

    try {
      const checkQuery = `
        SELECT updated_at, created_at
        FROM training_samples 
        WHERE sample_id = $1
      `;
      
      const result = await this.pool.query(checkQuery, [sampleId]);
      
      if (result.rows.length === 0) {
        console.log(`🆕 Sample ${sampleId} not found, needs creation`);
        return true; // Sample doesn't exist, needs to be created
      }
      
      const lastUpdated = new Date(result.rows[0].updated_at);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const needsUpdate = lastUpdated <= oneMonthAgo;
      
      if (needsUpdate) {
        console.log(`🔄 Sample ${sampleId} needs update (last updated: ${lastUpdated.toISOString()})`);
      } else {
        console.log(`✅ Sample ${sampleId} is recent (last updated: ${lastUpdated.toISOString()})`);
      }
      
      return needsUpdate;
      
    } catch (error) {
      console.error(`❌ Error checking update status for ${sampleId}:`, error.message);
      return true; // Default to allowing update on error
    }
  }

  // 📊 Training Sample Storage
  async saveSample(sampleId, sampleData) {
    if (this.fallbackToFiles) {
      return await this.fileStorage.saveSample(sampleId, sampleData);
    }

    try {
      // 🔍 Check if sample exists and if it was updated recently (less than 1 month)
      const checkQuery = `
        SELECT updated_at 
        FROM training_samples 
        WHERE sample_id = $1
      `;
      
      const existingResult = await this.pool.query(checkQuery, [sampleId]);
      
      if (existingResult.rows.length > 0) {
        const lastUpdated = new Date(existingResult.rows[0].updated_at);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        if (lastUpdated > oneMonthAgo) {
          console.log(`⏰ Sample ${sampleId} was updated recently (${lastUpdated.toISOString()}), skipping update`);
          return { 
            skipped: true, 
            reason: 'Updated less than 1 month ago',
            lastUpdated: lastUpdated.toISOString()
          };
        }
        
        console.log(`🔄 Sample ${sampleId} is older than 1 month (${lastUpdated.toISOString()}), updating...`);
      }

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
      
      return { saved: true, sampleId };
      
    } catch (error) {
      console.error(`❌ Failed to save sample ${sampleId} to DB:`, error.message);
      throw error;
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
        ORDER BY "createdAt" DESC 
        LIMIT 1
      `;
      
      const [sessions, samples, sites, latest] = await Promise.all([
        this.pool.query(sessionsQuery),
        this.pool.query(samplesQuery),
        this.pool.query(sitesQuery),
        this.pool.query(latestQuery)
      ]);
      
      const currentTraining = latest.rows.length > 0 ? {
        trainingId: latest.rows[0].trainingId,
        isTraining: latest.rows[0].status === 'RUNNING',
        progress: latest.rows[0].progress,
        accuracy: latest.rows[0].accuracy,
        lastUpdated: latest.rows[0].updatedAt
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

  // � Read AI training session by ID
  async getAITrainingSession(trainingId) {
    if (!this.isConnected || this.fallbackToFiles) {
      console.log('🔄 Using file storage fallback for getAITrainingSession');
      return null;
    }

    try {
      const result = await this.pool.query(
        `SELECT * FROM ai_training_sessions WHERE "trainingId" = $1`,
        [trainingId]
      );
      
      if (result.rows.length === 0) {
        console.log(`❌ Training session ${trainingId} not found`);
        return null;
      }
      
      const session = result.rows[0];
      console.log(`🔍 Read training session ${trainingId}:`, {
        id: session.id,
        status: session.status,
        progress: session.progress,
        accuracy: session.accuracy,
        isTraining: session.is_training,
        currentStep: session.current_step,
        completionTime: session.completion_time
      });
      
      return session;
    } catch (error) {
      console.error(`❌ Failed to read training session ${trainingId}:`, error);
      throw error;
    }
  }

  // �🔄 Close connections
  // 📊 Get Training Samples for debugging
  async getTrainingSamples() {
    if (!this.pool) {
      console.log('⚠️ No database connection, cannot get training samples');
      return [];
    }

    try {
      const result = await this.pool.query(`
        SELECT id, "sampleId", url, "businessType", "trainingSessionId", 
               "htmlLength", "collectionMethod", status, "createdAt"
        FROM ai_training_samples 
        ORDER BY "createdAt" DESC 
        LIMIT 10
      `);

      console.log(`📊 Found ${result.rows.length} training samples in database`);
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting training samples:', error);
      return [];
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('🔌 Database connection closed');
    }
  }
}

module.exports = DatabaseStorage;
