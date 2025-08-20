const { Pool } = require('pg');

// 🔍 Database Analysis Tool for Railway
async function analyzeDatabase() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:UfARkmBVZfvjhKjCrbJgJZGHlLJZphkJ@autorack.proxy.rlwy.net:20168/railway'
  });

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
    
    // 3. Check content uniqueness (the big problem!)
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
    
    // 4. Check business_images issue specifically
    const imagesCheck = await pool.query(`
      SELECT source_url, business_images
      FROM ai_design_patterns 
      WHERE business_type = 'florist' 
      AND business_images IS NOT NULL
      LIMIT 3
    `);
    
    console.log('\n🖼️ BUSINESS IMAGES CHECK:');
    if (imagesCheck.rows.length === 0) {
      console.log('❌ NO records with business_images found!');
      
      // Check if there's a record without source_url (stock images record)
      const stockCheck = await pool.query(`
        SELECT business_images, created_at
        FROM ai_design_patterns 
        WHERE business_type = 'florist' 
        AND source_url IS NULL
        LIMIT 1
      `);
      
      if (stockCheck.rows.length > 0) {
        console.log('📦 Found stock images record:');
        console.log(`  Images: ${JSON.stringify(stockCheck.rows[0].business_images, null, 2)}`);
      } else {
        console.log('❌ NO stock images record found either!');
      }
    } else {
      imagesCheck.rows.forEach((row, index) => {
        console.log(`Image Record #${index + 1}:`);
        console.log(`  URL: ${row.source_url}`);
        console.log(`  Images: ${JSON.stringify(row.business_images, null, 2)}`);
      });
    }
    
    // 5. Sample identical content check
    console.log('\n🔄 SAMPLE CONTENT COMPARISON:');
    const sampleContent = await pool.query(`
      SELECT source_url, html_content, css_content
      FROM ai_design_patterns 
      WHERE business_type = 'florist' 
      LIMIT 3
    `);
    
    if (sampleContent.rows.length >= 2) {
      const first = sampleContent.rows[0];
      const second = sampleContent.rows[1];
      
      console.log(`Record 1 URL: ${first.source_url}`);
      console.log(`Record 2 URL: ${second.source_url}`);
      console.log(`HTML Identical: ${first.html_content === second.html_content ? '❌ YES' : '✅ NO'}`);
      console.log(`CSS Identical: ${first.css_content === second.css_content ? '❌ YES' : '✅ NO'}`);
    }
    
    await pool.end();
    console.log('\n✅ Database analysis completed!');
    
  } catch (error) {
    console.log('❌ Database analysis failed:', error.message);
    await pool.end();
  }
}

// Export for use in other files or direct execution
if (require.main === module) {
  analyzeDatabase();
}

module.exports = { analyzeDatabase };
