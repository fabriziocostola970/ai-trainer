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
    
    // Crea le tabelle usando lo schema VendiOnline-EU
    const createBusinessesTable = `
      CREATE TABLE IF NOT EXISTS "businesses" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "description" TEXT,
        "stylePreference" TEXT,
        "contactInfo" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
      );
    `;
    
    const createWebsitesTable = `
      CREATE TABLE IF NOT EXISTS "websites" (
        "id" TEXT NOT NULL,
        "businessId" TEXT NOT NULL,
        "content" JSONB NOT NULL,
        "design" JSONB NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'generated',
        "version" INTEGER NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "websites_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "websites_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;
    
    await pool.query(createBusinessesTable);
    await pool.query(createWebsitesTable);
    console.log('✅ businesses and websites tables ready');
    
    // Crea gli indici se non esistono
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS "websites_businessId_idx" ON "websites"("businessId");
      CREATE INDEX IF NOT EXISTS "websites_status_idx" ON "websites"("status");
      CREATE INDEX IF NOT EXISTS "websites_createdAt_idx" ON "websites"("createdAt");
      CREATE INDEX IF NOT EXISTS "businesses_type_idx" ON "businesses"("type");
    `;
    
    await pool.query(createIndexes);
    console.log('✅ Database indexes ready');
    
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
  }
}

module.exports = { initializeDatabase };
