// 🖼️ PEXELS SERVICE - Alternative to Unsplash for Image Generation
// More permissive API that works from server-side applications

class PexelsService {
  constructor() {
    this.apiKey = process.env.PEXELS_API_KEY;
    this.baseUrl = 'https://api.pexels.com/v1';
    
    console.log('🖼️ Pexels Service initialized');
    console.log('🔑 API Key loaded:', this.apiKey ? 'YES' : 'NO');
  }

  /**
   * 🎯 Recupera immagini per business specifico
   * @param {string} businessType - Tipo di business (ristorante, estetica, etc.)
   * @param {string} businessName - Nome del business
   * @param {string} businessDescription - Descrizione del business  
   * @param {number} count - Numero di immagini da recuperare
   * @returns {Promise<Object>} Oggetto con immagini categorizzate
   */
  async getBusinessImages(businessType, businessName, businessDescription = '', count = 6) {
    try {
      console.log(`🔍 Searching Pexels images for: ${businessName} - ${businessType}`);
      
      // � SMART KEYWORDS usando il nuovo mapper
      const SmartKeywordsMapper = require('./smart-keywords-mapper');
      const smartKeywords = SmartKeywordsMapper.getBusinessKeywords(businessType, businessName, businessDescription);
      
      console.log('🏷️ Smart keywords:', {
        hero: smartKeywords.hero[0],
        services: smartKeywords.services[0], 
        backgrounds: smartKeywords.backgrounds[0]
      });
      
      // 🚀 RICERCA IMMAGINI PARALLELA con Smart Keywords
      const searches = await Promise.all([
        this.searchImages(smartKeywords.hero[0], 2), // Hero images
        this.searchImages(smartKeywords.services[0], 2), // Service images  
        this.searchImages(smartKeywords.backgrounds[0], 2), // Background images
      ]);

      const [heroImages, serviceImages, backgroundImages] = searches;
      
      // 📊 RISULTATI FORMATTATI
      const result = {
        total: heroImages.length + serviceImages.length + backgroundImages.length,
        hero: heroImages.map(img => this.formatImageData(img, 'hero')),
        services: serviceImages.map(img => this.formatImageData(img, 'service')),
        backgrounds: backgroundImages.map(img => this.formatImageData(img, 'background')),
        keywords: smartKeywords,
        businessType,
        businessName
      };

      console.log(`✅ Pexels search completed: ${result.total} images found`);
      return result;

    } catch (error) {
      console.error('❌ Pexels Service Error:', error);
      return this.getFallbackImages();
    }
  }

  /**
   * 🔍 Cerca immagini per keyword specifica
   */
  async searchImages(query, count = 2) {
    try {
      const url = `${this.baseUrl}/search?` + new URLSearchParams({
        query: query,
        page: '1',
        per_page: count.toString(),
        orientation: 'landscape'
      });

      console.log(`🔍 Searching Pexels: ${query}`);
      console.log(`🔗 URL: ${url}`);

      const response = await fetch(url, {
        headers: {
          'Authorization': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Pexels HTTP ${response.status}:`, error);
        return [];
      }

      const data = await response.json();
      console.log(`✅ Found ${data.photos?.length || 0} images for "${query}"`);
      
      return data.photos || [];
    } catch (error) {
      console.error(`❌ Pexels search error for "${query}":`, error);
      return [];
    }
  }

  /**
   * 📄 Formatta dati immagine per Claude
   */
  formatImageData(photo, type) {
    return {
      id: photo.id,
      url: photo.src.large,
      urlSmall: photo.src.medium,
      urlThumb: photo.src.small,
      alt: photo.alt || `${type} image`,
      description: photo.alt || '',
      width: photo.width,
      height: photo.height,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      originalUrl: photo.url,
      source: 'pexels'
    };
  }

  /**
   * 🚨 Fallback quando Pexels non funziona
   */
  getFallbackImages() {
    console.log('⚠️ Using fallback images - Pexels service unavailable');
    return {
      total: 0,
      hero: [],
      services: [],
      backgrounds: [],
      keywords: [],
      businessType: 'unknown',
      businessName: 'unknown',
      error: 'Pexels service temporarily unavailable'
    };
  }

  /**
   * 🎨 Genera suggerimenti di keyword per Claude
   */
  generateImageKeywords(businessType, businessName) {
    const baseKeywords = {
      'ristorante': ['delicious food', 'restaurant ambiance', 'chef cooking', 'dining experience'],
      'fioraio': ['beautiful flowers', 'floral arrangements', 'bouquet design', 'garden blooms'],
      'centro estetico': ['spa relaxation', 'beauty treatment', 'wellness center', 'skincare'],
      'palestra': ['fitness training', 'gym equipment', 'workout session', 'healthy lifestyle'],
      'default': ['professional service', 'quality business', 'modern environment', 'customer satisfaction']
    };

    return baseKeywords[businessType.toLowerCase()] || baseKeywords['default'];
  }
}

module.exports = PexelsService;
