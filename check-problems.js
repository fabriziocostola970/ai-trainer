const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkProblems() {
  try {
    console.log('🔍 Checking database problems...');
    
    // 1. Check tags problem
    const tagsResult = await pool.query(`
      SELECT business_type, tags, source_url, created_at 
      FROM ai_design_patterns 
      WHERE business_type = 'florist' 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\n📊 TAGS PROBLEM - Recent florist records:');
    tagsResult.rows.forEach(row => {
      console.log(`- Type: ${row.business_type}, Tags: ${JSON.stringify(row.tags)}, URL: ${row.source_url?.substring(0,30)}...`);
    });
    
    // 2. Check business_images problem
    const imagesResult = await pool.query(`
      SELECT business_type, business_images, source_url 
      FROM ai_design_patterns 
      WHERE business_type = 'florist' 
      AND business_images IS NOT NULL
      LIMIT 3
    `);
    
    console.log('\n🖼️ BUSINESS_IMAGES - Records with images:');
    if (imagesResult.rows.length === 0) {
      console.log('❌ NO business_images found for florist!');
    } else {
      imagesResult.rows.forEach(row => {
        const images = row.business_images;
        console.log(`- URL: ${row.source_url?.substring(0,30)}...`);
        console.log(`  Gallery count: ${images?.gallery?.length || 'NO GALLERY'}`);
      });
    }
    
    // 3. Check content duplication
    const duplicateResult = await pool.query(`
      SELECT business_type, COUNT(*) as count,
             COUNT(DISTINCT html_content) as unique_html,
             COUNT(DISTINCT css_content) as unique_css,
             COUNT(DISTINCT color_palette) as unique_colors
      FROM ai_design_patterns 
      WHERE business_type = 'florist'
      GROUP BY business_type
    `);
    
    console.log('\n📋 CONTENT DUPLICATION:');
    duplicateResult.rows.forEach(row => {
      console.log(`- Business: ${row.business_type}`);
      console.log(`  Total records: ${row.count}`);
      console.log(`  Unique HTML: ${row.unique_html} (${row.unique_html === row.count ? '✅' : '❌ DUPLICATE'})`);
      console.log(`  Unique CSS: ${row.unique_css} (${row.unique_css === row.count ? '✅' : '❌ DUPLICATE'})`);
      console.log(`  Unique Colors: ${row.unique_colors} (${row.unique_colors === row.count ? '✅' : '❌ DUPLICATE'})`);
    });
    
    await pool.end();
  } catch (error) {
    console.log('❌ Database check failed:', error.message);
  }
}

checkProblems();
