const { Pool } = require('pg');
require('dotenv').config();

async function checkWebsitePages() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('🔌 Connessione al database...');
    
    // Controlla tutte le tabelle del database
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📊 TABELLE NEL DATABASE:');
    allTables.rows.forEach(row => console.log(`- ${row.table_name}`));
    
    // Controlla se esiste la tabella website_pages
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'website_pages'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📊 STRUTTURA TABELLA website_pages:');
    if (result.rows.length === 0) {
      console.log('❌ ERRORE: Tabella website_pages non esiste!');
    } else {
      result.rows.forEach(row => {
        console.log(`- ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }
    
    // Test di inserimento per vedere l'errore specifico
    console.log('\n🧪 TESTING INSERT...');
    try {
      const testQuery = `
        INSERT INTO website_pages (id, "websiteId", name, slug, content, "pageType", "pageOrder", "isHomepage", "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
        RETURNING id; 
      `;
      
      const testResult = await pool.query(testQuery, [
        'test_page_123',
        'test_website_123', 
        'Test Page',
        'test',
        '<html><body>Test</body></html>',
        'homepage',
        0,
        true,
        true
      ]);
      
      console.log('✅ Test INSERT successful:', testResult.rows);
      
      // Cleanup test data
      await pool.query('DELETE FROM website_pages WHERE id = $1', ['test_page_123']);
      
    } catch (testError) {
      console.error('❌ Test INSERT failed:', testError.message);
      console.error('Error detail:', testError.detail);
    }
    
  } catch (err) {
    console.error('❌ Database Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkWebsitePages();