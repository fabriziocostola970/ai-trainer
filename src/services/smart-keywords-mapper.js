/**
 * 🎯 SMART KEYWORDS MAPPER
 * Genera keywords specifiche e coerenti per ogni tipo di business
 */

class SmartKeywordsMapper {
  
  /**
   * 🏷️ Mappa business types a keywords specifiche
   */
  static getBusinessKeywords(businessType, businessName, businessDescription) {
    const businessTypeLower = (businessType || '').toLowerCase();
    const businessDescStr = typeof businessDescription === 'string' ? businessDescription : '';
    const descriptionWords = businessDescStr.toLowerCase();
    
    // 🌸 FIORERIA / GARDEN CENTER
    if (businessTypeLower.includes('fioreria') || 
        businessTypeLower.includes('fiori') ||
        businessTypeLower.includes('garden') ||
        descriptionWords.includes('fiori') ||
        descriptionWords.includes('piante') ||
        descriptionWords.includes('frutta')) {
      return {
        primary: ['flowers', 'plants', 'garden', 'florist', 'botanical'],
        secondary: ['roses', 'orchids', 'greenhouse', 'nursery', 'gardening'],
        hero: ['flower shop', 'garden center', 'botanical garden'],
        services: ['potted plants', 'flower arrangements', 'garden tools', 'fruit trees'],
        backgrounds: ['greenhouse interior', 'garden landscape', 'flower field']
      };
    }
    
    // 🚗 AUTOMOTIVE / OFFICINA
    if (businessTypeLower.includes('automotive') || 
        businessTypeLower.includes('auto') ||
        businessTypeLower.includes('car') ||
        businessTypeLower.includes('officina')) {
      return {
        primary: ['automotive', 'car repair', 'garage', 'mechanic', 'workshop'],
        secondary: ['engine', 'tools', 'vehicle', 'maintenance', 'service'],
        hero: ['car garage', 'automotive workshop', 'mechanic shop'],
        services: ['car engine', 'repair tools', 'diagnostic equipment', 'auto parts'],
        backgrounds: ['garage interior', 'workshop tools', 'car service bay']
      };
    }
    
    // 🍕 RISTORANTE / FOOD
    if (businessTypeLower.includes('ristorante') || 
        businessTypeLower.includes('restaurant') ||
        businessTypeLower.includes('food') ||
        businessTypeLower.includes('pizza')) {
      return {
        primary: ['restaurant', 'food', 'dining', 'cuisine', 'chef'],
        secondary: ['kitchen', 'ingredients', 'cooking', 'menu', 'plate'],
        hero: ['restaurant interior', 'chef cooking', 'elegant dining'],
        services: ['gourmet food', 'kitchen equipment', 'wine selection', 'table setting'],
        backgrounds: ['restaurant ambiance', 'kitchen workspace', 'food preparation']
      };
    }
    
    // 🏥 MEDICAL / HEALTHCARE
    if (businessTypeLower.includes('medic') || 
        businessTypeLower.includes('health') ||
        businessTypeLower.includes('clinic') ||
        businessTypeLower.includes('doctor')) {
      return {
        primary: ['medical', 'healthcare', 'clinic', 'doctor', 'treatment'],
        secondary: ['hospital', 'stethoscope', 'medicine', 'patient', 'care'],
        hero: ['medical office', 'healthcare team', 'clinic interior'],
        services: ['medical equipment', 'consultation room', 'treatment area', 'laboratory'],
        backgrounds: ['hospital corridor', 'medical workspace', 'healthcare facility']
      };
    }
    
    // 💼 BUSINESS GENERICO (fallback)
    return {
      primary: ['business', 'professional', 'office', 'corporate', 'service'],
      secondary: ['team', 'meeting', 'workplace', 'modern', 'success'],
      hero: ['office building', 'business team', 'professional workspace'],
      services: ['business meeting', 'office space', 'professional service', 'corporate team'],
      backgrounds: ['modern office', 'business environment', 'professional setting']
    };
  }
  
  /**
   * 🎨 Genera keywords per immagini creative
   */
  static getCreativeKeywords(businessType) {
    const base = this.getBusinessKeywords(businessType);
    
    return {
      ...base,
      // Aggiungi variazioni creative
      artistic: base.primary.map(k => `${k} artistic`),
      modern: base.primary.map(k => `modern ${k}`),
      lifestyle: base.primary.map(k => `${k} lifestyle`),
      professional: base.primary.map(k => `professional ${k}`)
    };
  }
  
  /**
   * 🌍 Localizza keywords per mercato italiano
   */
  static getLocalizedKeywords(businessType, businessName) {
    const base = this.getBusinessKeywords(businessType, businessName);
    
    // Aggiungi varianti italiane se rilevanti
    if (businessName && businessName.includes('Italian')) {
      base.secondary.push('italian style', 'made in italy', 'italian design');
    }
    
    return base;
  }
}

module.exports = SmartKeywordsMapper;
