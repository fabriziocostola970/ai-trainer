/**
 * TEST COMPLETO HOMEPAGE CON TRACKING COSTI
 * Verifica che la homepage ora includa pageId nella risposta
 */

const { Pool } = require('pg');

// Configurazione database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ai_trainer_user:your_secure_password@localhost:5432/ai_trainer_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testHomepageComplete() {
  try {
    console.log('🧪 Testing homepage pageId integration...');
    
    // Test 1: Verifica che tutti i record generation_costs abbiano pageId
    console.log('\n📊 CHECKING CURRENT GENERATION_COSTS...');
    const costsQuery = `
      SELECT 
        id,
        "websiteId",
        "businessId", 
        "pageId",
        "totalCost",
        "generationMode",
        "createdAt"
      FROM generation_costs 
      ORDER BY "createdAt" DESC
      LIMIT 10;
    `;
    
    const costsResult = await pool.query(costsQuery);
    console.log(`💰 Found ${costsResult.rows.length} cost records:`);
    
    let nullPageIds = 0;
    costsResult.rows.forEach((row, i) => {
      const status = row.pageId ? '✅' : '❌';
      if (!row.pageId) nullPageIds++;
      
      console.log(`${status} [${i+1}] Website: ${row.websiteId?.substring(0,8)}...`);
      console.log(`   📄 PageId: ${row.pageId || 'NULL'}`);
      console.log(`   💰 Cost: $${row.totalCost} (${row.generationMode})`);
      console.log(`   🕐 Date: ${row.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    });
    
    console.log(`\n📈 SUMMARY: ${nullPageIds} records with NULL pageId`);
    
    // Test 2: Verifica foreign keys
    console.log('\n🔗 CHECKING FOREIGN KEY RELATIONSHIPS...');
    const fkQuery = `
      SELECT 
        gc.id as cost_id,
        gc."pageId",
        wp.id as page_exists,
        wp.name as page_name,
        wp.slug as page_slug
      FROM generation_costs gc
      LEFT JOIN website_pages wp ON gc."pageId" = wp.id
      WHERE gc."pageId" IS NOT NULL
      ORDER BY gc."createdAt" DESC;
    `;
    
    const fkResult = await pool.query(fkQuery);
    console.log(`🔗 Found ${fkResult.rows.length} cost records with pageId:`);
    
    fkResult.rows.forEach((row, i) => {
      const status = row.page_exists ? '✅' : '❌';
      console.log(`${status} [${i+1}] PageId: ${row.pageId?.substring(0,12)}...`);
      console.log(`   📄 Page: ${row.page_name || 'NOT FOUND'} (${row.page_slug || 'N/A'})`);
      console.log('');
    });
    
    // Test 3: Conta pages per type
    console.log('\n📊 PAGES BY TYPE:');
    const typesQuery = `
      SELECT 
        "pageType",
        "isHomepage",
        COUNT(*) as count,
        MAX("createdAt") as latest
      FROM website_pages 
      GROUP BY "pageType", "isHomepage"
      ORDER BY count DESC;
    `;
    
    const typesResult = await pool.query(typesQuery);
    typesResult.rows.forEach(row => {
      const icon = row.isHomepage ? '🏠' : '📄';
      console.log(`${icon} ${row.pageType}: ${row.count} pages (latest: ${row.latest.toISOString().split('T')[0]})`);
    });
    
    console.log('\n✅ Test completed! Check results above.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

// Run test
testHomepageComplete();