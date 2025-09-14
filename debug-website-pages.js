const { Pool } = require('pg');
require('dotenv').config();

async function debugWebsitePages() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const websiteId = 'cmfjzwz8w000lqv35gf4hcw0i';

  try {
    console.log('🔍 [DEBUG] Controllo pagine per websiteId:', websiteId);
    
    // 1. Controlla se il website esiste
    const websiteCheck = await pool.query(`
      SELECT id, "businessId", status, "createdAt"
      FROM websites 
      WHERE id = $1
    `, [websiteId]);
    
    console.log('🌐 [DEBUG] Website trovato:', websiteCheck.rows);
    
    // 2. Controlla TUTTE le pagine per questo websiteId (anche inattive)
    const allPagesQuery = `
      SELECT id, name, slug, content, "pageType", "pageOrder", "isHomepage", "isActive", "createdAt"
      FROM website_pages 
      WHERE "websiteId" = $1
      ORDER BY "createdAt" ASC
    `;
    
    const allPages = await pool.query(allPagesQuery, [websiteId]);
    console.log(`📄 [DEBUG] Totale pagine trovate: ${allPages.rows.length}`);
    
    if (allPages.rows.length > 0) {
      allPages.rows.forEach(page => {
        console.log(`- ${page.name} (${page.slug}) - Type: ${page.pageType} - Active: ${page.isActive} - Homepage: ${page.isHomepage}`);
        console.log(`  Content length: ${page.content ? page.content.length : 0} chars`);
      });
    } else {
      console.log('❌ [DEBUG] NESSUNA PAGINA TROVATA PER QUESTO WEBSITE!');
      
      // 3. Controlla se ci sono pagine per altri websiteId
      const otherPages = await pool.query(`
        SELECT "websiteId", COUNT(*) as count
        FROM website_pages 
        GROUP BY "websiteId"
        ORDER BY count DESC
        LIMIT 5
      `);
      
      console.log('📊 [DEBUG] Altri website con pagine:');
      otherPages.rows.forEach(row => {
        console.log(`- WebsiteId: ${row.websiteId} - Pagine: ${row.count}`);
      });
    }
    
    // 4. Controlla solo pagine attive
    const activePagesQuery = `
      SELECT id, name, slug, "pageType", "isActive"
      FROM website_pages 
      WHERE "websiteId" = $1 AND "isActive" = true
      ORDER BY "pageOrder" ASC, "createdAt" ASC
    `;
    
    const activePages = await pool.query(activePagesQuery, [websiteId]);
    console.log(`✅ [DEBUG] Pagine ATTIVE trovate: ${activePages.rows.length}`);
    
    activePages.rows.forEach(page => {
      console.log(`- ATTIVA: ${page.name} (${page.slug}) - Type: ${page.pageType}`);
    });
    
  } catch (err) {
    console.error('❌ [DEBUG] Errore:', err.message);
  } finally {
    await pool.end();
  }
}

debugWebsitePages();