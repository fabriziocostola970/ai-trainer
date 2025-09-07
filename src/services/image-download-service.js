/**
 * Image Download Service
 * Downloads and stores images locally on Railway for better performance and control
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

class ImageDownloadService {
    constructor() {
        // Directory per le immagini scaricate
        this.imagesDir = path.join(process.cwd(), 'uploads', 'images');
        this.businessImagesDir = path.join(this.imagesDir, 'business');
        
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
    async downloadImage(imageUrl, businessType, category = 'general') {
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

            console.log(`✅ Immagine salvata: ${fileName}`);

            return {
                success: true,
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
    async downloadBusinessImages(imageData, businessType) {
        console.log(`🚀 Inizio download immagini per business: ${businessType}`);
        
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
                    const promise = this.downloadImage(imageUrl, businessType, `${category}_${i+1}`)
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
                    processedResults[downloadResult.category].push({
                        url: downloadResult.url,
                        fileName: downloadResult.fileName,
                        localPath: downloadResult.localPath,
                        originalUrl: downloadResult.originalUrl,
                        size: downloadResult.size,
                        contentType: downloadResult.contentType
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
     * Pulizia periodica delle immagini vecchie
     */
    async cleanupOldImages(maxAgeHours = 24) {
        try {
            const files = await fs.readdir(this.businessImagesDir);
            const now = Date.now();
            let deletedCount = 0;

            for (const file of files) {
                const filePath = path.join(this.businessImagesDir, file);
                const stats = await fs.stat(filePath);
                const ageHours = (now - stats.mtime.getTime()) / (1000 * 60 * 60);

                if (ageHours > maxAgeHours) {
                    await fs.unlink(filePath);
                    deletedCount++;
                }
            }

            if (deletedCount > 0) {
                console.log(`🧹 Pulite ${deletedCount} immagini vecchie`);
            }

        } catch (error) {
            console.error('❌ Errore pulizia immagini:', error);
        }
    }

    /**
     * Ottieni statistiche storage
     */
    async getStorageStats() {
        try {
            const files = await fs.readdir(this.businessImagesDir);
            let totalSize = 0;

            for (const file of files) {
                const filePath = path.join(this.businessImagesDir, file);
                const stats = await fs.stat(filePath);
                totalSize += stats.size;
            }

            return {
                totalFiles: files.length,
                totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
                directory: this.businessImagesDir
            };

        } catch (error) {
            console.error('❌ Errore statistiche storage:', error);
            return { totalFiles: 0, totalSizeMB: 0 };
        }
    }
}

module.exports = ImageDownloadService;
