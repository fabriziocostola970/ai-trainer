// 🖼️ IMAGE SERVICE MANAGER - Unified service for multiple image providers
// Tries Pexels first (more permissive), fallback to Unsplash if needed

const UnsplashService = require('./unsplash-service');
const PexelsService = require('./pexels-service');

class ImageService {
  constructor() {
    this.pexelsService = new PexelsService();
    this.unsplashService = new UnsplashService();
    
    console.log('🖼️ Unified Image Service initialized');
    console.log('📱 Available providers: Pexels, Unsplash');
  }

  /**
   * 🎯 Recupera immagini per business - prova prima Pexels, poi Unsplash
   * @param {string} businessType - Tipo di business
   * @param {string} businessName - Nome del business  
   * @param {number} count - Numero di immagini
   * @returns {Promise<Object>} Immagini categorizzate
   */
  async getBusinessImages(businessType, businessName, count = 6) {
    try {
      console.log(`🚀 Starting image search for: ${businessType} - ${businessName}`);
      
      // 🥇 PRIMA SCELTA: Pexels (più permissivo)
      console.log('🔄 Trying Pexels API first...');
      const pexelsResult = await this.pexelsService.getBusinessImages(businessType, businessName, count);
      
      if (pexelsResult.total > 0) {
        console.log(`✅ Pexels SUCCESS: Found ${pexelsResult.total} images`);
        pexelsResult.provider = 'pexels';
        return pexelsResult;
      }
      
      // 🥈 SECONDA SCELTA: Unsplash (fallback)
      console.log('🔄 Pexels failed, trying Unsplash as fallback...');
      const unsplashResult = await this.unsplashService.getBusinessImages(businessType, businessName, count);
      
      if (unsplashResult.total > 0) {
        console.log(`✅ Unsplash SUCCESS: Found ${unsplashResult.total} images`);
        unsplashResult.provider = 'unsplash';
        return unsplashResult;
      }
      
      // 🚨 NESSUN PROVIDER FUNZIONA
      console.log('❌ Both Pexels and Unsplash failed');
      return this.getEmptyResult(businessType, businessName);
      
    } catch (error) {
      console.error('❌ Image Service Error:', error);
      return this.getEmptyResult(businessType, businessName);
    }
  }

  /**
   * 🔍 Cerca immagini specifiche con provider preference
   */
  async searchImages(query, count = 2, preferredProvider = 'pexels') {
    try {
      if (preferredProvider === 'pexels') {
        const pexelsImages = await this.pexelsService.searchImages(query, count);
        if (pexelsImages.length > 0) return pexelsImages;
        
        console.log('⚠️ Pexels failed, trying Unsplash...');
        return await this.unsplashService.searchImages(query, count);
      } else {
        const unsplashImages = await this.unsplashService.searchImages(query, count);
        if (unsplashImages.length > 0) return unsplashImages;
        
        console.log('⚠️ Unsplash failed, trying Pexels...');
        return await this.pexelsService.searchImages(query, count);
      }
    } catch (error) {
      console.error(`❌ Search error for "${query}":`, error);
      return [];
    }
  }

  /**
   * 🚨 Risultato vuoto quando nessun provider funziona
   */
  getEmptyResult(businessType, businessName) {
    return {
      total: 0,
      hero: [],
      service: [],
      background: [],
      keywords: [],
      businessType,
      businessName,
      provider: 'none',
      error: 'All image providers temporarily unavailable'
    };
  }

  /**
   * 🔧 Test di connettività dei provider
   */
  async testProviders() {
    console.log('🧪 Testing image providers...');
    
    const testQuery = 'business';
    const results = {
      pexels: false,
      unsplash: false
    };
    
    try {
      const pexelsTest = await this.pexelsService.searchImages(testQuery, 1);
      results.pexels = pexelsTest.length > 0;
      console.log('🔍 Pexels test:', results.pexels ? '✅ Working' : '❌ Failed');
    } catch (error) {
      console.log('🔍 Pexels test: ❌ Failed -', error.message);
    }
    
    try {
      const unsplashTest = await this.unsplashService.searchImages(testQuery, 1);
      results.unsplash = unsplashTest.length > 0;
      console.log('🔍 Unsplash test:', results.unsplash ? '✅ Working' : '❌ Failed');
    } catch (error) {
      console.log('🔍 Unsplash test: ❌ Failed -', error.message);
    }
    
    return results;
  }
}

module.exports = ImageService;
