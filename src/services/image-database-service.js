/**
 * 🗃️ IMAGE DATABASE SERVICE
 * Gestisce il tracking delle immagini nel database PostgreSQL per collegamenti sito-immagini
 */

const { Pool } = require('pg');

class ImageDatabaseService {
    constructor() {
        // Usa la connessione PostgreSQL esistente
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        this.initializeTables();
    }

    /**
     * 🏗️ Inizializza le tabelle se non esistono
     */
    async initializeTables() {
        try {
            const client = await this.pool.connect();
            
            // Crea le tabelle se non esistono
            await client.query(`
                CREATE TABLE IF NOT EXISTS downloaded_images (
                    id SERIAL PRIMARY KEY,
                    file_name TEXT NOT NULL UNIQUE,
                    original_url TEXT NOT NULL,
                    local_path TEXT NOT NULL,
                    business_type TEXT NOT NULL,
                    business_name TEXT,
                    category TEXT NOT NULL,
                    file_size INTEGER NOT NULL,
                    content_type TEXT NOT NULL,
                    download_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await client.query(`
                CREATE TABLE IF NOT EXISTS website_images (
                    id SERIAL PRIMARY KEY,
                    website_id TEXT NOT NULL,
                    image_id INTEGER NOT NULL,
                    usage_context TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (image_id) REFERENCES downloaded_images (id) ON DELETE CASCADE
                )
            `);

            // Crea indici se non esistono
            await client.query(`CREATE INDEX IF NOT EXISTS idx_downloaded_images_business ON downloaded_images(business_type, business_name)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_downloaded_images_active ON downloaded_images(is_active)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_downloaded_images_last_used ON downloaded_images(last_used)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_website_images_website ON website_images(website_id)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_website_images_image ON website_images(image_id)`);

            client.release();
            console.log('📊 Image database tables initialized in PostgreSQL');
        } catch (error) {
            console.error('❌ Error initializing image tables:', error);
        }
    }

    /**
     * 💾 Registra un'immagine scaricata
     */
    async registerDownloadedImage(imageData) {
        try {
            const client = await this.pool.connect();
            
            const result = await client.query(`
                INSERT INTO downloaded_images 
                (file_name, original_url, local_path, business_type, business_name, category, file_size, content_type, last_used)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
                ON CONFLICT (file_name) DO UPDATE SET
                    last_used = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING id
            `, [
                imageData.fileName,
                imageData.originalUrl,
                imageData.localPath,
                imageData.businessType,
                imageData.businessName || null,
                imageData.category,
                imageData.size,
                imageData.contentType
            ]);

            client.release();
            
            const imageId = result.rows[0]?.id;
            console.log(`📝 Registered image: ${imageData.fileName} (ID: ${imageId})`);
            return imageId;

        } catch (error) {
            console.error('❌ Error registering image:', error);
            return null;
        }
    }

    /**
     * 🔗 Collega immagini a un sito web
     */
    async linkImagesToWebsite(websiteId, imageFileNames, usageContext = 'website_generation') {
        try {
            const client = await this.pool.connect();
            let linkedCount = 0;

            for (const fileName of imageFileNames) {
                const result = await client.query(`
                    INSERT INTO website_images (website_id, image_id, usage_context)
                    SELECT $1, id, $2
                    FROM downloaded_images 
                    WHERE file_name = $3 AND is_active = true
                `, [websiteId, usageContext, fileName]);

                if (result.rowCount > 0) {
                    linkedCount++;
                }
            }

            // Aggiorna last_used per le immagini collegate
            if (imageFileNames.length > 0) {
                const placeholders = imageFileNames.map((_, i) => `$${i + 1}`).join(',');
                await client.query(`
                    UPDATE downloaded_images 
                    SET last_used = CURRENT_TIMESTAMP 
                    WHERE file_name IN (${placeholders})
                `, imageFileNames);
            }

            client.release();
            console.log(`🔗 Linked ${linkedCount} images to website ${websiteId}`);
            return linkedCount;

        } catch (error) {
            console.error('❌ Error linking images to website:', error);
            return 0;
        }
    }

    /**
     * 🗑️ Rimuovi collegamenti quando un sito viene eliminato
     */
    async unlinkWebsiteImages(websiteId) {
        try {
            const client = await this.pool.connect();
            
            const result = await client.query(`
                DELETE FROM website_images 
                WHERE website_id = $1
            `, [websiteId]);

            client.release();
            console.log(`🗑️ Unlinked ${result.rowCount} images from website ${websiteId}`);
            return result.rowCount;

        } catch (error) {
            console.error('❌ Error unlinking website images:', error);
            return 0;
        }
    }

    /**
     * 🧹 Trova immagini orfane (non collegate a nessun sito)
     */
    async findOrphanImages(olderThanHours = 24) {
        try {
            const client = await this.pool.connect();
            
            const result = await client.query(`
                SELECT di.*
                FROM downloaded_images di
                LEFT JOIN website_images wi ON di.id = wi.image_id
                WHERE wi.image_id IS NULL 
                AND di.is_active = true
                AND di.last_used < NOW() - INTERVAL '${olderThanHours} hours'
                ORDER BY di.last_used ASC
            `);

            client.release();
            
            const orphans = result.rows;
            console.log(`🔍 Found ${orphans.length} orphan images older than ${olderThanHours}h`);
            return orphans;

        } catch (error) {
            console.error('❌ Error finding orphan images:', error);
            return [];
        }
    }

    /**
     * 🗑️ Marca immagini come inattive (soft delete)
     */
    async markImagesInactive(imageIds) {
        try {
            if (imageIds.length === 0) return 0;

            const client = await this.pool.connect();
            
            const placeholders = imageIds.map((_, i) => `$${i + 1}`).join(',');
            const result = await client.query(`
                UPDATE downloaded_images 
                SET is_active = false, updated_at = CURRENT_TIMESTAMP
                WHERE id IN (${placeholders})
            `, imageIds);

            client.release();
            console.log(`🗑️ Marked ${result.rowCount} images as inactive`);
            return result.rowCount;

        } catch (error) {
            console.error('❌ Error marking images inactive:', error);
            return 0;
        }
    }

    /**
     * 📊 Ottieni statistiche complete
     */
    async getDetailedStats() {
        try {
            const client = await this.pool.connect();

            // Statistiche generali
            const generalResult = await client.query(`
                SELECT 
                    COUNT(*) as total_images,
                    COUNT(CASE WHEN is_active = true THEN 1 END) as active_images,
                    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_images,
                    ROUND(SUM(file_size) / 1024.0 / 1024.0, 2) as total_size_mb,
                    ROUND(SUM(CASE WHEN is_active = true THEN file_size ELSE 0 END) / 1024.0 / 1024.0, 2) as active_size_mb
                FROM downloaded_images
            `);

            // Immagini collegate vs orfane
            const linkageResult = await client.query(`
                SELECT 
                    COUNT(DISTINCT di.id) as linked_images,
                    COUNT(DISTINCT CASE WHEN wi.image_id IS NULL THEN di.id END) as orphan_images,
                    COUNT(DISTINCT wi.website_id) as linked_websites
                FROM downloaded_images di
                LEFT JOIN website_images wi ON di.id = wi.image_id
                WHERE di.is_active = true
            `);

            // Breakdown per business type
            const businessResult = await client.query(`
                SELECT 
                    business_type,
                    COUNT(*) as images_count,
                    ROUND(SUM(file_size) / 1024.0 / 1024.0, 2) as size_mb
                FROM downloaded_images 
                WHERE is_active = true
                GROUP BY business_type
                ORDER BY images_count DESC
            `);

            // Breakdown per categoria
            const categoryResult = await client.query(`
                SELECT 
                    category,
                    COUNT(*) as images_count,
                    ROUND(SUM(file_size) / 1024.0 / 1024.0, 2) as size_mb
                FROM downloaded_images 
                WHERE is_active = true
                GROUP BY category
                ORDER BY images_count DESC
            `);

            client.release();

            return {
                general: generalResult.rows[0],
                linkage: linkageResult.rows[0],
                byBusinessType: businessResult.rows,
                byCategory: categoryResult.rows,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error getting detailed stats:', error);
            return null;
        }
    }

    /**
     * 🔍 Cerca immagini per criteri
     */
    async searchImages(criteria = {}) {
        try {
            const client = await this.pool.connect();
            
            let whereClause = ['di.is_active = true'];
            let params = [];
            let paramCount = 1;

            if (criteria.businessType) {
                whereClause.push(`di.business_type = $${paramCount}`);
                params.push(criteria.businessType);
                paramCount++;
            }

            if (criteria.businessName) {
                whereClause.push(`di.business_name ILIKE $${paramCount}`);
                params.push(`%${criteria.businessName}%`);
                paramCount++;
            }

            if (criteria.category) {
                whereClause.push(`di.category = $${paramCount}`);
                params.push(criteria.category);
                paramCount++;
            }

            if (criteria.linkedOnly) {
                whereClause.push('wi.image_id IS NOT NULL');
            }

            if (criteria.orphanOnly) {
                whereClause.push('wi.image_id IS NULL');
            }

            const sql = `
                SELECT 
                    di.*,
                    COUNT(wi.id) as website_links,
                    STRING_AGG(DISTINCT wi.website_id, ',') as linked_websites
                FROM downloaded_images di
                LEFT JOIN website_images wi ON di.id = wi.image_id
                WHERE ${whereClause.join(' AND ')}
                GROUP BY di.id
                ORDER BY di.last_used DESC
                LIMIT ${criteria.limit || 100}
            `;

            const result = await client.query(sql, params);
            client.release();
            
            return result.rows;

        } catch (error) {
            console.error('❌ Error searching images:', error);
            return [];
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
        }
    }
}

module.exports = ImageDatabaseService;
