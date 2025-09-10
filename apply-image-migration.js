const { Pool } = require('pg');
const fs = require('fs');

async function applyMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const sql = fs.readFileSync('./database/migrations/001_create_image_tables.sql', 'utf8');
    console.log('🚀 Applying image tables migration...');
    
    await pool.query(sql);
    console.log('✅ Migration applied successfully!');
    
    // Verifica che le tabelle siano state create
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('downloaded_images', 'website_images')
      ORDER BY table_name
    `);
    
    console.log('📊 Created tables:', result.rows.map(r => r.table_name));
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

applyMigration();
