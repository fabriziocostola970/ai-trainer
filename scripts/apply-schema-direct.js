// Quick fix script to apply design_patterns schema
// Applica direttamente lo schema al database Railway

const { Pool } = require('pg');

const applyDesignSchema = async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🗄️ Applying design_patterns schema to Railway database...');
    
    // Create design_patterns table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS design_patterns (
          id SERIAL PRIMARY KEY,
          business_type VARCHAR(100) NOT NULL,
          source_url VARCHAR(2048),
          pattern_type VARCHAR(50) NOT NULL,
          
          -- Dati colori
          primary_color VARCHAR(7),
          secondary_color VARCHAR(7),
          accent_color VARCHAR(7),
          background_color VARCHAR(7),
          text_color VARCHAR(7),
          color_palette JSONB,
          
          -- Dati tipografia
          primary_font VARCHAR(100),
          secondary_font VARCHAR(100),
          font_weights JSONB,
          font_sizes JSONB,
          
          -- Dati layout
          layout_style VARCHAR(50),
          grid_system VARCHAR(50),
          spacing_scale JSONB,
          
          -- Dati imagery
          image_style VARCHAR(50),
          image_treatment VARCHAR(50),
          
          -- Metriche di efficacia
          usage_count INTEGER DEFAULT 0,
          effectiveness_score DECIMAL(3,2) DEFAULT 0.00,
          user_feedback_avg DECIMAL(3,2) DEFAULT 0.00,
          
          -- Metadata
          extraction_method VARCHAR(50) DEFAULT 'automated',
          confidence_level DECIMAL(3,2) DEFAULT 0.00,
          tags JSONB,
          
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ design_patterns table created');
    
    // Insert some basic patterns for testing
    await pool.query(`
      INSERT INTO design_patterns (
        business_type, pattern_type, layout_style,
        primary_color, secondary_color, accent_color, background_color, text_color,
        effectiveness_score, usage_count
      ) VALUES 
      ('restaurant', 'color_palette', 'modern', '#8B4513', '#D2691E', '#FFD700', '#FFFFFF', '#333333', 8.5, 10),
      ('business', 'color_palette', 'modern', '#2563EB', '#1E40AF', '#F59E0B', '#FFFFFF', '#1F2937', 9.0, 15),
      ('health', 'color_palette', 'modern', '#059669', '#065F46', '#10B981', '#F0FDF4', '#1F2937', 8.8, 8)
      ON CONFLICT DO NOTHING;
    `);
    
    console.log('✅ Sample design patterns inserted');
    
    // Check what was created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = 'design_patterns';
    `);
    
    console.log('📊 Tables found:', result.rows);
    
    const patterns = await pool.query('SELECT COUNT(*) FROM design_patterns');
    console.log('🎨 Pattern count:', patterns.rows[0].count);
    
  } catch (error) {
    console.error('❌ Error applying schema:', error);
  } finally {
    await pool.end();
  }
};

// Run if called directly
if (require.main === module) {
  applyDesignSchema().then(() => {
    console.log('🎯 Schema application complete');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Schema application failed:', error);
    process.exit(1);
  });
}

module.exports = { applyDesignSchema };
