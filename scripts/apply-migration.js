// 🚀 Apply database migration for business_images column
// Run: node scripts/apply-migration.js

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  console.log('🗄️ Starting database migration: add-business-images-column');
  
  // Database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.RAILWAY_DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Test connection
    console.log('🔌 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');

    // Read migration file
    const migrationPath = path.join(__dirname, '../database/migrations/add-business-images-column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Loaded migration SQL');
    console.log('🔄 Applying migration...');

    // Apply migration
    const result = await pool.query(migrationSQL);
    
    console.log('✅ Migration applied successfully!');
    console.log('🎯 business_images column is now available in ai_design_patterns table');
    
    // Verify column exists
    const verifyResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'ai_design_patterns' 
      AND column_name = 'business_images'
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Verification successful:', verifyResult.rows[0]);
    } else {
      console.log('⚠️ Column not found after migration');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
applyMigration().catch(console.error);
