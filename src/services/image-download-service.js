/**
 * Image Download Service
 * Downloads and stores images locally on Railway for better performance and control
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const ImageDatabaseService = require('./image-database-service');

class ImageDownloadService {
    constructor() {
        // Directory per le immagini scaricate
        this.imagesDir = path.join(process.cwd(), 'uploads', 'images');
        this.businessImagesDir = path.join(this.imagesDir, 'business');
        
        // Database service per tracking
        this.dbService = new ImageDatabaseService();
        
        // Formati supportati
        this.supportedFormats = ['.jpg', '.jpeg', '.png', '.webp'];
        
        // Timeout per download
        this.downloadTimeout = 30000; // 30 secondi
        
        this.initializeDirectories();
    }

    /**
     * Inizializza le directory necessarie
     */
    async initializeDirectories() {
        try {
            await fs.mkdir(this.imagesDir, { recursive: true });
            await fs.mkdir(this.businessImagesDir, { recursive: true });
            console.log('📁 Directory immagini inizializzate');
        } catch (error) {
            console.error('❌ Errore inizializzazione directory:', error);
        }
    }

    /**
     * Genera un hash univoco per l'URL dell'immagine
     */
    generateImageHash(imageUrl, businessType = '') {
        const data = `${imageUrl}_${businessType}_${Date.now()}`;
        return crypto.createHash('md5').update(data).digest('hex');
    }

    /**
     * Estrae l'estensione del file dall'URL o dal Content-Type
     */
    getFileExtension(url, contentType = '') {
        // Prova dall'URL
        const urlExt = path.extname(url.split('?')[0]).toLowerCase();
        if (this.supportedFormats.includes(urlExt)) {
            return urlExt;
        }

        // Prova dal Content-Type
        if (contentType.includes('jpeg')) return '.jpg';
        if (contentType.includes('png')) return '.png';
        if (contentType.includes('webp')) return '.webp';

        // Default
        return '.jpg';
    }

    /**
     * Download di una singola immagine
     */
    async downloadImage(imageUrl, businessType, category = 'general', businessName = null) {
        try {
            console.log(`📥 Download immagine: ${imageUrl}`);

            // Configurazione richiesta
            const response = await axios({
                method: 'GET',
                url: imageUrl,
                responseType: 'arraybuffer',
                timeout: this.downloadTimeout,
                headers: {
                    'User-Agent': 'VendiOnline-EU/1.0 (AI Business Generator)',
                    'Accept': 'image/*'
                }
            });

            // Verifica che sia un'immagine
            const contentType = response.headers['content-type'] || '';
            if (!contentType.startsWith('image/')) {
                throw new Error(`Non è un'immagine valida: ${contentType}`);
            }

            // Genera nome file univoco
            const hash = this.generateImageHash(imageUrl, businessType);
            const extension = this.getFileExtension(imageUrl, contentType);
            const fileName = `${businessType}_${category}_${hash}${extension}`;
            const filePath = path.join(this.businessImagesDir, fileName);

            // Salva il file
            await fs.writeFile(filePath, response.data);

            // Genera URL relativo per il serving
            const relativeUrl = `/images/business/${fileName}`;

            // 📊 Registra nel database
            const imageData = {
                fileName: fileName,
                originalUrl: imageUrl,
                localPath: filePath,
                businessType: businessType,
                businessName: businessName,
                category: category,
                size: response.data.length,
                contentType: contentType
            };

            const imageId = await this.dbService.registerDownloadedImage(imageData);

            console.log(`✅ Immagine salvata: ${fileName}`);

            return {
                success: true,
                imageId: imageId,
                localPath: filePath,
                fileName: fileName,
                url: relativeUrl,
                originalUrl: imageUrl,
                size: response.data.length,
                contentType: contentType
            };

        } catch (error) {
            console.error(`❌ Errore download immagine ${imageUrl}:`, error.message);
            return {
                success: false,
                error: error.message,
                originalUrl: imageUrl
            };
        }
    }

    /**
     * Download di multiple immagini per un business
     */
    async downloadBusinessImages(imageData, businessType, businessName = null) {
        console.log(`🚀 Inizio download immagini per business: ${businessType} (${businessName || 'senza nome'})`);
        
        const results = [];
        const downloadPromises = [];

        // Organizza le immagini per categoria
        const categories = {
            hero: imageData.hero || [],
            services: imageData.services || [],
            backgrounds: imageData.backgrounds || []
        };

        // Download parallelo per ogni categoria
        for (const [category, images] of Object.entries(categories)) {
            if (!Array.isArray(images)) continue;

            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                const imageUrl = image.webformatURL || image.download_url || image.url;
                
                if (imageUrl) {
                    const promise = this.downloadImage(imageUrl, businessType, `${category}_${i+1}`, businessName)
                        .then(result => ({
                            ...result,
                            category: category,
                            index: i,
                            originalData: image
                        }));
                    
                    downloadPromises.push(promise);
                }
            }
        }

        // Attendi tutti i download
        const downloadResults = await Promise.allSettled(downloadPromises);

        // Processa i risultati
        const processedResults = {
            hero: [],
            services: [],
            backgrounds: [],
            imageIds: [], // ID dal database per linking
            stats: {
                total: downloadPromises.length,
                success: 0,
                failed: 0
            }
        };

        downloadResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                const downloadResult = result.value;
                
                if (downloadResult.success) {
                    processedResults.stats.success++;
                    processedResults.imageIds.push(downloadResult.imageId);
                    processedResults[downloadResult.category].push({
                        url: downloadResult.url,
                        fileName: downloadResult.fileName,
                        localPath: downloadResult.localPath,
                        originalUrl: downloadResult.originalUrl,
                        size: downloadResult.size,
                        contentType: downloadResult.contentType,
                        imageId: downloadResult.imageId
                    });
                } else {
                    processedResults.stats.failed++;
                    console.error(`❌ Download fallito:`, downloadResult);
                }
            } else {
                processedResults.stats.failed++;
                console.error(`❌ Promise fallita:`, result.reason);
            }
        });

        console.log(`📊 Download completato: ${processedResults.stats.success}/${processedResults.stats.total} successi`);

        return processedResults;
    }

    /**
     * Pulizia intelligente basata su collegamenti database
     */
    async smartCleanupOrphanImages(maxAgeHours = 24) {
        try {
            console.log(`🧹 Smart cleanup: rimozione immagini orfane più vecchie di ${maxAgeHours}h`);

            // Trova immagini orfane nel database
            const orphanImages = await this.dbService.findOrphanImages(maxAgeHours);
            
            if (orphanImages.length === 0) {
                console.log('✅ Nessuna immagine orfana trovata');
                return { deleted: 0, errors: 0 };
            }

            let deletedCount = 0;
            let errorCount = 0;

            // Elimina file fisici e marca come inattivi nel database
            for (const image of orphanImages) {
                try {
                    // Verifica che il file esista
                    await fs.access(image.local_path);
                    
                    // Elimina il file fisico
                    await fs.unlink(image.local_path);
                    
                    // Marca come inattivo nel database
                    await this.dbService.markImagesInactive([image.id]);
                    
                    deletedCount++;
                    console.log(`🗑️  Rimossa immagine orfana: ${image.file_name}`);
                    
                } catch (fileError) {
                    console.warn(`⚠️  File già rimosso o non accessibile: ${image.file_name}`);
                    // Marca comunque come inattivo nel database
                    await this.dbService.markImagesInactive([image.id]);
                    errorCount++;
                }
            }

            console.log(`✅ Smart cleanup completato: ${deletedCount} eliminati, ${errorCount} errori`);
            return { deleted: deletedCount, errors: errorCount };

        } catch (error) {
            console.error('❌ Errore smart cleanup:', error);
            return { deleted: 0, errors: 1 };
        }
    }

    /**
     * Pulizia periodica delle immagini vecchie (DEPRECATED - usa smartCleanupOrphanImages)
     */
    async cleanupOldImages(maxAgeHours = 24) {
        console.log('⚠️  cleanupOldImages is deprecated. Use smartCleanupOrphanImages instead.');
        return this.smartCleanupOrphanImages(maxAgeHours);
    }

    /**
     * Ottieni statistiche storage avanzate
     */
    async getStorageStats() {
        try {
            // Statistiche dal database
            const dbStats = await this.dbService.getDetailedStats();
            
            // Statistiche fisiche directory
            const files = await fs.readdir(this.businessImagesDir);
            let totalSize = 0;
            let physicalFiles = 0;

            for (const file of files) {
                try {
                    const filePath = path.join(this.businessImagesDir, file);
                    const stats = await fs.stat(filePath);
                    totalSize += stats.size;
                    physicalFiles++;
                } catch (error) {
                    // File non accessibile, ignora
                }
            }

            return {
                database: dbStats,
                physical: {
                    totalFiles: physicalFiles,
                    totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
                    directory: this.businessImagesDir
                },
                sync: {
                    dbVsPhysical: {
                        dbActive: dbStats?.general?.active_images || 0,
                        physicalFiles: physicalFiles,
                        difference: physicalFiles - (dbStats?.general?.active_images || 0)
                    }
                },
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Errore statistiche storage:', error);
            return { 
                database: null, 
                physical: { totalFiles: 0, totalSizeMB: 0 },
                error: error.message 
            };
        }
    }

    /**
     * 🔗 Collega immagini a un website (per tracking lifecycle)
     */
    async linkImagesToWebsite(websiteId, imageFileNames, usageContext = 'claude_generation') {
        return await this.dbService.linkImagesToWebsite(websiteId, imageFileNames, usageContext);
    }

    /**
     * 🗑️ Scollega immagini quando un website viene rimosso
     */
    async unlinkWebsiteImages(websiteId) {
        return await this.dbService.unlinkWebsiteImages(websiteId);
    }

    /**
     * 🔍 Cerca immagini nel database
     */
    async searchImages(criteria) {
        return await this.dbService.searchImages(criteria);
    }
}

module.exports = ImageDownloadService;
