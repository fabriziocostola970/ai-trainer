// 🖼️ UNSPLASH SERVICE - Generatore Immagini per Claude
// Servizio per recuperare immagini professionali da Unsplash

const { createApi } = require('unsplash-js');

class UnsplashService {
  constructor() {
    // METODO CORRETTO: fetch con headers Authorization
    this.apiKey = process.env.UNSPLASH_ACCESS_KEY;
    this.baseUrl = 'https://api.unsplash.com';
    
    console.log('🖼️ Unsplash Service initialized with fetch method');
    console.log('🔑 API Key loaded:', this.apiKey ? 'YES' : 'NO');
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
   * 🔍 Cerca immagini per keyword specifica - METODO FETCH CORRETTO
   */
  async searchImages(query, count = 2) {
    try {
      const url = `${this.baseUrl}/search/photos?` + new URLSearchParams({
        query: query,
        page: '1',
        per_page: count.toString(),
        orientation: 'landscape',
        order_by: 'relevant'
      });

      console.log(`🔍 Searching: ${query}`);
      console.log(`🔗 URL: ${url}`);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Client-ID ${this.apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ HTTP ${response.status}:`, error);
        console.log(`⚠️  Unsplash Demo mode detected - switching to placeholder images`);
        return this.getPlaceholderImages(query, count);
      }

      const data = await response.json();
      console.log(`✅ Found ${data.results?.length || 0} images for "${query}"`);
      
      return data.results || [];
    } catch (error) {
      console.error(`❌ Search error for "${query}":`, error);
      console.log(`⚠️  Network error - switching to placeholder images`);
      return this.getPlaceholderImages(query, count);
    }
  }

  /**
   * 📄 Formatta dati immagine per Claude
   */
  formatImageData(photo, type) {
    return {
      id: photo.id,
      urls: {
        regular: photo.urls.regular,
        small: photo.urls.small,
        thumb: photo.urls.thumb
      },
      url: photo.urls.regular, // Backward compatibility
      urlSmall: photo.urls.small, // Backward compatibility
      urlThumb: photo.urls.thumb, // Backward compatibility
      alt: photo.alt_description || `${type} image`,
      description: photo.description || photo.alt_description || '',
      width: photo.width,
      height: photo.height,
      user: {
        name: photo.user.name,
        links: {
          html: photo.user.links.html
        }
      },
      photographer: photo.user.name, // Backward compatibility
      photographerUrl: photo.user.links.html, // Backward compatibility
      downloadUrl: photo.links.download_location,
      type: type,
      source: 'unsplash'
    };
  }

  /**
   * 🎯 Cerca un'immagine specifica basata su keywords - METODO FETCH CORRETTO
   * @param {string} keywords - Keywords specifiche per la ricerca
   * @returns {Promise<Object>} Immagine specifica o null
   */
  async searchSpecificImage(keywords) {
    try {
      // Pulisci e ottimizza le keywords per Unsplash
      const cleanKeywords = keywords
        .replace(/degli?|del|della|delle|con|per|in|una?|il|la|i|le/gi, '')
        .trim();
      
      console.log(`🔍 Searching specific image for: "${cleanKeywords}"`);
      
      const url = `${this.baseUrl}/search/photos?` + new URLSearchParams({
        query: cleanKeywords,
        page: '1',
        per_page: '3',
        orientation: 'landscape'
      });

      const response = await fetch(url, {
        headers: {
          'Authorization': `Client-ID ${this.apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('🚨 HTTP error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      const photos = data.results;
      
      if (photos && photos.length > 0) {
        // Prendi la prima immagine più rilevante
        const photo = photos[0];
        return this.formatPhotoData(photo, 'specific');
      }

      return null;
    } catch (error) {
      console.error('🚨 Error searching specific image:', error);
      return null;
    }
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

  /**
   * 🖼️ Genera immagini placeholder per modalità Demo di Unsplash
   */
  getPlaceholderImages(query, count) {
    console.log(`🎨 Generating ${count} placeholder images for: "${query}"`);
    
    const placeholderImages = [];
    for (let i = 0; i < count; i++) {
      const seed = `${query}-${i}`.replace(/\s+/g, '-').toLowerCase();
      const imageId = `placeholder-${seed}-${Date.now()}`;
      
      placeholderImages.push({
        id: imageId,
        urls: {
          regular: `https://picsum.photos/800/600?random=${seed}`,
          small: `https://picsum.photos/400/300?random=${seed}`,
          thumb: `https://picsum.photos/200/150?random=${seed}`
        },
        width: 800,
        height: 600,
        alt_description: `${query} placeholder image`,
        description: `High-quality ${query} image placeholder`,
        user: {
          name: 'Lorem Picsum',
          links: {
            html: 'https://picsum.photos'
          }
        },
        links: {
          download_location: `https://picsum.photos/800/600?random=${seed}`
        }
      });
    }
    
    console.log(`✅ Generated ${placeholderImages.length} placeholder images`);
    return placeholderImages;
  }
}

module.exports = new UnsplashService();
