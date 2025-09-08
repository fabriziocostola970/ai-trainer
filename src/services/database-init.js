/**
 * 🗄️ DATABASE INITIALIZATION
 * Crea automaticamente le tabelle mancanti all'avvio
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initializeDatabase() {
  try {
    console.log('🗄️ Initializing database tables...');
    
    // Crea la tabella generated_websites se non esiste
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS generated_websites (
        id SERIAL PRIMARY KEY,
        website_id VARCHAR(255) UNIQUE NOT NULL,
        business_name VARCHAR(255) NOT NULL,
        business_type VARCHAR(100) NOT NULL,
        business_description TEXT,
        html_content TEXT NOT NULL,
        style_preference VARCHAR(100) DEFAULT 'moderno',
        color_mood VARCHAR(100) DEFAULT 'professionale',
        target_audience VARCHAR(100) DEFAULT 'generale',
        generation_metadata JSONB,
        content_length INTEGER,
        images_count INTEGER DEFAULT 0,
        claude_model VARCHAR(50) DEFAULT 'claude-3-sonnet',
        generation_time_ms INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await pool.query(createTableQuery);
    console.log('✅ generated_websites table ready');
    
    // Crea gli indici se non esistono
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_generated_websites_business_type ON generated_websites(business_type);
      CREATE INDEX IF NOT EXISTS idx_generated_websites_created_at ON generated_websites(created_at);
      CREATE INDEX IF NOT EXISTS idx_generated_websites_website_id ON generated_websites(website_id);
    `;
    
    await pool.query(createIndexes);
    console.log('✅ Database indexes ready');
    
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
  }
}

module.exports = { initializeDatabase };
