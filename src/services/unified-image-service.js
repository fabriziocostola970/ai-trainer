// 🔄 UNIFIED IMAGE SERVICE - Bilanciamento intelligente Pexels + Unsplash
// Sistema di fallback automatico per massima affidabilità

const PexelsServiceClass = require('./pexels-service');
const UnsplashService = require('./unsplash-service');

class UnifiedImageService {
  constructor() {
    this.pexels = new PexelsServiceClass();
    this.unsplash = UnsplashService;
    
    console.log('🔄 Unified Image Service initialized');
    console.log('📊 Strategy: Pexels → Unsplash fallback');
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
}

module.exports = new UnifiedImageService();
