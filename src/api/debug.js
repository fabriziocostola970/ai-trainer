const express = require('express');
const router = express.Router();

// Inline database analysis function to avoid module import issues
async function analyzeDatabase() {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('🔍 ANALISI DETTAGLIATA DATABASE ai_design_patterns\n');
    
    // 1. Count total records by business type
    const countResult = await pool.query(`
      SELECT business_type, COUNT(*) as count
      FROM ai_design_patterns 
      GROUP BY business_type
      ORDER BY count DESC
    `);
    
    console.log('📊 RECORDS BY BUSINESS TYPE:');
    countResult.rows.forEach(row => {
      console.log(`- ${row.business_type}: ${row.count} records`);
    });
    console.log('');
    
    // 2. Analyze florist records in detail
    const floristResult = await pool.query(`
      SELECT id, business_type, tags, source_url, 
             business_images, color_palette, font_families, 
             html_content, css_content, created_at 
      FROM ai_design_patterns 
      WHERE business_type = 'florist' 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('🌸 FLORIST RECORDS (ultimi 5):');
    console.log(`Total florist records: ${floristResult.rows.length}\n`);
    
    floristResult.rows.forEach((row, index) => {
      console.log(`--- RECORD #${index + 1} (ID: ${row.id}) ---`);
      console.log(`Business Type: ${row.business_type}`);
      console.log(`Tags: ${JSON.stringify(row.tags)}`);
      console.log(`Source URL: ${row.source_url ? row.source_url.substring(0,50) + '...' : 'NULL'}`);
      console.log(`Business Images: ${row.business_images ? 'YES (' + Object.keys(row.business_images).length + ' keys)' : 'NO'}`);
      
      if (row.business_images && row.business_images.gallery) {
        console.log(`  Gallery Images: ${row.business_images.gallery.length} items`);
        console.log(`  Gallery URLs: ${row.business_images.gallery.slice(0,2).join(', ')}...`);
      }
      
      console.log(`Color Palette: ${row.color_palette ? 'YES (' + row.color_palette.length + ' colors)' : 'NO'}`);
      console.log(`Font Families: ${row.font_families ? 'YES (' + row.font_families.length + ' fonts)' : 'NO'}`);
      console.log(`HTML Content: ${row.html_content ? row.html_content.substring(0,50) + '...' : 'EMPTY'}`);
      console.log(`CSS Content: ${row.css_content ? row.css_content.substring(0,50) + '...' : 'EMPTY'}`);
      console.log(`Created: ${row.created_at}\n`);
    });
    
    // 3. Check content uniqueness
    const uniqueCheck = await pool.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT html_content) as unique_html,
        COUNT(DISTINCT css_content) as unique_css,
        COUNT(DISTINCT color_palette::text) as unique_colors,
        COUNT(DISTINCT tags::text) as unique_tags,
        COUNT(DISTINCT business_images::text) as unique_images
      FROM ai_design_patterns 
      WHERE business_type = 'florist'
    `);
    
    console.log('🔍 CONTENT UNIQUENESS ANALYSIS:');
    const stats = uniqueCheck.rows[0];
    console.log(`Total Records: ${stats.total_records}`);
    console.log(`Unique HTML: ${stats.unique_html} / ${stats.total_records} (${stats.unique_html === stats.total_records ? '✅ UNIQUE' : '❌ DUPLICATE'})`);
    console.log(`Unique CSS: ${stats.unique_css} / ${stats.total_records} (${stats.unique_css === stats.total_records ? '✅ UNIQUE' : '❌ DUPLICATE'})`);
    console.log(`Unique Colors: ${stats.unique_colors} / ${stats.total_records} (${stats.unique_colors === stats.total_records ? '✅ UNIQUE' : '❌ DUPLICATE'})`);
    console.log(`Unique Tags: ${stats.unique_tags} / ${stats.total_records} (${stats.unique_tags === stats.total_records ? '✅ UNIQUE' : '❌ DUPLICATE'})`);
    console.log(`Unique Images: ${stats.unique_images} / ${stats.total_records} (${stats.unique_images === stats.total_records ? '✅ UNIQUE' : '❌ DUPLICATE'})`);
    
    await pool.end();
    console.log('\n✅ Database analysis completed!');
    
  } catch (error) {
    console.log('❌ Database analysis failed:', error.message);
    await pool.end();
    throw error;
  }
}

// 🔍 GET /api/debug/database - Analyze database content remotely
router.get('/database', async (req, res) => {
  try {
    console.log('🔍 [Debug] Remote database analysis requested');
    
    // Capture console output
    let output = '';
    const originalLog = console.log;
    console.log = (...args) => {
      const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ');
      output += message + '\n';
      originalLog(...args);
    };
    
    // Run analysis
    await analyzeDatabase();
    
    // Restore console.log
    console.log = originalLog;
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      analysis: output,
      summary: {
        message: 'Database analysis completed successfully',
        checkFor: [
          'Content uniqueness (should be UNIQUE, not DUPLICATE)',
          'Business images presence (should have gallery arrays)',
          'Tags diversity (should vary by business type)',
          'HTML/CSS content variation (should be different per site)'
        ]
      }
    });
    
  } catch (error) {
    console.error('❌ [Debug] Database analysis failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 🗑️ GET /api/debug/problems - Quick problem summary
router.get('/problems', async (req, res) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Quick problems check
    const problemsCheck = await pool.query(`
      SELECT 
        business_type,
        COUNT(*) as total_records,
        COUNT(DISTINCT html_content) as unique_html,
        COUNT(DISTINCT tags::text) as unique_tags,
        COUNT(CASE WHEN business_images IS NOT NULL THEN 1 END) as records_with_images
      FROM ai_design_patterns 
      WHERE business_type = 'florist'
      GROUP BY business_type
    `);
    
    await pool.end();
    
    const stats = problemsCheck.rows[0] || {};
    const problems = [];
    
    // Identify problems
    if (stats.unique_html === 1 && stats.total_records > 1) {
      problems.push('❌ All HTML content is identical');
    }
    if (stats.unique_tags === 1 && stats.total_records > 1) {
      problems.push('❌ All tags are identical');
    }
    if (stats.records_with_images === 0) {
      problems.push('❌ No business_images found');
    }
    
    if (problems.length === 0) {
      problems.push('✅ No major problems detected');
    }
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      businessType: 'florist',
      statistics: stats,
      problems: problems,
      needsFix: problems.some(p => p.includes('❌'))
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
