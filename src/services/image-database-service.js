/**
 * 🗃️ IMAGE DATABASE SERVICE
 * Gestisce il tracking delle immagini nel database per collegamenti sito-immagini
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs').promises;

class ImageDatabaseService {
    constructor() {
        const dbPath = path.join(process.cwd(), 'database', 'ai-trainer.db');
        this.db = new Database(dbPath);
        this.initializeTables();
    }

    /**
     * 🏗️ Inizializza le tabelle se non esistono
     */
    initializeTables() {
        try {
            // Leggi e esegui migration
            const migrationPath = path.join(process.cwd(), 'database', 'migrations', 'add_image_tracking.sql');
            
            // Se il file non esiste, crea le tabelle inline
            const tables = [
                `CREATE TABLE IF NOT EXISTS downloaded_images (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    file_name TEXT NOT NULL UNIQUE,
                    original_url TEXT NOT NULL,
                    local_path TEXT NOT NULL,
                    business_type TEXT NOT NULL,
                    business_name TEXT,
                    category TEXT NOT NULL,
                    file_size INTEGER NOT NULL,
                    content_type TEXT NOT NULL,
                    download_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
                
                `CREATE TABLE IF NOT EXISTS website_images (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    website_id TEXT NOT NULL,
                    image_id INTEGER NOT NULL,
                    usage_context TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (image_id) REFERENCES downloaded_images (id) ON DELETE CASCADE
                )`,

                `CREATE INDEX IF NOT EXISTS idx_downloaded_images_business ON downloaded_images(business_type, business_name)`,
                `CREATE INDEX IF NOT EXISTS idx_downloaded_images_active ON downloaded_images(is_active)`,
                `CREATE INDEX IF NOT EXISTS idx_website_images_website ON website_images(website_id)`
            ];

            tables.forEach(sql => {
                this.db.exec(sql);
            });

            console.log('📊 Image database tables initialized');
        } catch (error) {
            console.error('❌ Error initializing image tables:', error);
        }
    }

    /**
     * 💾 Registra un'immagine scaricata
     */
    registerDownloadedImage(imageData) {
        try {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO downloaded_images 
                (file_name, original_url, local_path, business_type, business_name, category, file_size, content_type, last_used)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `);

            const result = stmt.run(
                imageData.fileName,
                imageData.originalUrl,
                imageData.localPath,
                imageData.businessType,
                imageData.businessName || null,
                imageData.category,
                imageData.size,
                imageData.contentType
            );

            console.log(`📝 Registered image: ${imageData.fileName}`);
            return result.lastInsertRowid;

        } catch (error) {
            console.error('❌ Error registering image:', error);
            return null;
        }
    }

    /**
     * 🔗 Collega immagini a un sito web
     */
    linkImagesToWebsite(websiteId, imageFileNames, usageContext = 'website_generation') {
        try {
            const linkStmt = this.db.prepare(`
                INSERT INTO website_images (website_id, image_id, usage_context)
                SELECT ?, id, ?
                FROM downloaded_images 
                WHERE file_name = ? AND is_active = 1
            `);

            let linkedCount = 0;
            for (const fileName of imageFileNames) {
                const result = linkStmt.run(websiteId, usageContext, fileName);
                if (result.changes > 0) {
                    linkedCount++;
                }
            }

            // Aggiorna last_used per le immagini collegate
            const updateStmt = this.db.prepare(`
                UPDATE downloaded_images 
                SET last_used = CURRENT_TIMESTAMP 
                WHERE file_name IN (${imageFileNames.map(() => '?').join(',')})
            `);
            updateStmt.run(...imageFileNames);

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
    unlinkWebsiteImages(websiteId) {
        try {
            const stmt = this.db.prepare(`
                DELETE FROM website_images 
                WHERE website_id = ?
            `);

            const result = stmt.run(websiteId);
            console.log(`🗑️ Unlinked ${result.changes} images from website ${websiteId}`);
            return result.changes;

        } catch (error) {
            console.error('❌ Error unlinking website images:', error);
            return 0;
        }
    }

    /**
     * 🧹 Trova immagini orfane (non collegate a nessun sito)
     */
    findOrphanImages(olderThanHours = 24) {
        try {
            const stmt = this.db.prepare(`
                SELECT di.*
                FROM downloaded_images di
                LEFT JOIN website_images wi ON di.id = wi.image_id
                WHERE wi.image_id IS NULL 
                AND di.is_active = 1
                AND datetime(di.last_used) < datetime('now', '-${olderThanHours} hours')
                ORDER BY di.last_used ASC
            `);

            const orphans = stmt.all();
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
    markImagesInactive(imageIds) {
        try {
            if (imageIds.length === 0) return 0;

            const stmt = this.db.prepare(`
                UPDATE downloaded_images 
                SET is_active = 0, updated_at = CURRENT_TIMESTAMP
                WHERE id IN (${imageIds.map(() => '?').join(',')})
            `);

            const result = stmt.run(...imageIds);
            console.log(`🗑️ Marked ${result.changes} images as inactive`);
            return result.changes;

        } catch (error) {
            console.error('❌ Error marking images inactive:', error);
            return 0;
        }
    }

    /**
     * 📊 Ottieni statistiche complete
     */
    getDetailedStats() {
        try {
            // Statistiche generali
            const generalStats = this.db.prepare(`
                SELECT 
                    COUNT(*) as total_images,
                    COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_images,
                    COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_images,
                    ROUND(SUM(file_size) / 1024.0 / 1024.0, 2) as total_size_mb,
                    ROUND(SUM(CASE WHEN is_active = 1 THEN file_size ELSE 0 END) / 1024.0 / 1024.0, 2) as active_size_mb
                FROM downloaded_images
            `).get();

            // Immagini collegate vs orfane
            const linkageStats = this.db.prepare(`
                SELECT 
                    COUNT(DISTINCT di.id) as linked_images,
                    COUNT(DISTINCT CASE WHEN wi.image_id IS NULL THEN di.id END) as orphan_images,
                    COUNT(DISTINCT wi.website_id) as linked_websites
                FROM downloaded_images di
                LEFT JOIN website_images wi ON di.id = wi.image_id
                WHERE di.is_active = 1
            `).get();

            // Breakdown per business type
            const businessStats = this.db.prepare(`
                SELECT 
                    business_type,
                    COUNT(*) as images_count,
                    ROUND(SUM(file_size) / 1024.0 / 1024.0, 2) as size_mb
                FROM downloaded_images 
                WHERE is_active = 1
                GROUP BY business_type
                ORDER BY images_count DESC
            `).all();

            // Breakdown per categoria
            const categoryStats = this.db.prepare(`
                SELECT 
                    category,
                    COUNT(*) as images_count,
                    ROUND(SUM(file_size) / 1024.0 / 1024.0, 2) as size_mb
                FROM downloaded_images 
                WHERE is_active = 1
                GROUP BY category
                ORDER BY images_count DESC
            `).all();

            return {
                general: generalStats,
                linkage: linkageStats,
                byBusinessType: businessStats,
                byCategory: categoryStats,
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
    searchImages(criteria = {}) {
        try {
            let whereClause = ['di.is_active = 1'];
            let params = [];

            if (criteria.businessType) {
                whereClause.push('di.business_type = ?');
                params.push(criteria.businessType);
            }

            if (criteria.businessName) {
                whereClause.push('di.business_name LIKE ?');
                params.push(`%${criteria.businessName}%`);
            }

            if (criteria.category) {
                whereClause.push('di.category = ?');
                params.push(criteria.category);
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
                    GROUP_CONCAT(DISTINCT wi.website_id) as linked_websites
                FROM downloaded_images di
                LEFT JOIN website_images wi ON di.id = wi.image_id
                WHERE ${whereClause.join(' AND ')}
                GROUP BY di.id
                ORDER BY di.last_used DESC
                LIMIT ${criteria.limit || 100}
            `;

            const results = this.db.prepare(sql).all(...params);
            return results;

        } catch (error) {
            console.error('❌ Error searching images:', error);
            return [];
        }
    }

    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

module.exports = ImageDatabaseService;
