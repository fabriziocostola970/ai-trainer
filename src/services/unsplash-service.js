// 🖼️ UNSPLASH SERVICE - Generatore Immagini per Claude
// Servizio per recuperare immagini professionali da Unsplash

const { createApi } = require('unsplash-js');

class UnsplashService {
  constructor() {
    this.unsplash = createApi({
      accessKey: process.env.UNSPLASH_ACCESS_KEY,
    });
    
    console.log('🖼️ Unsplash Service initialized');
  }

  /**
   * 🎯 Recupera immagini per business specifico
   * @param {string} businessType - Tipo di business (ristorante, estetica, etc.)
   * @param {string} businessName - Nome del business
   * @param {number} count - Numero di immagini da recuperare
   * @returns {Promise<Object>} Oggetto con immagini categorizzate
   */
  async getBusinessImages(businessType, businessName, count = 6) {
    try {
      console.log(`🔍 Searching images for: ${businessType} - ${businessName}`);
      
      // 🎨 KEYWORD MAPPING per business types
      const keywordMap = {
        'ristorante': ['restaurant', 'food', 'dining', 'cuisine', 'chef', 'kitchen'],
        'pizzeria': ['pizza', 'italian food', 'restaurant', 'dining', 'chef'],
        'bar': ['bar', 'cocktails', 'drinks', 'nightlife', 'bartender'],
        'centro estetico': ['beauty', 'spa', 'wellness', 'skincare', 'massage'],
        'parrucchiere': ['hairdresser', 'salon', 'beauty', 'styling', 'hair'],
        'palestra': ['gym', 'fitness', 'workout', 'exercise', 'health'],
        'abbigliamento': ['fashion', 'clothing', 'style', 'boutique', 'shopping'],
        'tecnologia': ['technology', 'digital', 'computer', 'innovation', 'tech'],
        'consulenza': ['business', 'office', 'consulting', 'professional', 'meeting'],
        'automotive': ['cars', 'automotive', 'garage', 'mechanic', 'vehicles'],
        'default': ['business', 'professional', 'modern', 'quality', 'service']
      };

      const keywords = keywordMap[businessType.toLowerCase()] || keywordMap['default'];
      
      // 🚀 RICERCA IMMAGINI PARALLELA
      const searches = await Promise.all([
        this.searchImages(keywords[0], 2), // Hero images
        this.searchImages(keywords[1], 2), // Service images  
        this.searchImages(keywords[2], 2), // Background images
      ]);

      const [heroImages, serviceImages, backgroundImages] = searches;

      return {
        hero: heroImages.map(img => this.formatImageData(img, 'hero')),
        services: serviceImages.map(img => this.formatImageData(img, 'service')),
        backgrounds: backgroundImages.map(img => this.formatImageData(img, 'background')),
        total: heroImages.length + serviceImages.length + backgroundImages.length
      };

    } catch (error) {
      console.error('❌ Unsplash Service Error:', error);
      return this.getFallbackImages();
    }
  }

  /**
   * 🔍 Cerca immagini per keyword specifica
   */
  async searchImages(query, count = 2) {
    try {
      const result = await this.unsplash.search.getPhotos({
        query: query,
        page: 1,
        perPage: count,
        orientation: 'landscape',
        orderBy: 'relevant'
      });

      if (result.errors) {
        console.error('Unsplash search errors:', result.errors);
        return [];
      }

      return result.response.results || [];
    } catch (error) {
      console.error(`❌ Search error for "${query}":`, error);
      return [];
    }
  }

  /**
   * 📄 Formatta dati immagine per Claude
   */
  formatImageData(photo, type) {
    return {
      id: photo.id,
      url: photo.urls.regular,
      urlSmall: photo.urls.small,
      urlThumb: photo.urls.thumb,
      alt: photo.alt_description || `${type} image`,
      description: photo.description || photo.alt_description || '',
      width: photo.width,
      height: photo.height,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      downloadUrl: photo.links.download_location,
      type: type
    };
  }

  /**
   * 🚨 Immagini di fallback se Unsplash fallisce
   */
  getFallbackImages() {
    return {
      hero: [{
        url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        alt: 'Professional business environment',
        type: 'hero'
      }],
      services: [{
        url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        alt: 'Quality service',
        type: 'service'
      }],
      backgrounds: [{
        url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        alt: 'Modern office background',
        type: 'background'
      }],
      total: 3
    };
  }

  /**
   * 🎨 Genera suggerimenti di keyword per Claude
   */
  generateImageKeywords(businessType, businessName) {
    const baseKeywords = {
      'ristorante': ['delicious food', 'restaurant ambiance', 'chef cooking', 'dining experience'],
      'centro estetico': ['spa relaxation', 'beauty treatment', 'wellness center', 'skincare'],
      'palestra': ['fitness training', 'gym equipment', 'workout session', 'healthy lifestyle'],
      'default': ['professional service', 'quality business', 'modern environment', 'customer satisfaction']
    };

    return baseKeywords[businessType.toLowerCase()] || baseKeywords['default'];
  }
}

module.exports = new UnsplashService();
