const express = require('express');
const router = express.Router();
const { analyzeDatabase } = require('../analyze-database');

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
