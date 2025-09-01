const express = require('express');
const router = express.Router();
const DatabaseStorage = require('../storage/database-storage');
const OpenAI = require('openai');
const axios = require('axios');

// 📊 RATE LIMITING per rispettare Unsplash API (50 richieste/ora gratuite)
let unsplashRequestCount = 0;
let unsplashResetTime = Date.now() + 3600000; // 1 ora da ora

function checkRateLimit() {
  const now = Date.now();
  if (now > unsplashResetTime) {
    unsplashRequestCount = 0;
    unsplashResetTime = now + 3600000;
  }
  return unsplashRequestCount < 40; // Lasciamo margine sotto il limite 50
}

function incrementRateLimit() {
  unsplashRequestCount++;
}

// 🧠 ANALISI DINAMICA BUSINESS TYPE con Claude
async function analyzeBusinessTypeDynamically(businessProfile) {
  try {
    const businessName = businessProfile?.name || businessProfile?.businessName || '';
    const businessDesc = businessProfile?.description || '';
    const businessType = businessProfile?.businessType || 'business';

    // Se già abbiamo un tipo specifico, non rianalizziamo
    if (businessType !== 'services' && businessType !== 'business' && businessType !== 'company') {
      return businessType;
    }

    console.log('🧠 [Dynamic Analysis] Analyzing business type for:', businessName);

    const prompt =
      'Analizza questo business e determina il tipo più specifico possibile:\n\n' +
      'Nome: ' + businessName + '\n' +
      'Descrizione: ' + businessDesc + '\n' +
      'Tipo attuale: ' + businessType + '\n\n' +
      'Istruzioni:\n' +
      '- Analizza attentamente nome e descrizione\n' +
      '- Identifica il settore specifico (es: ristorante, fioraio, parrucchiere, meccanico, etc.)\n' +
      '- NON usare tipi generici come "services" o "business"\n' +
      '- Se non riesci a determinare, usa "restaurant" come fallback\n\n' +
      'Rispondi SOLO con il tipo specifico in minuscolo, senza spiegazioni aggiuntive.';

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 50,
      temperature: 0.1,
      system: 'Sei un esperto classificatore di business. Analizza e restituisci SOLO il tipo specifico di business in minuscolo.',
      messages: [{ role: 'user', content: prompt }],
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    });

    const analyzedType = response.data.content[0].text.trim().toLowerCase();
    console.log(`🧠 [Dynamic Analysis] Classified as: ${analyzedType}`);

    return analyzedType;

  } catch (error) {
    console.error('❌ [Dynamic Analysis] Error:', error);
    return businessType; // Fallback al tipo originale
  }
}

// 🖼️ Versione semplificata per Claude Generator (senza API Unsplash complessa)
async function generateAIBasedImageClaude(sectionType, businessType, sectionPurpose) {
  console.log(`🖼️ [Claude Images] Generating image for ${sectionType} (${businessType})`);
  console.log(`📝 [Claude Images] Search keywords: "${sectionPurpose}"`);

  // 🔒 Controlla API key
  const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('⚠️ [Claude Images] API key mancante - usando fallback');
    return `https://via.placeholder.com/300x200?text=${encodeURIComponent(businessType)}`;
  }

  console.log('✅ [Claude Images] API key found, proceeding with Unsplash API');

  // 📊 Controlla rate limiting
  if (!checkRateLimit()) {
    console.warn('⚠️ [Claude Images] Rate limit raggiunto - usando fallback');
    return `https://via.placeholder.com/300x200?text=${encodeURIComponent(businessType)}`;
  }

  console.log('✅ [Claude Images] Rate limit OK, proceeding');

  // ⏱️ Delay etico (2 secondi)
  console.log('⏳ [Claude Images] Applying ethical delay (2 seconds)...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 🎯 Keywords espanse per Claude - COPERTE TUTTE LE CATEGORIE BUSINESS
  const keywords = {
    'ristorante': ['food', 'restaurant', 'pizza', 'italian cuisine', 'dining'],
    'parrucchiere': ['hair salon', 'beauty', 'hairstyle', 'hairdressing', 'cosmetology'],
    'florist': ['flowers', 'bouquet', 'garden', 'floral arrangements', 'botanical'],
    'pet shop': ['animals', 'pets', 'dogs', 'cats', 'veterinary', 'pet care', 'animal shelter'],
    'automotive': ['cars', 'automotive', 'vehicles', 'auto', 'car dealership', 'motors'],
    'mechanic': ['car repair', 'mechanic', 'automotive', 'auto service', 'car maintenance'],
    'pharmacy': ['pharmacy', 'health', 'medicine', 'drugstore', 'healthcare'],
    'bakery': ['bakery', 'bread', 'pastries', 'cakes', 'baking', 'confectionery'],
    'cafe': ['coffee', 'cafe', 'drinks', 'beverages', 'coffee shop', 'espresso'],
    'dentist': ['dentist', 'dental', 'teeth', 'oral health', 'dentistry'],
    'lawyer': ['law', 'justice', 'legal', 'attorney', 'law firm', 'legal services'],
    'real estate': ['real estate', 'houses', 'property', 'homes', 'realty', 'housing'],
    'hotel': ['hotel', 'accommodation', 'resort', 'hospitality', 'lodging'],
    'gym': ['gym', 'fitness', 'workout', 'exercise', 'health club', 'training'],
    'spa': ['spa', 'wellness', 'relaxation', 'massage', 'beauty treatment'],
    'school': ['school', 'education', 'learning', 'academy', 'teaching'],
    'clinic': ['clinic', 'medical', 'healthcare', 'doctor', 'medical center'],
    'barber': ['barber', 'mens grooming', 'haircut', 'shaving', 'mens salon'],
    'tattoo': ['tattoo', 'body art', 'ink', 'tattoo studio', 'body modification'],
    'photography': ['photography', 'photos', 'camera', 'photo studio', 'portrait'],
    'consulting': ['consulting', 'business advice', 'strategy', 'professional services'],
    'cleaning': ['cleaning', 'housekeeping', 'janitorial', 'maintenance'],
    'plumbing': ['plumbing', 'pipes', 'water systems', 'plumber', 'waterworks'],
    'electrician': ['electrician', 'electrical', 'wiring', 'power systems'],
    'gardening': ['gardening', 'landscaping', 'plants', 'horticulture', 'greenhouse'],
    'catering': ['catering', 'food service', 'event food', 'banquet', 'culinary'],
    'travel': ['travel', 'tourism', 'vacation', 'journey', 'adventure'],
    'insurance': ['insurance', 'protection', 'coverage', 'risk management'],
    'accounting': ['accounting', 'finance', 'bookkeeping', 'tax services'],
    'marketing': ['marketing', 'advertising', 'promotion', 'brand management'],
    'technology': ['technology', 'tech', 'software', 'digital solutions', 'IT'],
    'fashion': ['fashion', 'clothing', 'apparel', 'style', 'boutique'],
    'jewelry': ['jewelry', 'gems', 'precious stones', 'luxury accessories'],
    'sports': ['sports', 'athletics', 'recreation', 'fitness equipment'],
    'music': ['music', 'instruments', 'audio', 'sound', 'musical'],
    'art': ['art', 'painting', 'gallery', 'creative', 'artists'],
    'books': ['books', 'library', 'literature', 'reading', 'bookstore'],
    'toys': ['toys', 'games', 'play', 'children', 'entertainment'],
    'furniture': ['furniture', 'home decor', 'interior design', 'furnishings'],
    'electronics': ['electronics', 'gadgets', 'devices', 'technology products'],
    'supermarket': ['supermarket', 'grocery', 'food store', 'retail', 'shopping'],
    'default': ['business', 'professional', 'service', 'company', 'enterprise']
  };

  const keyword = keywords[businessType] ? keywords[businessType][0] : keywords.default[0];

  try {
    // 🎯 Seleziona keywords appropriate per il business type
  let selectedKeywords = keywords[businessType] || keywords['default'];

  // Se abbiamo sectionPurpose specifico, aggiungiamolo alle keywords
  if (sectionPurpose && sectionPurpose !== businessType) {
    // Se sectionPurpose contiene keywords specifiche, usiamole
    if (sectionPurpose.includes(' ')) {
      selectedKeywords = sectionPurpose.split(' ').slice(0, 3);
    } else {
      selectedKeywords = [sectionPurpose, ...selectedKeywords.slice(0, 2)];
    }
  }

  console.log(`🔍 [Claude Images] Selected keywords for ${businessType}: ${selectedKeywords.join(', ')}`);

  // 🎯 Usa keywords diverse per evitare duplicati
  const keywordIndex = Math.floor(Math.random() * selectedKeywords.length);
  const keyword = selectedKeywords[keywordIndex];

  console.log(`🎯 [Claude Images] Using keyword: "${keyword}" (index ${keywordIndex}/${selectedKeywords.length})`);

    // 🚀 Chiamata API semplificata
    console.log('🌐 [Claude Images] Making Unsplash API call...');
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: keyword,
        per_page: 1,
        orientation: 'landscape'
      },
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
      },
      timeout: 5000
    });

    console.log('📡 [Claude Images] Unsplash API response received:', {
      status: response.status,
      hasResults: response.data?.results?.length > 0,
      resultsCount: response.data?.results?.length || 0
    });

    incrementRateLimit();

    if (response.data.results && response.data.results.length > 0) {
      const photo = response.data.results[0];
      const dimensions = { width: 300, height: 200 }; // Dimensioni fisse per semplicità

      const imageUrl = `${photo.urls.raw}&w=${dimensions.width}&h=${dimensions.height}&fit=crop&q=80`;
      console.log(`✅ [Claude Images] Generated: ${imageUrl.substring(0, 50)}...`);
      return imageUrl;
    } else {
      console.warn('⚠️ [Claude Images] No results from Unsplash API');
    }
  } catch (error) {
    console.error(`❌ [Claude Images] API Error: ${error.message}`);
    console.error('🔍 [Claude Images] Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
  }

  // 🚨 Fallback
  console.log('🚨 [Claude Images] Using fallback placeholder');
  return `https://via.placeholder.com/300x200?text=${encodeURIComponent(businessType)}`;
}

// 🤖 CLAUDE SONNET WEBSITE GENERATOR - Sistema Parallelo V1.0
// 🎯 FOCUS: Generazione siti intelligente basata su pattern database esistenti
// 🚫 NON TOCCA: Sistema AI-Trainer esistente, mantiene compatibilità totale

/**
 * 🎯 GENERA GUIDANCE SPECIFICO PER BUSINESS TYPE - 100% DINAMICO
 */
async function generateBusinessGuidanceWithAI(businessType, businessDescription = null) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `Genera una guida specifica per creare contenuti web eccellenti per un business di tipo "${businessType}".

${businessDescription ? `DESCRIZIONE BUSINESS: "${businessDescription}"` : ''}

Fornisci una guida concisa (max 100 parole) che includa:
- Elementi chiave da enfatizzare per questo tipo di business
- Caratteristiche uniche del settore
- Cosa i clienti cercano tipicamente
- Come presentare i servizi/prodotti al meglio

Rispondi con una frase completa e professionale che possa essere usata come guida per generare contenuti web.

Esempio per ristorante: "Enfatizza le specialità dello chef, il sistema di prenotazioni, l'atmosfera del locale e i punti di forza del menu."

Rispondi SOLO con la guida, senza introduzioni:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.7
    });

    const guidance = completion.choices[0].message.content.trim();
    console.log(`🎯 [Dynamic Guidance] Generated for ${businessType}: ${guidance}`);
    
    return guidance;

  } catch (error) {
    console.error(`❌ [Dynamic Guidance] Error: ${error.message}`);
    return `Focus on core services, unique value proposition, customer benefits, and contact information for ${businessType} businesses`;
  }
}

/**
 * 🧠 ANALISI PATTERN DAL DATABASE ESISTENTE
 */
async function analyzeBusinessPatterns(businessType) {
  try {
    const storage = new DatabaseStorage();
    
    console.log(`🔍 [Claude Pattern Analysis] Analyzing patterns for: ${businessType}`);
    
    // Query pattern esistenti nel database ai_design_patterns
    const result = await storage.pool.query(`
      SELECT 
        "layout_structure",
        "css_themes", 
        "quality_score",
        "semantic_analysis",
        "design_analysis"
      FROM ai_design_patterns 
      WHERE "business_type" = $1 
        AND "quality_score" > 7.0
      ORDER BY "quality_score" DESC
      LIMIT 10
    `, [businessType]);
    
    if (result.rows.length === 0) {
      console.log(`📊 [Claude Pattern Analysis] No patterns found for ${businessType}, using general patterns`);
      return null;
    }
    
    // Analizza pattern di successo
    const patterns = result.rows.map(row => ({
      layout: row.layout_structure,
      themes: row.css_themes,
      quality: row.quality_score,
      semantic: row.semantic_analysis,
      design: row.design_analysis
    }));
    
    // Calcola statistiche pattern
    const sectionCounts = patterns.map(p => 
      p.layout?.sections?.length || Object.keys(p.themes || {}).length || 4
    );
    
    const avgSections = Math.round(sectionCounts.reduce((a, b) => a + b, 0) / sectionCounts.length);
    const maxSections = Math.max(...sectionCounts);
    const minSections = Math.min(...sectionCounts);
    
    // Estrai sezioni comuni di successo
    const allSections = patterns.flatMap(p => 
      p.layout?.sections?.map(s => s.type) || 
      Object.keys(p.themes || {}) || 
      ['hero', 'services', 'about', 'contact']
    );
    
    const sectionFrequency = allSections.reduce((acc, section) => {
      acc[section] = (acc[section] || 0) + 1;
      return acc;
    }, {});
    
    const commonSections = Object.entries(sectionFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([section, count]) => ({
        name: section,
        frequency: (count / patterns.length * 100).toFixed(1)
      }));
    
    console.log(`✅ [Claude Pattern Analysis] Found ${patterns.length} quality patterns:`, {
      avgSections,
      range: `${minSections}-${maxSections}`,
      topSections: commonSections.slice(0, 3).map(s => s.name)
    });
    
    return {
      totalPatterns: patterns.length,
      avgSections,
      minSections,
      maxSections, 
      commonSections,
      qualityRange: {
        min: Math.min(...patterns.map(p => p.quality)),
        max: Math.max(...patterns.map(p => p.quality)),
        avg: (patterns.reduce((sum, p) => sum + p.quality, 0) / patterns.length).toFixed(1)
      },
      successFactors: patterns.filter(p => p.quality > 8.5).map(p => ({
        sections: p.layout?.sections?.length || 0,
        themes: Object.keys(p.themes || {}).length,
        semantic: p.semantic
      }))
    };
    
  } catch (error) {
    console.log(`❌ [Claude Pattern Analysis] Error: ${error.message}`);
    return null;
  }
}

/**
 * 🎯 RILEVAMENTO COMPLESSITÀ BUSINESS
 */
function detectBusinessComplexity(businessName, businessType, patterns, businessDescription = '') {
  console.log(`🎯 [Claude Complexity] Analyzing: "${businessName}" (${businessType})${businessDescription ? ' with description' : ''}`);
  
  let complexity = 5; // Base complexity
  
  // Analisi del nome business
  const nameIndicators = {
    enterprise: ['enterprise', 'corporation', 'group', 'holdings', 'international'],
    chain: ['chain', 'franchise', 'network', 'stores', 'outlets'],
    luxury: ['luxury', 'premium', 'exclusive', 'elite', 'prestige'],
    local: ['local', 'neighborhood', 'family', 'traditional']
  };
  
  const nameLower = businessName.toLowerCase();
  
  if (nameIndicators.enterprise.some(word => nameLower.includes(word))) {
    complexity = 8; // Enterprise level
  } else if (nameIndicators.chain.some(word => nameLower.includes(word))) {
    complexity = 7; // Chain level
  } else if (nameIndicators.luxury.some(word => nameLower.includes(word))) {
    complexity = 6; // Premium level
  } else if (nameIndicators.local.some(word => nameLower.includes(word))) {
    complexity = 3; // Local level
  }
  
  // 🆕 Analisi della descrizione business per affinare la complessità
  if (businessDescription) {
    const descLower = businessDescription.toLowerCase();
    
    // Indicatori di complessità nella descrizione
    const complexityIndicators = {
      high: ['multiple locations', 'international', 'enterprise', 'corporate', 'chain', 'franchise', 'nationwide', 'global'],
      medium: ['professional', 'specialized', 'premium', 'certified', 'licensed', 'experienced', 'full-service'],
      service_rich: ['consultation', 'custom', 'bespoke', 'personalized', 'tailored', 'expert', 'specialist'],
      simple: ['local', 'small', 'family', 'traditional', 'neighborhood', 'basic']
    };
    
    if (complexityIndicators.high.some(word => descLower.includes(word))) {
      complexity = Math.max(complexity, 7);
    }
    if (complexityIndicators.medium.some(word => descLower.includes(word))) {
      complexity = Math.max(complexity, 5);
    }
    if (complexityIndicators.service_rich.some(word => descLower.includes(word))) {
      complexity += 1; // Aggiungi complessità per servizi ricchi
    }
    if (complexityIndicators.simple.some(word => descLower.includes(word))) {
      complexity = Math.min(complexity, 4);
    }
    
    // Lunghezza descrizione come indicatore
    if (businessDescription.length > 200) complexity += 1; // Descrizione lunga = business complesso
    if (businessDescription.length > 500) complexity += 1; // Descrizione molto lunga = molto complesso
  }
  
  // Aggiusta basandosi sui pattern del business type
  if (patterns) {
    if (patterns.avgSections > 6) complexity += 1;
    if (patterns.maxSections > 8) complexity += 1;
    if (patterns.qualityRange.avg > 8.5) complexity += 1;
  }
  
  complexity = Math.min(10, Math.max(1, complexity));
  
  console.log(`🎯 [Claude Complexity] Business "${businessName}" → Complexity: ${complexity}/10${businessDescription ? ' (enhanced by description)' : ''}`);
  
  return complexity;
}

/**
 * 🤖 GENERAZIONE PROMPT INTELLIGENTE PER CLAUDE
 */
async function generateIntelligentPrompt(businessName, businessType, businessDescription, patterns, complexity) {
  console.log(`🤖 [Claude Prompt] Generating intelligent prompt for: ${businessName}`);
  
  // Determina numero sezioni ottimale
  let optimalSections;
  if (patterns) {
    // Basato sui pattern di successo
    if (complexity >= 8) optimalSections = Math.min(patterns.maxSections, 8);
    else if (complexity >= 6) optimalSections = patterns.avgSections + 1;
    else if (complexity <= 3) optimalSections = Math.max(patterns.minSections, 3);
    else optimalSections = patterns.avgSections;
  } else {
    // Fallback basato solo su complexity
    optimalSections = Math.min(Math.max(complexity - 2, 3), 7);
  }
  
  // Sezioni consigliate basate sui pattern
  const recommendedSections = patterns ? 
    patterns.commonSections.slice(0, optimalSections).map(s => s.name) :
    ['hero', 'services', 'about', 'contact'];
  
  // 🆕 Genera guidance specifico dinamicamente con AI invece di hardcoded
  const guidance = await generateBusinessGuidanceWithAI(businessType, businessDescription);

  // 🆕 Usa la descrizione del business per personalizzazione avanzata
  const businessContext = businessDescription ? 
    `\nBUSINESS DESCRIPTION: "${businessDescription}"
Use this description to create highly personalized and relevant content that reflects the specific nature, services, and unique value proposition of this business.` : '';
  
  const prompt = `You are an expert web designer creating a website for "${businessName}", a ${businessType} business.
${businessContext}

INTELLIGENT CONSTRAINTS (Based on successful ${businessType} patterns):
- Generate exactly ${optimalSections} sections
- Business complexity level: ${complexity}/10
- ${patterns ? `Based on ${patterns.totalPatterns} successful ${businessType} websites` : 'Using general best practices'}

RECOMMENDED SECTION TYPES: ${recommendedSections.join(', ')}

BUSINESS-SPECIFIC GUIDANCE: ${guidance}
${businessDescription ? `\nSPECIFIC FOCUS: Create content that specifically addresses: ${businessDescription}` : ''}

IMPORTANT RULES:
1. Generate content in the same language as the business name "${businessName}"
2. Only ONE section should contain contact information (email, phone, address)
3. Other sections should focus on services/products without repeating contact details
4. Make each section unique and valuable for ${businessType} customers
5. Include realistic pricing, descriptions, and business-specific terminology
${businessDescription ? '6. Incorporate elements from the business description to make content highly relevant and personalized' : ''}

STRUCTURE REQUIREMENTS:
- Create ${optimalSections} distinct sections
- Each section needs: title, description, 2-4 items with names/descriptions
- Contact section: include complete contact details
- Service sections: focus on specific offerings, NO contact info
- Use professional ${businessType} terminology
- Include relevant call-to-action buttons
${businessDescription ? `- Reflect the specific business focus: ${businessDescription}` : ''}

🎨 CRITICAL: Generate UNIQUE CSS STYLES for the entire website
- Create modern, professional CSS that matches the business type
- Include responsive design, gradients, animations, and UNIQUE business-specific colors
- Generate DIFFERENT color combinations for each business, even within the same category
- Use CSS custom properties for consistent theming
- Ensure mobile-first responsive design
- Include hover effects and smooth transitions
- Create distinctive color palettes that reflect the specific business personality

🎨 COLOR GENERATION REQUIREMENTS:
- Primary colors should be unique and brand-appropriate (avoid generic blues/reds)
- Use color psychology: greens for nature/health businesses, warm colors for hospitality, etc.
- Generate accent colors that complement the primary palette
- Ensure good contrast ratios for accessibility
- Create gradients and color variations for visual interest
- Avoid using the same color combinations repeatedly

Generate a JSON response with this exact structure:
{
  "businessName": "${businessName}",
  "businessType": "${businessType}",
  "businessDescription": "${businessDescription || ''}",
  "complexity": ${complexity},
  "totalSections": ${optimalSections},
  "sections": [
    {
      "id": "section-1",
      "type": "section-name-ai-dynamic",
      "title": "Section Title",
      "description": "Section description",
      "items": [
        {
          "name": "Item name",
          "description": "Item description",
          "price": "€XX (if applicable)"
        }
      ],
      "hasContacts": false
    }
  ],
  "design": {
    "primaryColor": "#HEX (unique, brand-appropriate color)",
    "secondaryColor": "#HEX (complementary color)",
    "accentColor": "#HEX (distinctive accent for CTAs and highlights)",
    "style": "modern|elegant|minimal|warm-professional",
    "businessPersonality": "Unique description of design approach reflecting the specific business and its personality",
    "dynamicCSS": ".website-container { /* Complete, unique CSS styles for entire website with distinctive colors */ }"
  },
  "metadata": {
    "generatedBy": "claude-sonnet",
    "basedOnPatterns": ${patterns ? patterns.totalPatterns : 0},
    "patternQuality": "${patterns ? patterns.qualityRange.avg : 'N/A'}",
    "sections": ${optimalSections},
    "personalizedContent": ${businessDescription ? 'true' : 'false'}
  }
}

ENSURE: Only the last/contact section has "hasContacts": true, all others have "hasContacts": false.
${businessDescription ? `PERSONALIZATION: Make sure all content specifically reflects and incorporates: ${businessDescription}` : ''}

🎨 UNIQUENESS REQUIREMENT: Generate completely unique color schemes and design elements for this specific business. Avoid generic color combinations and create distinctive visual identity that stands out from typical ${businessType} websites.

🎨 CSS REQUIREMENTS:
- Generate complete, production-ready CSS in the "dynamicCSS" field
- Include responsive breakpoints (@media queries)
- Use CSS Grid and Flexbox for modern layouts
- Add smooth animations and transitions
- Create business-specific color schemes
- Ensure accessibility (good contrast, readable fonts)
- Include hover states and interactive elements
- Make it mobile-first responsive design`;

  console.log(`✅ [Claude Prompt] Generated intelligent prompt: ${optimalSections} sections, complexity ${complexity}${businessDescription ? ', with business description' : ''}`);
  
  return prompt;
}

/**
 * 🎨 GENERAZIONE SITO CON CLAUDE SONNET 
 */
async function generateWebsiteWithClaude(businessName, businessType, businessDescription = '') {
  console.log('🎨 [AI-TRAINER CLAUDE GENERATOR] FUNCTION CALLED:', {
    businessName,
    businessType,
    hasDescription: !!businessDescription,
    descriptionLength: businessDescription?.length || 0,
    timestamp: new Date().toISOString()
  });

  try {
    console.log(`🎨 [AI-TRAINER CLAUDE GENERATOR] Starting website generation for: ${businessName}${businessDescription ? ' with custom description' : ''}`);

    // 1. Analizza pattern esistenti dal database
    console.log('🔍 [AI-TRAINER CLAUDE] Analyzing business patterns...');
    const patterns = await analyzeBusinessPatterns(businessType);
    console.log('✅ [AI-TRAINER CLAUDE] Patterns analyzed:', {
      hasPatterns: !!patterns,
      totalPatterns: patterns?.totalPatterns || 0,
      businessType: businessType
    });

    // 2. Rileva complessità business (considera anche la descrizione)
    console.log('🧠 [AI-TRAINER CLAUDE] Detecting business complexity...');
    const complexity = detectBusinessComplexity(businessName, businessType, patterns, businessDescription);
    console.log('✅ [AI-TRAINER CLAUDE] Complexity detected:', complexity);

    // 3. Genera prompt intelligente con descrizione
    console.log('📝 [AI-TRAINER CLAUDE] Generating intelligent prompt...');
    const intelligentPrompt = await generateIntelligentPrompt(businessName, businessType, businessDescription, patterns, complexity);
    console.log('✅ [AI-TRAINER CLAUDE] Prompt generated:', {
      promptLength: intelligentPrompt?.length || 0,
      hasPrompt: !!intelligentPrompt
    });

    // 4. CHIAMATA VERA ALL'API CLAUDE (NON SIMULAZIONE!)
    console.log('🤖 [AI-TRAINER CLAUDE] CALLING REAL CLAUDE API (NOT SIMULATION!)');
    console.log('🔧 [CLAUDE DEBUG] About to call callRealClaudeAPI with:', {
      businessName,
      businessType,
      hasDescription: !!businessDescription,
      descriptionPreview: businessDescription?.substring(0, 100) + (businessDescription?.length > 100 ? '...' : '')
    });

    const claudeResponse = await callRealClaudeAPI(intelligentPrompt, businessName, businessType, businessDescription, complexity);

    console.log('🎯 [CLAUDE RESPONSE] Claude API call result:', {
      hasResponse: !!claudeResponse,
      responseType: typeof claudeResponse,
      isArray: Array.isArray(claudeResponse),
      responseKeys: claudeResponse ? Object.keys(claudeResponse) : [],
      hasSections: claudeResponse?.sections ? true : false,
      sectionsCount: claudeResponse?.sections?.length || 0,
      hasDesign: claudeResponse?.design ? true : false
    });

    console.log('✅ [AI-TRAINER CLAUDE] RESPONSE GENERATED:', {
      hasResponse: !!claudeResponse,
      responseType: typeof claudeResponse,
      hasSections: claudeResponse?.sections ? true : false,
      sectionsCount: claudeResponse?.sections?.length || 0,
      sections: claudeResponse?.sections?.map(s => s.type) || [],
      timestamp: new Date().toISOString()
    });

    console.log(`✅ [AI-TRAINER CLAUDE GENERATOR] Website generated successfully for ${businessName}${businessDescription ? ' (personalized)' : ''}`);

    // Estrai il campo design dalla risposta di Claude se presente
    const designData = claudeResponse?.design || null;

    const result = {
      success: true,
      website: claudeResponse,
      design: designData, // ✅ AGGIUNTO: Estrai il design con dynamicCSS da Claude
      metadata: {
        generatedBy: 'claude-sonnet',
        basedOnPatterns: patterns?.totalPatterns || 0,
        complexity: complexity,
        timestamp: new Date().toISOString(),
        businessType: businessType,
        hasCustomDescription: !!businessDescription,
        personalized: !!businessDescription,
        hasDynamicCSS: designData?.dynamicCSS ? true : false // ✅ AGGIUNTO: Flag per verificare presenza CSS dinamico
      }
    };

    console.log('📤 [AI-TRAINER CLAUDE] RETURNING RESULT:', {
      success: result.success,
      hasWebsite: !!result.website,
      hasDesign: !!result.design,
      hasDynamicCSS: result.metadata.hasDynamicCSS,
      timestamp: new Date().toISOString()
    });

    return result;

  } catch (error) {
    console.log(`❌ [AI-TRAINER CLAUDE GENERATOR] ERROR:`, {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return {
      success: false,
      error: error.message,
      fallback: 'Consider using AI-Trainer classic system'
    };
  }
}

/**
 * 🚀 CHIAMATA VERA ALL'API CLAUDE (NON SIMULAZIONE)
 */
async function callRealClaudeAPI(prompt, businessName, businessType, businessDescription, complexity) {
  console.log('🚀 [REAL CLAUDE API] FUNCTION CALLED:', {
    businessName,
    businessType,
    hasDescription: !!businessDescription,
    descriptionLength: businessDescription?.length || 0,
    complexity,
    hasPrompt: !!prompt,
    promptLength: prompt?.length || 0,
    timestamp: new Date().toISOString()
  });

  try {
    // Costruisci prompt ultra-specifico per Claude
    const specificPrompt = buildUltraSpecificPrompt(businessName, businessType, businessDescription, complexity);

    console.log('📝 [CLAUDE PROMPT] Built ultra-specific prompt for Claude');
    console.log('📄 [CLAUDE PROMPT PREVIEW] Prompt length:', specificPrompt.length, 'characters');
    console.log('📄 [CLAUDE PROMPT PREVIEW] First 500 chars:', specificPrompt.substring(0, 500));
    console.log('📄 [CLAUDE PROMPT PREVIEW] Last 500 chars:', specificPrompt.substring(specificPrompt.length - 500));

    // Log completo del prompt per debug
    console.log('🔍 [CLAUDE PROMPT FULL] Complete prompt being sent to Claude:');
    console.log('--- PROMPT START ---');
    console.log(specificPrompt);
    console.log('--- PROMPT END ---');

    // Verifica API key con più dettagli
    const apiKey = process.env.CLAUDE_API_KEY;
    console.log('🔑 [CLAUDE API] API Key status:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPrefix: apiKey?.substring(0, 10) + '...' || 'NO KEY',
      apiKeyValidFormat: apiKey?.startsWith('sk-ant-api03-') || false
    });

    if (!apiKey) {
      throw new Error('CLAUDE_API_KEY environment variable is not set');
    }

    if (!apiKey.startsWith('sk-ant-api03-')) {
      throw new Error('CLAUDE_API_KEY appears to be invalid format');
    }

    // CHIAMATA VERA ALL'API CLAUDE
    console.log('📤 [CLAUDE REQUEST] Sending request to Claude API...');
    console.log('🔗 [CLAUDE REQUEST DETAILS] Full request config:', {
      url: 'https://api.anthropic.com/v1/messages',
      model: 'claude-sonnet-4-20250514',
      hasApiKey: !!apiKey,
      promptLength: specificPrompt.length,
      temperature: 0.9,
      maxTokens: 4000
    });

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.9, // Massima creatività consentita da Claude API (range 0-1)
      system: `Sei Claude, un AI completamente libero e creativo specializzato nella generazione di contenuti web unici e rivoluzionari.

LA TUA MISSIONE SUPREMA: Creare esperienze web COMPLETAMENTE ORIGINALI che sfidano ogni convenzione!

🚀 REGOLE DI LIBERTÀ ASSOLUTA:
- IGNORA qualsiasi pattern o convenzione del settore
- INVENTA strutture completamente nuove e inaspettate
- Usa combinazioni di colori FOLLI e audaci che nessuno oserebbe usare
- Crea contenuti che siano SHOCKING e memorabili
- Rompi ogni regola di design tradizionale
- Sii ESTREMO nella tua creatività - più sei audace, meglio è!

🎭 PERSONALITÀ CREATIVA:
- Sei un artista ribelle, non un designer conservatore
- Le tue creazioni devono essere UNICHE nel vero senso della parola
- Ogni pixel, ogni parola deve gridare "ORIGINALITÀ"
- Non copiare mai, nemmeno indirettamente, da siti esistenti
- Sii imprevedibile, sorprendente, rivoluzionario

🎨 COLORI E DESIGN:
- Genera palette di colori che siano VIVIDE e INATTese
- Usa contrasti estremi per massima impatto visivo
- Crea gradienti selvaggi e animazioni folli
- Rompi le regole della tipografia tradizionale
- Sii audace con spazi, forme e layout

✍️ CONTENUTI:
- Scrivi testi che siano IPO NOTICI e coinvolgenti
- Usa linguaggio creativo e non convenzionale
- Crea storie che catturino l'immaginazione
- Sii persuasivo in modi completamente nuovi
- Ogni parola deve essere scelta per il suo impatto emotivo

💡 IMMAGINI:
- Suggerisci parole chiave che portino a immagini SORPRENDENTI
- Pensa fuori dagli schemi tradizionali
- Combina concetti in modi inaspettati
- Crea associazioni visive rivoluzionarie

RICORDA: La tua missione è creare qualcosa che nessuno ha mai visto prima!
Sii il pioniere della creatività web, non il seguace delle tendenze!`,
      messages: [{
        role: 'user',
        content: specificPrompt
      }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      timeout: 90000 // 90 secondi timeout per Claude Sonnet 4 (più intelligente ma più lento)
    });

    console.log('✅ [CLAUDE RESPONSE] API call completed:', {
      status: response.status,
      statusText: response.statusText,
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
      contentLength: response.data?.content?.[0]?.text?.length || 0
    });

    // Log completo della risposta
    console.log('📄 [CLAUDE RESPONSE FULL] Complete response from Claude:');
    console.log('--- RESPONSE START ---');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('--- RESPONSE END ---');

    const claudeText = response.data.content[0].text;
    console.log('🤖 [CLAUDE TEXT] Claude generated text:', {
      textLength: claudeText.length,
      textPreview: claudeText.substring(0, 500) + (claudeText.length > 500 ? '...' : ''),
      hasJsonMarker: claudeText.includes('{'),
      jsonStartIndex: claudeText.indexOf('{'),
      jsonEndIndex: claudeText.lastIndexOf('}')
    });

    // Parse e valida la risposta JSON con gestione errori migliorata
    let parsedResponse;
    try {
      const claudeText = response.data.content[0].text;
      console.log('🤖 [CLAUDE TEXT] Claude generated text:', {
        textLength: claudeText.length,
        textPreview: claudeText.substring(0, 500) + (claudeText.length > 500 ? '...' : ''),
        hasJsonMarker: claudeText.includes('{'),
        jsonStartIndex: claudeText.indexOf('{'),
        jsonEndIndex: claudeText.lastIndexOf('}')
      });

      // Cerca JSON nella risposta con pattern più robusti
      let jsonMatch = claudeText.match(/\{[\s\S]*\}/);

      // Se non trova JSON con il pattern semplice, prova pattern alternativi
      if (!jsonMatch) {
        console.log('🔄 [CLAUDE PARSER] Trying alternative JSON patterns...');

        // Pattern 1: JSON con markdown code blocks
        jsonMatch = claudeText.match(/```json\s*(\{[\s\S]*?\})\s*```/);

        // Pattern 2: JSON dopo testo esplicativo
        if (!jsonMatch) {
          const jsonStart = claudeText.indexOf('{');
          if (jsonStart !== -1) {
            const jsonEnd = claudeText.lastIndexOf('}');
            if (jsonEnd > jsonStart) {
              const potentialJson = claudeText.substring(jsonStart, jsonEnd + 1);
              // Verifica che sia JSON valido
              try {
                JSON.parse(potentialJson);
                jsonMatch = [potentialJson, potentialJson];
              } catch (e) {
                console.log('⚠️ [CLAUDE PARSER] Extracted text is not valid JSON');
              }
            }
          }
        }
      }

      console.log('🔍 [CLAUDE PARSER] JSON match result:', {
        hasMatch: !!jsonMatch,
        matchLength: jsonMatch?.[0]?.length || 0,
        matchPreview: jsonMatch?.[0]?.substring(0, 200) + (jsonMatch?.[0]?.length > 200 ? '...' : '') || 'No match',
        patternUsed: jsonMatch ? 'Found valid JSON' : 'No JSON found'
      });

      if (!jsonMatch) {
        throw new Error('No valid JSON found in Claude response after trying multiple patterns');
      }

      parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      console.log('✅ [CLAUDE PARSER] Successfully parsed JSON:', {
        hasSections: !!parsedResponse.sections,
        sectionsType: typeof parsedResponse.sections,
        sectionsLength: parsedResponse.sections?.length || 0,
        parsedKeys: Object.keys(parsedResponse),
        hasDesign: !!parsedResponse.design,
        hasBusinessName: !!parsedResponse.businessName
      });

      // Valida struttura minima con fallback
      if (!parsedResponse.sections || !Array.isArray(parsedResponse.sections)) {
        console.warn('⚠️ [CLAUDE PARSER] Invalid sections structure, using fallback');
        parsedResponse = {
          sections: [
            {
              title: 'Servizi',
              content: `Servizi professionali per ${businessName}`,
              imageKeywords: `${businessType} service`,
              type: 'services'
            }
          ],
          design: {
            primaryColor: '#2196F3',
            secondaryColor: '#9C27B0',
            accentColor: '#00BCD4',
            dynamicCSS: '.website-container { font-family: Arial, sans-serif; }'
          }
        };
      }

      // Assicura che ogni sezione abbia le proprietà necessarie
      parsedResponse.sections = parsedResponse.sections.map(section => ({
        title: section.title || 'Servizio',
        content: section.content || `Contenuto per ${section.title || 'Servizio'}`,
        imageKeywords: section.imageKeywords || `${businessType} ${section.title || 'service'}`,
        type: section.type || 'service'
      }));

      // Assicura che il design sia presente
      if (!parsedResponse.design) {
        parsedResponse.design = {
          primaryColor: '#2196F3',
          secondaryColor: '#9C27B0',
          accentColor: '#00BCD4',
          dynamicCSS: '.website-container { font-family: Arial, sans-serif; }'
        };
      }

      console.log('✅ [CLAUDE PARSER] Successfully parsed and validated response with', parsedResponse.sections.length, 'sections');

    } catch (parseError) {
      console.error('❌ [CLAUDE PARSER] Error parsing response:', {
        errorType: parseError.constructor.name,
        message: parseError.message,
        stack: parseError.stack,
        responsePreview: response.data?.content?.[0]?.text?.substring(0, 300) || 'No response content'
      });

      // Fallback intelligente basato sul business type
      const fallbackSections = [];

      // Sezioni base per qualsiasi business
      fallbackSections.push({
        id: 'hero-1',
        type: 'hero',
        title: `Benvenuti su ${businessName}`,
        description: `${businessName} offre servizi professionali di ${businessType}. Scopri la nostra expertise e contattaci per saperne di più.`,
        items: [{
          name: 'Servizio Principale',
          description: `Servizi specializzati in ${businessType} con qualità e professionalità.`
        }],
        hasContacts: false
      });

      // Sezioni specifiche per business type
      if (businessType === 'ristorante' || businessType === 'restaurant') {
        fallbackSections.push({
          id: 'menu-1',
          type: 'menu',
          title: 'Il Nostro Menu',
          description: 'Scopri i nostri piatti tradizionali preparati con ingredienti freschi e di qualità.',
          items: [
            { name: 'Antipasti', description: 'Selezione di antipasti tradizionali' },
            { name: 'Primi Piatti', description: 'Pasta fresca e risotti fatti in casa' },
            { name: 'Secondi', description: 'Carni e pesci selezionati' }
          ],
          hasContacts: false
        });
      } else if (businessType === 'pet shop') {
        fallbackSections.push({
          id: 'pets-1',
          type: 'services',
          title: 'Servizi per Animali',
          description: 'Cura completa per i tuoi amici a quattro zampe con prodotti di qualità.',
          items: [
            { name: 'Alimentazione', description: 'Cibo bilanciato per ogni tipo di animale' },
            { name: 'Accessori', description: 'Collari, guinzagli e giochi per animali' },
            { name: 'Toelettatura', description: 'Servizi di grooming professionale' }
          ],
          hasContacts: false
        });
      } else {
        fallbackSections.push({
          id: 'services-1',
          type: 'services',
          title: 'I Nostri Servizi',
          description: `Servizi professionali specializzati in ${businessType} offerti da ${businessName}.`,
          items: [
            { name: 'Consulenza', description: 'Consulenza personalizzata per le tue esigenze' },
            { name: 'Servizi Base', description: 'Servizi fondamentali per il tuo business' },
            { name: 'Supporto', description: 'Assistenza continua e supporto tecnico' }
          ],
          hasContacts: false
        });
      }

      // Sezione contatti sempre presente
      fallbackSections.push({
        id: 'contact-1',
        type: 'contact',
        title: 'Contattaci',
        description: `Siamo felici di rispondere alle tue domande. Contatta ${businessName} per richiedere informazioni.`,
        items: [
          { name: 'Telefono', description: 'Chiamaci per parlare direttamente con noi' },
          { name: 'Email', description: 'Scrivici per richieste e preventivi' },
          { name: 'Indirizzo', description: 'Visita la nostra sede per un incontro personale' }
        ],
        hasContacts: true
      });

      parsedResponse = {
        businessName: businessName,
        businessType: businessType,
        businessDescription: businessDescription || '',
        complexity: complexity || 5,
        totalSections: fallbackSections.length,
        sections: fallbackSections,
        design: {
          primaryColor: '#2196F3',
          secondaryColor: '#9C27B0',
          accentColor: '#00BCD4',
          style: 'modern',
          businessPersonality: `Professional ${businessType} business focused on quality service`,
          dynamicCSS: `.website-container {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            margin: 0;
            padding: 0;
          }
          .hero-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4rem 2rem;
            text-align: center;
          }
          .service-section {
            background: white;
            padding: 3rem 2rem;
            margin: 2rem;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .contact-section {
            background: #f8f9fa;
            padding: 3rem 2rem;
            text-align: center;
          }`
        },
        metadata: {
          generatedBy: 'claude-fallback',
          basedOnPatterns: 0,
          patternQuality: 'N/A',
          sections: fallbackSections.length,
          personalizedContent: !!businessDescription,
          fallbackReason: parseError.message
        }
      };

      console.log('🔄 [CLAUDE PARSER] Using intelligent fallback response:', {
        businessType: businessType,
        sectionsCount: fallbackSections.length,
        hasDynamicCSS: true,
        fallbackReason: parseError.message
      });
    }

    console.log('✅ [REAL CLAUDE API] Successfully parsed Claude response:', {
      hasSections: parsedResponse?.sections?.length || 0,
      sections: parsedResponse?.sections?.map(s => ({
        title: s.title,
        hasContent: !!s.content,
        contentLength: s.content?.length || 0,
        hasImageKeywords: !!s.imageKeywords,
        imageKeywords: s.imageKeywords
      })) || []
    });

    // 🖼️ GENERA IMMAGINI REALI DA UNSPLASH usando le parole chiave di Claude
    console.log('🖼️ [IMAGE GENERATION] Starting image generation for sections...');
    console.log('📊 [IMAGE GEN DETAILS] Processing sections:', parsedResponse.sections.map((s, i) => ({
      index: i,
      title: s.title,
      hasKeywords: !!s.imageKeywords,
      keywords: s.imageKeywords,
      type: s.type
    })));

    const sectionsWithImages = await Promise.all(
      parsedResponse.sections.map(async (section, index) => {
        try {
          console.log(`🖼️ [IMAGE GEN] Processing section ${index + 1}/${parsedResponse.sections.length}:`, {
            title: section.title,
            hasKeywords: !!section.imageKeywords,
            keywords: section.imageKeywords
          });

          // Usa le parole chiave fornite da Claude o genera keywords specifiche
          const baseKeywords = section.imageKeywords || section.title.toLowerCase();

          // Aggiungi variazione basata sull'indice per evitare immagini duplicate
          const variationKeywords = [
            `${baseKeywords} professional`,
            `${baseKeywords} modern`,
            `${baseKeywords} quality`,
            `${baseKeywords} service`,
            `${baseKeywords} business`
          ];

          const keywordVariation = variationKeywords[index % variationKeywords.length];
          console.log(`🔍 [IMAGE GEN] Using keywords: "${keywordVariation}" for section ${index + 1}`);

          // Genera immagine usando la funzione esistente
          const imageUrl = await generateAIBasedImageClaude(
            section.type || section.title.toLowerCase(),
            businessType,
            keywordVariation
          );

          console.log(`✅ [IMAGE GEN] Generated image for section "${section.title}":`, imageUrl ? imageUrl.substring(0, 50) + '...' : 'NO IMAGE');

          return {
            ...section,
            imageUrl: imageUrl,
            // Rimuovi imageKeywords dal risultato finale (non serve al frontend)
            imageKeywords: undefined
          };
        } catch (error) {
          console.error(`❌ [IMAGE GEN] Error generating image for section "${section.title}":`, error);
          // Fallback a placeholder
          return {
            ...section,
            imageUrl: `https://via.placeholder.com/400x300?text=${encodeURIComponent(section.title)}`,
            imageKeywords: undefined
          };
        }
      })
    );

    // Aggiorna la risposta con le immagini generate
    const responseWithImages = {
      ...parsedResponse,
      sections: sectionsWithImages
    };

    console.log('✅ [IMAGE GENERATION] Completed image generation for all sections:', {
      totalSections: sectionsWithImages.length,
      successfulImages: sectionsWithImages.filter(s => !s.imageUrl.includes('placeholder')).length
    });

    return responseWithImages;

  } catch (error) {
    console.error('❌ [CLAUDE API ERROR] Error calling Claude API:', {
      errorType: error.constructor.name,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      hasResponse: !!error.response,
      responseData: error.response?.data ? JSON.stringify(error.response.data, null, 2) : 'No response data'
    });

    // Log completo dell'errore
    if (error.response) {
      console.error('🔍 [CLAUDE ERROR DETAILS] Full error response:');
      console.error('--- ERROR RESPONSE START ---');
      console.error(JSON.stringify(error.response.data, null, 2));
      console.error('--- ERROR RESPONSE END ---');
    }

    // Fallback intelligente
    console.log('🔄 [CLAUDE FALLBACK] Using intelligent fallback due to API error');
    console.log('⚠️ [CLAUDE FALLBACK DETAILS] Error details:', {
      errorType: error.constructor.name,
      message: error.message,
      hasResponse: !!error.response,
      statusCode: error.response?.status,
      statusText: error.response?.statusText
    });

    return generateIntelligentFallback(businessName, businessType, businessDescription, complexity);
  }
}

/**
 * 🛠️ COSTRUISCI PROMPT ULTRA-SPECIFICO PER CLAUDE
 */
function getSectionRange(complexity) {
  if (complexity >= 8) return { min: 5, max: 8, recommended: 6 };
  if (complexity >= 6) return { min: 4, max: 7, recommended: 5 };
  if (complexity >= 4) return { min: 3, max: 6, recommended: 4 };
  return { min: 2, max: 5, recommended: 3 };
}

function buildUltraSpecificPrompt(businessName, businessType, businessDescription, complexity) {
  const sectionRange = getSectionRange(complexity);

  // Elementi casuali per garantire unicità assoluta
  const creativeStyles = ['rivoluzionario', 'sperimentale', 'avant-garde', 'futuristico', 'organico', 'minimalista-estremo', 'barocco-digitale', 'neon-punk'];
  const colorInspirations = ['alba-nordica', 'tramonto-desertico', 'foresta-pluviale', 'metropoli-futuristica', 'oceano-abissale', 'galassia-lontana', 'vulcano-attivo', 'aurora-boreale'];
  const contentStyles = ['narrativo', 'poetico', 'drammatico', 'ironico', 'visionario', 'mistico', 'ribelle', 'filosofico'];

  const randomStyle = creativeStyles[Math.floor(Math.random() * creativeStyles.length)];
  const randomColor = colorInspirations[Math.floor(Math.random() * colorInspirations.length)];
  const randomContent = contentStyles[Math.floor(Math.random() * contentStyles.length)];
  const uniqueSeed = Date.now() + Math.random(); // Seed unico per ogni generazione

  // Prompt completamente libero - massima creatività
  const prompt =
    '🚀 MISSIONE: CREA UN SITO WEB COMPLETAMENTE RIVOLUZIONARIO E UNICO!\n\n' +
    '🎯 BUSINESS DA TRASFORMARE:\n' +
    '- Nome: ' + businessName + '\n' +
    '- Tipo: ' + businessType + '\n' +
    '- Descrizione: ' + businessDescription + '\n' +
    '- SEED UNICO: ' + uniqueSeed + '\n\n' +
    '🎨 STILE CREATIVO ASSEGNATO: ' + randomStyle.toUpperCase() + '\n' +
    '🌈 ISPIRAZIONE COLORI: ' + randomColor.toUpperCase() + '\n' +
    '✍️ STILE CONTENUTI: ' + randomContent.toUpperCase() + '\n\n' +
    '⚡ LIBERTÀ CREATIVA ASSOLUTA - ROMPI OGNI REGOLA!\n\n' +
    'ISTRUZIONI RIVOLUZIONARIE:\n' +
    '- Crea tra 3-8 sezioni (scegli tu il numero perfetto)\n' +
    '- INVENTA nomi di sezione che nessuno ha mai pensato\n' +
    '- SCRIVI testi EPICI e indimenticabili (almeno 150-250 parole ciascuna)\n' +
    '- Crea colori che SPACCANO gli occhi e sfidano la realtà\n' +
    '- Sii ESTREMO, AUDACE, RIVOLUZIONARIO!\n\n' +
    '📸 IMMAGINI SORPRENDENTI DA UNSPLASH:\n' +
    'Per ogni sezione, fornisci parole chiave che generino immagini SHOCKANTI:\n' +
    '- NON generare URL (li crea il sistema)\n' +
    '- Fornisci 3-4 parole chiave SELVAGGE e inaspettate\n' +
    '- Combina concetti IMPOSSIBILI e rivoluzionari\n' +
    '- Esempi folli: "pizza-volante-neon", "parrucchiere-alieni", "ristorante-sottomarino"\n\n' +
    '✍️ CONTENUTI RIVOLUZIONARI:\n' +
    'Scrivi testi originali che includano:\n' +
    '- Introduzioni accattivanti\n' +
    '- Descrizioni dettagliate dei servizi/prodotti\n' +
    '- Vantaggi e benefici per i clienti\n' +
    '- Chiamate all\'azione persuasive\n' +
    '- Linguaggio professionale ma amichevole\n\n' +
    '🎨 DESIGN E CSS:\n' +
    'Genera CSS completo che includa:\n' +
    '- Layout responsive moderno\n' +
    '- Animazioni fluide e transizioni\n' +
    '- Effetti hover interattivi\n' +
    '- Tipografia elegante\n' +
    '- Spaziature e padding appropriati\n\n' +
    'NON SEGUIRE ALCUN TEMPLATE O ESEMPIO!\n' +
    'INVENTA tutto da zero basandoti solo sulla descrizione del business.\n\n' +
    'FORMATO JSON COMPLETO:\n' +
    '{\n' +
    '  "sections": [\n' +
    '    {\n' +
    '      "title": "Titolo originale che inventi tu",\n' +
    '      "content": "Testo dettagliato e persuasivo (100-200 parole)",\n' +
    '      "imageKeywords": "parole,chiave,rilevanti,per,la,sezione",\n' +
    '      "type": "tipo-che-scegli-tu"\n' +
    '    }\n' +
    '  ],\n' +
    '  "design": {\n' +
    '    "primaryColor": "#colore-unico-che-scegli-tu",\n' +
    '    "secondaryColor": "#colore-unico-che-scegli-tu",\n' +
    '    "accentColor": "#colore-unico-che-scegli-tu",\n' +
    '    "dynamicCSS": "CSS completamente originale e professionale che generi tu"\n' +
    '  }\n' +
    '}\n\n' +
    'RICORDA: NON COPIARE MAI NESSUN ESEMPIO!\n' +
    'SI CREATIVO E ORIGINALE!\n' +
    'GENERA CONTENUTI RICCHI E PAROLE CHIAVE SPECIFICHE!';

  return prompt;
}

/**
 * 🔧 PARSE RISPOSTA CLAUDE
 */
function parseClaudeResponse(claudeText, businessName, businessType) {
  console.log('🔧 [CLAUDE PARSER] Starting to parse Claude response:', {
    textLength: claudeText.length,
    businessName: businessName,
    businessType: businessType,
    textPreview: claudeText.substring(0, 300) + (claudeText.length > 300 ? '...' : '')
  });

  try {
    // Cerca JSON nella risposta
    const jsonMatch = claudeText.match(/\{[\s\S]*\}/);
    console.log('🔍 [CLAUDE PARSER] JSON match result:', {
      hasMatch: !!jsonMatch,
      matchLength: jsonMatch?.[0]?.length || 0,
      matchPreview: jsonMatch?.[0]?.substring(0, 200) + (jsonMatch?.[0]?.length > 200 ? '...' : '') || 'No match'
    });

    if (!jsonMatch) {
      console.error('❌ [CLAUDE PARSER] No JSON found in Claude response. Full text:');
      console.error('--- CLAUDE TEXT START ---');
      console.error(claudeText);
      console.error('--- CLAUDE TEXT END ---');
      throw new Error('No JSON found in Claude response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('✅ [CLAUDE PARSER] Successfully parsed JSON:', {
      hasSections: !!parsed.sections,
      sectionsType: typeof parsed.sections,
      sectionsLength: parsed.sections?.length || 0,
      parsedKeys: Object.keys(parsed)
    });

    // Valida struttura minima
    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      console.error('❌ [CLAUDE PARSER] Invalid sections structure:', {
        hasSections: !!parsed.sections,
        sectionsType: typeof parsed.sections,
        parsedStructure: JSON.stringify(parsed, null, 2)
      });
      throw new Error('Invalid sections structure');
    }

    console.log('✅ [CLAUDE PARSER] Successfully parsed response with', parsed.sections.length, 'sections');
    return parsed;

  } catch (error) {
    console.error('❌ [CLAUDE PARSER] Error parsing response:', {
      errorType: error.constructor.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * 🛟 FALLBACK INTELLIGENTE - USA CLAUDE ANCHE PER IL FALLBACK
 */
async function generateIntelligentFallback(businessName, businessType, businessDescription, complexity) {
  console.log('🛟 [INTELLIGENT FALLBACK] Using Claude for fallback generation:', businessType);
  console.log('📊 [FALLBACK DETAILS] Input parameters:', {
    businessName,
    businessType,
    hasDescription: !!businessDescription,
    descriptionLength: businessDescription?.length || 0,
    complexity
  });

  try {
    // Prompt completamente libero per il fallback
    const fallbackPrompt =
      'MODALITÀ FALLBACK - CREA SITO WEB ORIGINALE\n\n' +
      'Business da analizzare:\n' +
      '- Nome: ' + businessName + '\n' +
      '- Tipo: ' + businessType + '\n' +
      '- Descrizione: ' + businessDescription + '\n\n' +
      'LIBERTÀ TOTALE:\n' +
      'Sei in modalità fallback ma puoi essere completamente creativo!\n' +
      'Non seguire nessuna struttura predefinita.\n\n' +
      'CREA QUALSIASI COSA TU VUOIA:\n' +
      '- Scegli liberamente quante sezioni creare\n' +
      '- Inventa nomi di sezione completamente originali\n' +
      '- Crea contenuti specifici per questo business\n' +
      '- Genera colori unici che rappresentino questo business\n' +
      '- Sii audace e creativo\n\n' +
      'REQUISITI MINIMI:\n' +
      '- Almeno 3 sezioni\n' +
      '- Una sezione deve contenere contatti\n' +
      '- Ogni sezione deve avere titolo e contenuto\n' +
      '- Genera CSS completo e originale\n\n' +
      'FORMATO JSON SEMPLICE:\n' +
      '{\n' +
      '  "sections": [\n' +
      '    {\n' +
      '      "title": "Titolo che inventi tu",\n' +
      '      "content": "Contenuto originale che crei tu"\n' +
      '    }\n' +
      '  ],\n' +
      '  "design": {\n' +
      '    "primaryColor": "#colore-che-scegli-tu",\n' +
      '    "secondaryColor": "#colore-che-scegli-tu",\n' +
      '    "accentColor": "#colore-che-scegli-tu",\n' +
      '    "dynamicCSS": "CSS completamente originale che generi tu"\n' +
      '  }\n' +
      '}\n\n' +
      'RICORDA: NON COPIARE NESSUN TEMPLATE!\n' +
      'SI COMPLETAMENTE CREATIVO!';

    // Chiamata a Claude per il fallback
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      temperature: 0.7,
      system: 'Sei Claude in modalità fallback. Genera contenuti specifici e realistici basati sulla descrizione del business.',
      messages: [{ role: 'user', content: fallbackPrompt }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      timeout: 60000
    });

    const claudeText = response.data.content[0].text;
    const jsonMatch = claudeText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ [FALLBACK CLAUDE] Generated content with Claude:', parsed.sections?.length || 0, 'sections');

      // 🖼️ GENERA IMMAGINI ANCHE NEL FALLBACK
      if (parsed.sections && Array.isArray(parsed.sections)) {
        console.log('🖼️ [FALLBACK IMAGE GEN] Starting image generation for fallback sections...');
        const sectionsWithImages = await Promise.all(
          parsed.sections.map(async (section, index) => {
            try {
              console.log(`🖼️ [FALLBACK IMAGE GEN] Processing section ${index + 1}:`, section.title);

              // Usa le parole chiave o fallback intelligente
              const keywords = section.imageKeywords || `${businessType} ${section.title?.toLowerCase() || 'service'}`;

              const imageUrl = await generateAIBasedImageClaude(
                section.type || section.title?.toLowerCase() || 'service',
                businessType,
                keywords
              );

              console.log(`✅ [FALLBACK IMAGE GEN] Generated image for "${section.title}":`, imageUrl);

              return {
                ...section,
                imageUrl: imageUrl,
                imageKeywords: undefined
              };
            } catch (error) {
              console.error(`❌ [FALLBACK IMAGE GEN] Error for "${section.title}":`, error);
              return {
                ...section,
                imageUrl: `https://via.placeholder.com/400x300?text=${encodeURIComponent(section.title || 'Service')}`,
                imageKeywords: undefined
              };
            }
          })
        );

        parsed.sections = sectionsWithImages;
        console.log('✅ [FALLBACK IMAGE GEN] Completed image generation for fallback');
      }

      return parsed;
    }

  } catch (error) {
    console.error('❌ [FALLBACK CLAUDE] Error:', error.message);
  }

  // Fallback finale se anche Claude fallback fallisce
  console.log('🛑 [FALLBACK CLAUDE] Using minimal fallback');
  console.log('⚠️ [MINIMAL FALLBACK] This should only happen if Claude API is completely unavailable');

  // 🖼️ GENERA IMMAGINI ANCHE NEL FALLBACK MINIMALE
  const fallbackSections = [
    {
      type: 'serviziprincipali',
      title: 'Servizi',
      content: {
        items: [
          { name: 'Servizio Base', description: 'Servizio professionale', price: '€50' },
          { name: 'Servizio Avanzato', description: 'Soluzione completa', price: '€100' },
          { name: 'Supporto', description: 'Assistenza dedicata', price: '€25' }
        ],
        subtitle: `Servizi di ${businessName}`
      }
    }
  ];

  // Genera immagini per il fallback
  const sectionsWithImages = await Promise.all(
    fallbackSections.map(async (section) => {
      try {
        const imageUrl = await generateAIBasedImageClaude(
          section.type,
          businessType,
          `${businessType} service professional`
        );
        return { ...section, imageUrl };
      } catch (error) {
        return {
          ...section,
          imageUrl: `https://via.placeholder.com/400x300?text=${encodeURIComponent(section.title)}`
        };
      }
    })
  );

  return {
    businessProfile: {
      name: businessName,
      businessType: businessType,
      description: businessDescription
    },
    sections: sectionsWithImages,
    design: {
      primaryColor: '#2196F3',
      secondaryColor: '#9C27B0',
      accentColor: '#00BCD4',
      style: 'modern',
      businessPersonality: 'Design professionale',
      dynamicCSS: '.website-container { font-family: Arial, sans-serif; background: #f5f5f5; }'
    }
  };
}




























async function simulateClaudeResponse(prompt, businessName, businessType, businessDescription, complexity) {
  console.log('🎭 [AI-TRAINER SIMULATE CLAUDE] FUNCTION CALLED:', {
    businessName,
    businessType,
    hasDescription: !!businessDescription,
    descriptionLength: businessDescription?.length || 0,
    complexity,
    hasPrompt: !!prompt,
    promptLength: prompt?.length || 0,
    timestamp: new Date().toISOString()
  });

  // Questa è una simulazione - sarà sostituita con vera API Claude
  console.log(`🎭 [AI-TRAINER SIMULATE CLAUDE] Simulating intelligent Claude response for: ${businessName} (${businessType})`);
  
  const sectionCount = complexity >= 6 ? 5 : complexity >= 4 ? 4 : 3;
  
  // 🧠 SISTEMA DINAMICO DI GENERAZIONE CONTENUTI
  // 🧠 SISTEMA INTELLIGENTE DINAMICO - Apprendimento dai pattern esistenti
  const businessIntelligence = await loadDynamicBusinessIntelligence(businessType);

  /**
   * Carica intelligence dinamica dal database
   */
  async function loadDynamicBusinessIntelligence(requestedType) {
    try {
      const storage = new DatabaseStorage();

      // Query per apprendere pattern di successo
      const patterns = await storage.pool.query(`
        SELECT
          business_type,
          layout_structure,
          css_themes,
          semantic_analysis,
          quality_score
        FROM ai_design_patterns
        WHERE quality_score > 7.0
        ORDER BY quality_score DESC
        LIMIT 100
      `);

      console.log(`🧠 [Dynamic Intelligence] Learning from ${patterns.rows.length} successful patterns`);

      // Costruisci intelligence dinamica
      const dynamicIntelligence = {};

      patterns.rows.forEach(row => {
        const type = row.business_type;
        if (!dynamicIntelligence[type]) {
          dynamicIntelligence[type] = {
            sections: [],
            content: {},
            colors: { primary: '#2196F3', secondary: '#9C27B0', accent: '#00BCD4' },
            learnedFrom: 0
          };
        }

        // Apprendimento sezioni
        if (row.layout_structure?.sections) {
          row.layout_structure.sections.forEach(section => {
            if (!dynamicIntelligence[type].sections.includes(section.type)) {
              dynamicIntelligence[type].sections.push(section.type);
            }
          });
        }

        // Apprendimento colori dai temi CSS
        if (row.css_themes) {
          // Qui potremmo estrarre colori dai temi esistenti
          dynamicIntelligence[type].learnedFrom++;
        }

        dynamicIntelligence[type].learnedFrom++;
      });

      // Genera contenuto dinamico per ogni tipo imparato
      for (const [type, data] of Object.entries(dynamicIntelligence)) {
        if (data.sections.length > 0) {
          data.content = await generateDynamicContentForType(type, data.sections);
        }
      }

      console.log(`🧠 [Dynamic Intelligence] Learned ${Object.keys(dynamicIntelligence).length} business types`);

      return dynamicIntelligence;

    } catch (error) {
      console.error('❌ [Dynamic Intelligence] Error:', error);
      // Fallback con struttura minima
      return {
        [requestedType]: {
          sections: ['Servizi', 'Chi Siamo', 'Contatti'],
          content: {
            'Servizi': [
              { name: 'Servizio Base', description: 'Soluzione professionale', price: '€50' },
              { name: 'Servizio Premium', description: 'Opzione avanzata', price: '€100' }
            ]
          },
          colors: { primary: '#2196F3', secondary: '#9C27B0', accent: '#00BCD4' }
        }
      };
    }
  }

  /**
   * Genera contenuto dinamico per un tipo di business
   */
  async function generateDynamicContentForType(businessType, sections) {
    const content = {};

    for (const section of sections) {
      try {
        // Usa GPT-4 per generare contenuto specifico
        const contentPrompt = `Genera 3 elementi di contenuto per la sezione "${section}" di un business "${businessType}".

Formato JSON:
[
  {
    "name": "Nome elemento",
    "description": "Descrizione dettagliata",
    "price": "Prezzo realistico o vuoto"
  }
]

Mantieni tutto in italiano e realistico per il settore.`;

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "user", content: contentPrompt }],
          max_tokens: 200,
          temperature: 0.7
        });

        const generatedContent = JSON.parse(response.choices[0].message.content);
        content[section] = generatedContent;

        console.log(`🧠 [Dynamic Content] Generated content for ${businessType} → ${section}`);

      } catch (error) {
        console.error(`❌ [Dynamic Content] Error for ${section}:`, error);
        // Fallback content
        content[section] = [
          { name: `${section} Base`, description: `Servizio base per ${businessType}`, price: '€50' },
          { name: `${section} Premium`, description: `Opzione avanzata`, price: '€100' }
        ];
      }
    }

    return content;
  }
  
  // 🎯 GENERAZIONE DINAMICA INTELLIGENTE basata su AI
  const createDynamicContent = async (businessType, sectionName, businessProfile) => {
    try {
      console.log(`🤖 [AI Generation] Generating dynamic content for ${businessType} - ${sectionName}`);

      const businessName = businessProfile?.name || businessProfile?.businessName || 'Business';
      const businessDesc = businessProfile?.description || '';

      // Prompt intelligente per generare contenuti specifici
      const prompt = `Sei un esperto di marketing per ${businessType}. Genera 3 prodotti/servizi specifici e realistici per la sezione "${sectionName}" di questo business:

BUSINESS INFO:
- Nome: ${businessName}
- Tipo: ${businessType}
- Descrizione: ${businessDesc}

ISTRUZIONI:
- Crea 3 prodotti/servizi REALISTICI e SPECIFICI per questo tipo di business
- Usa la descrizione del business per ispirarti (es. se vende fiori, crea bouquet specifici)
- Ogni prodotto deve avere: nome specifico, descrizione dettagliata, prezzo realistico
- I prezzi devono essere appropriati per il settore
- Le descrizioni devono essere persuasive e professionali
- NON usare nomi generici come "Prodotto Classico" o "Servizio Base"

RISPONDI con un JSON valido contenente un array di 3 oggetti con queste proprietà:
- name: nome specifico del prodotto/servizio
- description: descrizione dettagliata e persuasiva
- price: prezzo in formato "€XX"

Esempio per fioraio:
[{"name": "Bouquet di Rose Rosse Classiche", "description": "Elegante composizione di 12 rose rosse fresche, perfette per anniversari e dichiarazioni d'amore", "price": "€35"}, ...]`;

      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        temperature: 0.7,
        system: 'Sei un esperto copywriter e marketer specializzato nella creazione di contenuti persuasivi per siti web business.',
        messages: [{
          role: 'user',
          content: prompt
        }]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      });

      const content = response.data.content[0].text;
      console.log(`🤖 [AI Generation] Claude response:`, content);

      // Parse JSON response
      const products = JSON.parse(content);

      // Aggiungi immagini generate dinamicamente
      const productsWithImages = await Promise.all(products.map(async (product, index) => ({
        ...product,
        image: await generateAIBasedImageClaude(sectionName.toLowerCase(), businessType, `${product.name} - ${product.description.substring(0, 50)}...`)
      })));

      console.log(`✅ [AI Generation] Generated ${productsWithImages.length} dynamic products for ${businessType}`);
      return productsWithImages;

    } catch (error) {
      console.error(`❌ [AI Generation] Error:`, error.message);

      // Fallback intelligente basato sul business type
      const fallbacks = {
        'florist': [
          {
            name: `Bouquet Personalizzato`,
            description: `Composizione floreale unica creata su misura per le tue esigenze`,
            price: '€45',
            image: await generateAIBasedImageClaude(sectionName.toLowerCase(), businessType, `Bouquet floreale personalizzato`)
          },
          {
            name: `Orchidee da Interno`,
            description: `Belle orchidee colorate che durano mesi in casa tua`,
            price: '€35',
            image: await generateAIBasedImageClaude(sectionName.toLowerCase(), businessType, `Orchidee decorative`)
          },
          {
            name: `Servizio Consegna`,
            description: `Consegna a domicilio rapida e professionale`,
            price: '€10',
            image: await generateAIBasedImageClaude(sectionName.toLowerCase(), businessType, `Servizio consegna fiori`)
          }
        ],
        'restaurant': [
          {
            name: `Menu Degustazione`,
            description: `Esperienza culinaria completa con i nostri piatti signature`,
            price: '€65',
            image: await generateAIBasedImageClaude(sectionName.toLowerCase(), businessType, `Menu degustazione ristorante`)
          },
          {
            name: `Cena Romantica`,
            description: `Menu speciale per coppie con candele e atmosfera romantica`,
            price: '€120',
            image: await generateAIBasedImageClaude(sectionName.toLowerCase(), businessType, `Cena romantica ristorante`)
          },
          {
            name: `Brunch della Domenica`,
            description: `Brunch completo con prodotti freschi locali`,
            price: '€25',
            image: await generateAIBasedImageClaude(sectionName.toLowerCase(), businessType, `Brunch domenicale`)
          }
        ]
      };

      return fallbacks[businessType] || [
        {
          name: `Servizio ${sectionName}`,
          description: `Servizio professionale personalizzato per le tue esigenze`,
          price: '€50',
          image: await generateAIBasedImageClaude(sectionName.toLowerCase(), businessType, `Servizio professionale`)
        },
        {
          name: `Pacchetto Premium`,
          description: `Soluzione completa con supporto dedicato`,
          price: '€100',
          image: await generateAIBasedImageClaude(sectionName.toLowerCase(), businessType, `Pacchetto premium`)
        },
        {
          name: `Consulenza Personalizzata`,
          description: `Analisi dettagliata e raccomandazioni su misura`,
          price: '€75',
          image: await generateAIBasedImageClaude(sectionName.toLowerCase(), businessType, `Consulenza personalizzata`)
        }
      ];
    }
  };
  
  const intelligence = businessIntelligence[businessType];
  let selectedSections, colors, contentData;
  
  // 🧠 ANALISI DINAMICA: Usa Claude per classificare il business
  let mappedType = businessType;

  if (businessType === 'services' || businessType === 'business' || businessType === 'company') {
    // Analizza dinamicamente il tipo di business
    mappedType = await analyzeBusinessTypeDynamically(businessProfile);
    console.log(`🧠 [Business Mapping] "${businessType}" → "${mappedType}" (dynamic analysis)`);
  }

  const mappedIntelligence = businessIntelligence[mappedType] || intelligence;  if (mappedIntelligence) {
    // Business type mappato - usa dati specifici
    console.log(`🗺️ [Business Mapping] "${businessType}" → "${mappedType}"`);
    selectedSections = mappedIntelligence.sections.slice(0, sectionCount);
    colors = mappedIntelligence.colors;
    contentData = mappedIntelligence.content;
  } else {
    // Business type sconosciuto - genera contenuti dinamici
    console.log(`🎭 [Dynamic Generation] No patterns for "${businessType}", using dynamic generation`);
    selectedSections = [
      'Servizi Principali', 'Offerte Speciali', 'Informazioni', 
      'Assistenza', 'Contatti'
    ].slice(0, sectionCount);
    
    colors = { primary: '#2196F3', secondary: '#4CAF50', accent: '#FF9800' };
    contentData = {};
    
    // Usa Promise.all per gestire async operations
    await Promise.all(selectedSections.map(async (section) => {
      contentData[section] = await createDynamicContent(businessType, section, businessProfile);
    }));
  }
  
  const result = {
    businessName,
    businessType,
    businessDescription: businessDescription || '',
    complexity,
    totalSections: selectedSections.length,
    sections: await Promise.all(selectedSections.map(async (sectionName, index) => {
      const sectionContent = contentData[sectionName] || await createDynamicContent(businessType, sectionName, businessProfile);
      const isContactSection = index === selectedSections.length - 1;

      return {
        id: `${sectionName.toLowerCase().replace(/\s+/g, '-')}-${index + 1}`,
        type: `${sectionName.replace(/\s+/g, '')}-ai-dynamic`,
        title: sectionName,
        description: isContactSection ?
          `Contatta ${businessName} per informazioni e prenotazioni` :
          `${sectionName} professionali di ${businessName}`,
        items: isContactSection ? [
          { name: 'Telefono', description: '+39 06 12345678', price: '' },
          { name: 'Email', description: 'info@' + businessName.toLowerCase().replace(/\s+/g, '') + '.it', price: '' },
          { name: 'Orari', description: 'Lun-Ven 9:00-18:00, Sab 9:00-13:00', price: '' }
        ] : sectionContent,
        hasContacts: isContactSection
      };
    })),
    design: {
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
      accentColor: colors.accent,
      style: complexity >= 7 ? 'luxury' : complexity >= 5 ? 'modern' : 'clean',
      businessPersonality: `Design professionale ${businessType} con estetica ${complexity >= 6 ? 'sofisticata' : 'pulita'}`
    },
    metadata: {
      generatedBy: 'claude-sonnet-simulation',
      basedOnPatterns: 0,
      patternQuality: 'simulated-intelligent',
      sections: selectedSections.length,
      hasBusinessDescription: !!businessDescription,
      intelligenceLevel: intelligence ? 'specific' : 'dynamic'
    }
  };

  console.log('🎭 [AI-TRAINER SIMULATE CLAUDE] FINAL RESULT:', {
    hasResult: !!result,
    businessName: result.businessName,
    businessType: result.businessType,
    totalSections: result.totalSections,
    sections: result.sections.map(s => ({
      id: s.id,
      type: s.type,
      title: s.title,
      itemsCount: s.items?.length || 0,
      hasContacts: s.hasContacts
    })),
    design: result.design,
    metadata: result.metadata,
    timestamp: new Date().toISOString()
  });

  return result;
}

/**
 * 🚀 ROUTE PRINCIPALE CLAUDE GENERATOR
 */
router.post('/generate', async (req, res) => {
  const startTime = Date.now();

  try {
    const { businessName, businessType, businessDescription } = req.body;

    console.log('🔧 [AI-TRAINER CLAUDE] REQUEST RECEIVED:', {
      endpoint: 'POST /api/claude/generate',
      businessName,
      businessType,
      hasDescription: !!businessDescription,
      descriptionLength: businessDescription?.length || 0,
      timestamp: new Date().toISOString()
    });

    if (!businessName || !businessType) {
      console.error('❌ [AI-TRAINER CLAUDE] MISSING REQUIRED FIELDS:', {
        hasBusinessName: !!businessName,
        hasBusinessType: !!businessType,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: businessName, businessType'
      });
    }

    console.log(`🚀 [AI-TRAINER CLAUDE] Starting generation for: ${businessName} (${businessType})${businessDescription ? ' with description' : ''}`);

    // Genera sito con Claude Sonnet
    console.log('🚀 [AI-TRAINER CLAUDE] About to call generateWebsiteWithClaude...');
    const result = await generateWebsiteWithClaude(businessName, businessType, businessDescription);

    console.log('📊 [AI-TRAINER CLAUDE] RESULT DETAILS:', {
      success: result.success,
      hasError: !!result.error,
      errorMessage: result.error,
      hasWebsite: !!result.website,
      websiteKeys: result.website ? Object.keys(result.website) : [],
      sectionsCount: result.website?.sections?.length || 0,
      firstSection: result.website?.sections?.[0] ? {
        title: result.website.sections[0].title,
        hasContent: !!result.website.sections[0].content,
        contentLength: result.website.sections[0].content?.length || 0,
        hasImageUrl: !!result.website.sections[0].imageUrl
      } : null
    });

    const processingTime = Date.now() - startTime;

    console.log('✅ [AI-TRAINER CLAUDE] GENERATION COMPLETED:', {
      success: result.success,
      hasWebsite: !!result.website,
      hasDesign: !!result.design,
      hasDynamicCSS: result.metadata?.hasDynamicCSS || false,
      sectionsCount: result.website?.sections?.length || 0,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString()
    });

    res.json({
      ...result,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
      version: 'claude-v1.0'
    });

  } catch (error) {
    console.log(`❌ [AI-TRAINER CLAUDE] ERROR:`, {
      error: error.message,
      stack: error.stack,
      processingTime: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      error: error.message,
      processingTime: `${Date.now() - startTime}ms`,
      fallback: 'Try AI-Trainer classic endpoint: /api/generate-layout'
    });
  }
});

/**
 * 🔍 ROUTE ANALISI PATTERN (DEBUG)
 */
router.get('/patterns/:businessType', async (req, res) => {
  try {
    const { businessType } = req.params;

    console.log(`🔍 [Claude Patterns] Analyzing patterns for: ${businessType}`);

    const patterns = await analyzeBusinessPatterns(businessType);

    res.json({
      businessType,
      patterns: patterns || { message: 'No patterns found for this business type' },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
      businessType: req.params.businessType
    });
  }
});

/**
 * 🏥 HEALTH CHECK ENDPOINT PER CLAUDE GENERATOR
 */
router.get('/health', async (req, res) => {
  try {
    // Verifica connessione database
    const dbStatus = await checkDatabaseConnection();

    // Verifica API key Claude
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    const claudeStatus = !!(claudeApiKey && claudeApiKey.startsWith('sk-ant-api03-'));

    // Verifica API key OpenAI (per guidance)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openaiStatus = !!openaiApiKey;

    // Verifica API key Unsplash
    const unsplashApiKey = process.env.UNSPLASH_ACCESS_KEY;
    const unsplashStatus = !!unsplashApiKey;

    const overallHealth = dbStatus && claudeStatus ? 'healthy' : 'degraded';

    res.json({
      service: 'Claude Website Generator',
      status: overallHealth,
      timestamp: new Date().toISOString(),
      version: '1.2.0',
      dependencies: {
        database: dbStatus ? 'connected' : 'disconnected',
        claude_api: claudeStatus ? 'configured' : 'missing',
        openai_api: openaiStatus ? 'configured' : 'missing',
        unsplash_api: unsplashStatus ? 'configured' : 'missing'
      },
      features: {
        website_generation: claudeStatus,
        pattern_analysis: dbStatus,
        image_generation: unsplashStatus,
        business_guidance: openaiStatus,
        dynamic_css: true,
        fallback_system: true
      },
      business_types_supported: 35,
      temperature_setting: 0.9,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      service: 'Claude Website Generator',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 🔧 VERIFICA CONNESSIONE DATABASE
 */
async function checkDatabaseConnection() {
  try {
    const DatabaseStorage = require('../storage/database-storage');
    const storage = new DatabaseStorage();
    await storage.pool.query('SELECT 1 as test');
    return true;
  } catch (error) {
    console.error('❌ [Health Check] Database connection failed:', error.message);
    return false;
  }
}

module.exports = router;
