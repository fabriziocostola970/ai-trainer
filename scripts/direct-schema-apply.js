#!/usr/bin/env node

/**
 * 🚀 Direct Schema Application Script
 * Applica direttamente lo schema al database Railway AI-Trainer
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function applySchema() {
  console.log('🎨 AI-Trainer Database Schema Application');
  console.log('==========================================');
  
  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not found');
    console.log('💡 Set it with: export DATABASE_URL="your_railway_postgres_url"');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔌 Connecting to Railway PostgreSQL...');
    const client = await pool.connect();
    
    console.log('📋 Reading schema file...');
    const schemaPath = path.join(__dirname, '..', 'database', 'schema-visual-extension.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('⚡ Executing schema...');
    await client.query(schemaSQL);
    
    console.log('✅ Schema applied successfully!');
    
    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('design_patterns', 'color_harmonies', 'visual_analytics')
      ORDER BY table_name;
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('📊 Created tables:');
      tablesResult.rows.forEach(row => {
        console.log(`  ✓ ${row.table_name}`);
      });
    } else {
      console.log('⚠️  No visual extension tables found');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Schema application failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  applySchema();
}

module.exports = { applySchema };
