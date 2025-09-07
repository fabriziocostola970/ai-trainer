// 🔄 UNIFIED IMAGE SERVICE - Bilanciamento intelligente Pexels + Unsplash + Storage Locale
// Sistema di fallback automatico con download locale per massima affidabilità

const PexelsServiceClass = require('./pexels-service');
const UnsplashService = require('./unsplash-service');
const ImageDownloadService = require('./image-download-service');

class UnifiedImageService {
  constructor() {
    this.pexels = new PexelsServiceClass();
    this.unsplash = UnsplashService;
    this.downloadService = new ImageDownloadService();
    
    // Configurazione
    this.enableLocalStorage = true;
    this.fallbackToExternal = true;
    
    console.log('🔄 Unified Image Service initialized');
    console.log('📊 Strategy: Pexels → Unsplash → Local Storage');
    console.log('💾 Local storage enabled:', this.enableLocalStorage);
  }

  /**
   * 🎯 Recupera immagini con fallback automatico
   * Strategia: Pexels prima, Unsplash come backup
   */
  async getBusinessImages(businessType, businessName, count = 6) {
    let result = null;
    let errors = [];

    // 🥇 TENTATIVO 1: Pexels (primary)
    try {
      console.log('🔵 Trying Pexels first...');
      result = await this.pexels.getBusinessImages(businessType, businessName, count);
      
      if (result && result.total > 0) {
        console.log(`✅ SUCCESS with Pexels! Found ${result.total} images`);
        result.source = 'pexels';
        
        // 💾 Download locale se abilitato
        if (this.enableLocalStorage) {
          try {
            console.log('💾 Downloading images locally...');
            const localImages = await this.downloadService.downloadBusinessImages(result, businessType);
            
            if (localImages.stats.success > 0) {
              console.log(`✅ Downloaded ${localImages.stats.success} images locally`);
              result.localImages = localImages;
              result.useLocal = true;
            }
          } catch (downloadError) {
            console.warn('⚠️  Local download failed, using external URLs:', downloadError.message);
          }
        }
        
        return result;
      } else {
        throw new Error('No images found in Pexels');
      }
    } catch (error) {
      console.warn(`⚠️  Pexels failed: ${error.message}`);
      errors.push(`Pexels: ${error.message}`);
    }

    // 🥈 TENTATIVO 2: Unsplash (fallback)
    try {
      console.log('🟡 Falling back to Unsplash...');
      result = await this.unsplash.getBusinessImages(businessType, businessName, count);
      
      if (result && result.total > 0) {
        console.log(`✅ SUCCESS with Unsplash fallback! Found ${result.total} images`);
        result.source = 'unsplash';
        
        // 💾 Download locale se abilitato
        if (this.enableLocalStorage) {
          try {
            console.log('💾 Downloading images locally...');
            const localImages = await this.downloadService.downloadBusinessImages(result, businessType);
            
            if (localImages.stats.success > 0) {
              console.log(`✅ Downloaded ${localImages.stats.success} images locally`);
              result.localImages = localImages;
              result.useLocal = true;
            }
          } catch (downloadError) {
            console.warn('⚠️  Local download failed, using external URLs:', downloadError.message);
          }
        }
        
        return result;
      } else {
        throw new Error('No images found in Unsplash');
      }
    } catch (error) {
      console.warn(`⚠️  Unsplash fallback failed: ${error.message}`);
      errors.push(`Unsplash: ${error.message}`);
    }

    // ❌ ENTRAMBI FALLITI
    console.error('❌ Both image services failed!');
    console.error('📝 Errors:', errors);
    
    throw new Error(`All image services failed: ${errors.join(', ')}`);
  }

  /**
   * 🔍 Cerca immagini con fallback automatico
   */
  async searchImages(query, count = 2, orientation = 'landscape') {
    let result = null;
    let errors = [];

    // 🥇 TENTATIVO 1: Pexels
    try {
      console.log(`🔵 [${query}] Trying Pexels first...`);
      result = await this.pexels.searchImages(query, count);
      
      if (result && result.length > 0) {
        console.log(`✅ [${query}] SUCCESS with Pexels! Found ${result.length} images`);
        return result;
      } else {
        throw new Error('No images found');
      }
    } catch (error) {
      console.warn(`⚠️  [${query}] Pexels failed: ${error.message}`);
      errors.push(`Pexels: ${error.message}`);
    }

    // 🥈 TENTATIVO 2: Unsplash
    try {
      console.log(`🟡 [${query}] Falling back to Unsplash...`);
      result = await this.unsplash.searchImages(query, count);
      
      if (result && result.length > 0) {
        console.log(`✅ [${query}] SUCCESS with Unsplash fallback! Found ${result.length} images`);
        return result;
      } else {
        throw new Error('No images found');
      }
    } catch (error) {
      console.warn(`⚠️  [${query}] Unsplash fallback failed: ${error.message}`);
      errors.push(`Unsplash: ${error.message}`);
    }

    // ❌ ENTRAMBI FALLITI
    console.error(`❌ [${query}] Both image services failed!`);
    throw new Error(`All image services failed for "${query}": ${errors.join(', ')}`);
  }

  /**
   * 📊 Ottieni statistiche sui servizi
   */
  async getServiceStatus() {
    const status = {
      pexels: { available: false, error: null },
      unsplash: { available: false, error: null },
      unified: { preferredService: 'pexels', fallbackService: 'unsplash' }
    };

    // Test Pexels
    try {
      await this.pexels.searchImages('test', 1);
      status.pexels.available = true;
    } catch (error) {
      status.pexels.error = error.message;
    }

    // Test Unsplash
    try {
      await this.unsplash.searchImages('test', 1);
      status.unsplash.available = true;
    } catch (error) {
      status.unsplash.error = error.message;
    }

    return status;
  }

  /**
   * 🗂️ Ottieni immagini dalle cache locale o esterna
   */
  getImageUrls(imageData) {
    if (!imageData) return [];

    // Se abbiamo immagini locali, usale
    if (imageData.useLocal && imageData.localImages) {
      const urls = [];
      
      // Hero images
      if (imageData.localImages.hero) {
        urls.push(...imageData.localImages.hero.map(img => img.url));
      }
      
      // Service images
      if (imageData.localImages.services) {
        urls.push(...imageData.localImages.services.map(img => img.url));
      }
      
      // Background images
      if (imageData.localImages.backgrounds) {
        urls.push(...imageData.localImages.backgrounds.map(img => img.url));
      }
      
      return urls;
    }

    // Altrimenti usa le URL esterne
    const urls = [];
    if (imageData.hero) urls.push(...imageData.hero.map(img => img.webformatURL || img.download_url || img.url));
    if (imageData.services) urls.push(...imageData.services.map(img => img.webformatURL || img.download_url || img.url));
    if (imageData.backgrounds) urls.push(...imageData.backgrounds.map(img => img.webformatURL || img.download_url || img.url));
    
    return urls.filter(Boolean);
  }

  /**
   * 📊 Statistiche storage locale
   */
  async getStorageStats() {
    return await this.downloadService.getStorageStats();
  }

  /**
   * 🧹 Pulizia cache locale
   */
  async cleanupLocalImages(maxAgeHours = 24) {
    return await this.downloadService.cleanupOldImages(maxAgeHours);
  }
}

module.exports = new UnifiedImageService();
