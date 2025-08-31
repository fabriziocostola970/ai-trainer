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

    const prompt = `Analizza questo business e determina il tipo più specifico possibile:

Nome: ${businessName}
Descrizione: ${businessDesc}
Tipo attuale: ${businessType}

Istruzioni:
- Analizza attentamente nome e descrizione
- Identifica il settore specifico (es: ristorante, fioraio, parrucchiere, meccanico, etc.)
- NON usare tipi generici come "services" o "business"
- Se non riesci a determinare, usa "restaurant" come fallback

Rispondi SOLO con il tipo specifico in minuscolo, senza spiegazioni aggiuntive.`;

    const response = await openai.chat.completions.create({
      model: 'claude-3-5-sonnet-20241022',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50,
      temperature: 0.1
    });

    const analyzedType = response.choices[0].message.content.trim().toLowerCase();
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

  // 🔒 Controlla API key
  const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('⚠️ [Claude Images] API key mancante - usando fallback');
    return `https://via.placeholder.com/300x200?text=${encodeURIComponent(businessType)}`;
  }

  // 📊 Controlla rate limiting
  if (!checkRateLimit()) {
    console.warn('⚠️ [Claude Images] Rate limit raggiunto - usando fallback');
    return `https://via.placeholder.com/300x200?text=${encodeURIComponent(businessType)}`;
  }

  // ⏱️ Delay etico (2 secondi)
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 🎯 Keywords semplificate per Claude
  const keywords = {
    'ristorante': ['food', 'restaurant', 'pizza'],
    'parrucchiere': ['hair salon', 'beauty', 'hairstyle'],
    'florist': ['flowers', 'bouquet', 'garden'],
    'default': ['business', 'professional', 'service']
  };

  const keyword = keywords[businessType] ? keywords[businessType][0] : keywords.default[0];

  try {
    console.log(`🔍 [Claude Images] Searching for: "${keyword}"`);

    // 🚀 Chiamata API semplificata
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

    incrementRateLimit();

    if (response.data.results && response.data.results.length > 0) {
      const photo = response.data.results[0];
      const dimensions = { width: 300, height: 200 }; // Dimensioni fisse per semplicità

      const imageUrl = `${photo.urls.raw}&w=${dimensions.width}&h=${dimensions.height}&fit=crop&q=80`;
      console.log(`✅ [Claude Images] Generated: ${imageUrl.substring(0, 50)}...`);
      return imageUrl;
    }
  } catch (error) {
    console.error(`❌ [Claude Images] API Error: ${error.message}`);
  }

  // 🚨 Fallback
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
    "primaryColor": "#HEX",
    "secondaryColor": "#HEX", 
    "accentColor": "#HEX",
    "style": "modern|elegant|minimal",
    "businessPersonality": "Description of design approach reflecting the business description"
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
${businessDescription ? `PERSONALIZATION: Make sure all content specifically reflects and incorporates: ${businessDescription}` : ''}`;

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

    // 4. Simula risposta Claude (in attesa di implementazione API Claude)
    // TODO: Sostituire con vera chiamata Claude API
    console.log('🤖 [AI-TRAINER CLAUDE] SIMULATING CLAUDE RESPONSE (NOT REAL API CALL!)');
    const claudeResponse = await simulateClaudeResponse(intelligentPrompt, businessName, businessType, businessDescription, complexity);

    console.log('✅ [AI-TRAINER CLAUDE] RESPONSE GENERATED:', {
      hasResponse: !!claudeResponse,
      responseType: typeof claudeResponse,
      hasSections: claudeResponse?.sections ? true : false,
      sectionsCount: claudeResponse?.sections?.length || 0,
      sections: claudeResponse?.sections?.map(s => s.type) || [],
      timestamp: new Date().toISOString()
    });

    console.log(`✅ [AI-TRAINER CLAUDE GENERATOR] Website generated successfully for ${businessName}${businessDescription ? ' (personalized)' : ''}`);

    const result = {
      success: true,
      website: claudeResponse,
      metadata: {
        generatedBy: 'claude-sonnet',
        basedOnPatterns: patterns?.totalPatterns || 0,
        complexity: complexity,
        timestamp: new Date().toISOString(),
        businessType: businessType,
        hasCustomDescription: !!businessDescription,
        personalized: !!businessDescription
      }
    };

    console.log('📤 [AI-TRAINER CLAUDE] RETURNING RESULT:', {
      success: result.success,
      hasWebsite: !!result.website,
      hasMetadata: !!result.metadata,
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
 * 🎭 SIMULAZIONE RISPOSTA CLAUDE (PLACEHOLDER)
 */
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
  
  // 🎯 FALLBACK INTELLIGENTE per business types non definiti
  const createDynamicContent = async (businessType, sectionName) => {
    const templates = {
      'services': [
        {
          name: `Servizio ${sectionName} Base`,
          description: `Soluzione professionale per ${businessType}`,
          price: '€50',
          image: await generateAIBasedImageClaude(sectionName.toLowerCase(), businessType, `Servizio base per ${businessType}`)
        },
        {
          name: `Servizio ${sectionName} Premium`,
          description: `Opzione avanzata con supporto dedicato`,
          price: '€100',
          image: await generateAIBasedImageClaude(sectionName.toLowerCase(), businessType, `Servizio premium per ${businessType}`)
        },
        {
          name: `Pacchetto ${sectionName} Completo`,
          description: `Soluzione all-inclusive per ogni esigenza`,
          price: '€150',
          image: await generateAIBasedImageClaude(sectionName.toLowerCase(), businessType, `Pacchetto completo per ${businessType}`)
        }
      ],
      'retail': [
        {
          name: `Prodotto ${sectionName} Classico`,
          description: `Qualità garantita e prezzo conveniente`,
          price: '€25',
          image: await generateAIBasedImageClaude(sectionName.toLowerCase(), businessType, `Prodotto classico per ${businessType}`)
        },
        {
          name: `Prodotto ${sectionName} Premium`,
          description: `Materiali di alta qualità e design curato`,
          price: '€65',
          image: await generateAIBasedImageClaude(sectionName.toLowerCase(), businessType, `Prodotto premium per ${businessType}`)
        },
        {
          name: `Edizione ${sectionName} Limitata`,
          description: `Pezzo unico per veri intenditori`,
          price: '€120',
          image: await generateAIBasedImageClaude(sectionName.toLowerCase(), businessType, `Edizione limitata per ${businessType}`)
        }
      ]
    };
    
    const category = businessType.includes('service') ? 'services' : 'retail';
    return templates[category] || templates['services'];
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
      contentData[section] = await createDynamicContent(businessType, section);
    }));
  }
  
  const result = {
    businessName,
    businessType,
    businessDescription: businessDescription || '',
    complexity,
    totalSections: selectedSections.length,
    sections: await Promise.all(selectedSections.map(async (sectionName, index) => {
      const sectionContent = contentData[sectionName] || await createDynamicContent(businessType, sectionName);
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
    const result = await generateWebsiteWithClaude(businessName, businessType, businessDescription);

    const processingTime = Date.now() - startTime;

    console.log('✅ [AI-TRAINER CLAUDE] GENERATION COMPLETED:', {
      success: result.success,
      hasWebsite: !!result.website,
      hasSections: result.website?.sections ? true : false,
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

module.exports = router;
