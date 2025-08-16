const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const router = express.Router();

/**
 * 🔧 Database Schema Management API
 * POST /api/admin/apply-schema
 */
router.post('/apply-schema', async (req, res) => {
  console.log('🎨 Schema application request received');
  
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not configured');
    }
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    const client = await pool.connect();
    
    // Read schema file
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema-visual-extension.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('⚡ Applying visual extension schema...');
    await client.query(schemaSQL);
    
    // Verify tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('design_patterns', 'color_harmonies', 'visual_analytics')
      ORDER BY table_name;
    `);
    
    client.release();
    await pool.end();
    
    console.log('✅ Schema applied successfully');
    
    res.json({
      success: true,
      message: 'Visual extension schema applied successfully',
      tables_created: tablesResult.rows.map(row => row.table_name),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Schema application failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Schema application failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 🔍 Database Status Check API
 * GET /api/admin/schema-status
 */
router.get('/schema-status', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not configured');
    }
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    const client = await pool.connect();
    
    // Check if visual extension tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('design_patterns', 'color_harmonies', 'visual_analytics')
      ORDER BY table_name;
    `);
    
    // Count records in design_patterns if it exists
    let recordCount = 0;
    if (tablesResult.rows.some(row => row.table_name === 'design_patterns')) {
      const countResult = await client.query('SELECT COUNT(*) FROM design_patterns');
      recordCount = parseInt(countResult.rows[0].count);
    }
    
    client.release();
    await pool.end();
    
    res.json({
      success: true,
      schema_status: 'connected',
      tables_exist: tablesResult.rows.map(row => row.table_name),
      design_patterns_count: recordCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Schema status check failed:', error);
    
    res.json({
      success: false,
      schema_status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
