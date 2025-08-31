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

🎨 CRITICAL: Generate COMPLETE CSS STYLES for the entire website
- Create modern, professional CSS that matches the business type
- Include responsive design, gradients, animations, and business-specific colors
- Use CSS custom properties for consistent theming
- Ensure mobile-first responsive design
- Include hover effects and smooth transitions

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
    "businessPersonality": "Description of design approach reflecting the business description",
    "dynamicCSS": ".website-container { /* Complete CSS styles for entire website */ }"
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
    const claudeResponse = await callRealClaudeAPI(intelligentPrompt, businessName, businessType, businessDescription, complexity);

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

    console.log('📝 [REAL CLAUDE API] Built ultra-specific prompt for Claude');

    // Log completo del prompt per debug
    console.log('🔍 [CLAUDE PROMPT FULL] Complete prompt being sent to Claude:');
    console.log('--- PROMPT START ---');
    console.log(specificPrompt);
    console.log('--- PROMPT END ---');

    // Verifica API key
    const apiKey = process.env.CLAUDE_API_KEY;
    console.log('🔑 [CLAUDE API] API Key status:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPrefix: apiKey?.substring(0, 10) + '...' || 'NO KEY'
    });

    if (!apiKey) {
      throw new Error('CLAUDE_API_KEY environment variable is not set');
    }

    // CHIAMATA VERA ALL'API CLAUDE
    console.log('📤 [CLAUDE REQUEST] Sending request to Claude API...');
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.8, // Maggiore creatività per contenuti unici
      system: `Sei Claude, un esperto copywriter e designer web specializzato nella creazione di contenuti web dinamici e personalizzati.

La TUA MISSIONE: Generare contenuti SPECIFICI e REALISTICI basati sulla descrizione del business fornita.
NON usare mai contenuti generici o template fissi.
Ogni business deve avere contenuti UNICI e PERSONALIZZATI.

REGOLE FERREE:
- Analizza attentamente la descrizione del business
- Crea prodotti/servizi SPECIFICI per quel tipo di business
- Usa la location, i servizi specifici, i prodotti menzionati
- I prezzi devono essere REALISTICI per il settore
- Le descrizioni devono essere PERSUASIVE e SPECIFICHE
- NON usare frasi come "Prodotto Classico" o "Servizio Premium"
- Sii creativo ma REALISTICO`,
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
      textPreview: claudeText.substring(0, 500) + (claudeText.length > 500 ? '...' : '')
    });

    // Parse e valida la risposta JSON
    const parsedResponse = parseClaudeResponse(claudeText, businessName, businessType);

    console.log('✅ [REAL CLAUDE API] Successfully parsed Claude response:', {
      hasSections: parsedResponse?.sections?.length || 0,
      sections: parsedResponse?.sections?.map(s => s.type) || []
    });

    return parsedResponse;

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
    return generateIntelligentFallback(businessName, businessType, businessDescription, complexity);
  }
}

/**
 * 🛠️ COSTRUISCI PROMPT ULTRA-SPECIFICO PER CLAUDE
 */
function buildUltraSpecificPrompt(businessName, businessType, businessDescription, complexity) {
  const sectionCount = complexity >= 6 ? 5 : complexity >= 4 ? 4 : 3;

  return `ANALIZZA QUESTO BUSINESS E GENERA CONTENUTI SPECIFICI:

BUSINESS DETAILS:
- Nome: "${businessName}"
- Tipo: "${businessType}"
- Descrizione completa: "${businessDescription}"

ISTRUZIONI CRITICHE:
1. Leggi attentamente la descrizione del business
2. Identifica i SERVIZI SPECIFICI menzionati (es. "consegna fiori", "giardinaggio", "orchidee")
3. Identifica i PRODOTTI SPECIFICI menzionati (es. "rose rosse", "orchidee esotiche", "piante")
4. Identifica la LOCATION specifica (es. "Roma", "zona Balduina")
5. Crea contenuti REALISTICI basati su questi dettagli

GENERA ${sectionCount} SEZIONI per il sito web con contenuti SPECIFICI:

SEZIONE 1: "Servizi Principali"
- Crea 3 servizi SPECIFICI basati sulla descrizione
- Esempio per fioraio: "Consegna Fiori a Domicilio", "Composizioni Floreali Personalizzate", "Consulenza per Eventi"

SEZIONE 2: "Offerte Speciali"
- Crea 3 offerte SPECIFICHE e TEMPORANEE
- Esempio: "Bouquet di Rose Rosse -20%", "Orchidee Estive in Promozione"

SEZIONE 3: "Informazioni"
- Informazioni SPECIFICHE sul business
- Orari, location, servizi unici

SEZIONE 4: "Assistenza"
- Servizi di assistenza SPECIFICI
- Esempio: "Consulenza Floreale", "Manutenzione Giardini"

SEZIONE 5: "Contatti" (se ${sectionCount} >= 5)
- Contatti REALISTICI basati sulla location

🎨 CRITICO: GENERA CSS COMPLETO E PROFESSIONALE
Devi generare CSS dinamico completo per l'intero sito web che includa:
- Layout responsive moderno con CSS Grid e Flexbox
- Color scheme professionale basato sul tipo di business (${businessType})
- Animazioni fluide e transizioni
- Design mobile-first
- Effetti hover e stati interattivi
- Tipografia elegante e leggibile
- Spaziature e padding appropriati

FORMATO JSON RICHIESTO:
{
  "businessProfile": {
    "name": "${businessName}",
    "businessType": "${businessType}",
    "description": "${businessDescription}"
  },
  "sections": [
    {
      "type": "serviziprincipali",
      "title": "Servizi Principali",
      "content": {
        "items": [
          {
            "name": "Nome Servizio SPECIFICO",
            "description": "Descrizione dettagliata e persuasiva",
            "price": "€XX"
          }
        ],
        "subtitle": "Sottotitolo specifico per ${businessName}"
      }
    }
  ],
  "design": {
    "primaryColor": "#HEX",
    "secondaryColor": "#HEX",
    "accentColor": "#HEX",
    "style": "modern",
    "businessPersonality": "Design professionale per ${businessType}",
    "dynamicCSS": ".website-container { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; } .hero-section { padding: 4rem 2rem; text-align: center; background: rgba(255,255,255,0.1); border-radius: 20px; margin: 2rem; backdrop-filter: blur(10px); } .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; padding: 2rem; } .service-card { background: rgba(255,255,255,0.95); padding: 2rem; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); transition: transform 0.3s ease; } .service-card:hover { transform: translateY(-5px); } @media (max-width: 768px) { .services-grid { grid-template-columns: 1fr; } }"
  }
}

REGOLE ASSOLUTE:
- NON usare "Prodotto Classico/Premium" o simili
- Ogni nome deve essere SPECIFICO e REALISTICO
- Usa la descrizione del business come ispirazione
- Sii creativo ma REALISTICO
- I prezzi devono essere appropriati per il settore
- IL CSS deve essere completo e production-ready`;
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
 * 🛟 FALLBACK INTELLIGENTE
 */
function generateIntelligentFallback(businessName, businessType, businessDescription, complexity) {
  console.log('🛟 [INTELLIGENT FALLBACK] Generating fallback for:', businessType);

  // Analizza descrizione per estrarre elementi specifici
  const description = businessDescription || '';
  const location = extractLocation(description);
  const services = extractServices(description, businessType);
  const products = extractProducts(description, businessType);

  const sectionCount = complexity >= 6 ? 5 : complexity >= 4 ? 4 : 3;

  return {
    businessProfile: {
      name: businessName,
      businessType: businessType,
      description: businessDescription,
      location: location,
      services: services,
      products: products
    },
    sections: generateSpecificSections(businessName, businessType, services, products, location, sectionCount),
    dynamicCSS: generateDynamicFallbackCSS(businessType, businessName)
  };
}

/**
 * 🎨 GENERA CSS DINAMICO PER FALLBACK
 */
function generateDynamicFallbackCSS(businessType, businessName) {
  console.log('🎨 [DYNAMIC FALLBACK CSS] Generating CSS for:', businessType);

  // Schema colori basato sul tipo di business
  const colorSchemes = {
    'florist': {
      primary: '#4CAF50',    // Verde natura
      secondary: '#FF9800',  // Arancione caldo
      accent: '#E91E63',     // Rosa fiori
      background: '#F8F9FA',
      text: '#2E3440'
    },
    'restaurant': {
      primary: '#FF5722',    // Rosso/arancione cibo
      secondary: '#795548',  // Marrone cibo
      accent: '#FFC107',     // Giallo appetitoso
      background: '#FAFAFA',
      text: '#212121'
    },
    'services': {
      primary: '#2196F3',    // Blu professionale
      secondary: '#00BCD4',  // Azzurro
      accent: '#9C27B0',     // Viola
      background: '#F5F5F5',
      text: '#424242'
    },
    'retail': {
      primary: '#3F51B5',    // Blu retail
      secondary: '#FF4081',  // Rosa retail
      accent: '#4CAF50',     // Verde successo
      background: '#FFFFFF',
      text: '#212121'
    }
  };

  const colors = colorSchemes[businessType] || colorSchemes['services'];

  return `
/* 🎨 CSS DINAMICO GENERATO PER FALLBACK - ${businessName} (${businessType}) */
:root {
  --primary-color: ${colors.primary};
  --secondary-color: ${colors.secondary};
  --accent-color: ${colors.accent};
  --background-color: ${colors.background};
  --text-color: ${colors.text};
  --shadow: 0 2px 10px rgba(0,0,0,0.1);
  --border-radius: 8px;
  --transition: all 0.3s ease;
}

/* Layout principale */
.business-website {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--background-color);
  min-height: 100vh;
}

/* Header professionale */
.business-header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  padding: 2rem 0;
  text-align: center;
  box-shadow: var(--shadow);
}

.business-header h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.business-header p {
  margin: 0.5rem 0 0 0;
  font-size: 1.2rem;
  opacity: 0.9;
}

/* Sezioni */
.business-section {
  padding: 3rem 0;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

.business-section h2 {
  color: var(--primary-color);
  font-size: 2rem;
  margin-bottom: 2rem;
  text-align: center;
  position: relative;
}

.business-section h2::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: var(--accent-color);
  border-radius: 2px;
}

/* Cards */
.service-card, .offer-card, .info-card {
  background: white;
  border-radius: var(--border-radius);
  padding: 2rem;
  margin: 1rem 0;
  box-shadow: var(--shadow);
  transition: var(--transition);
  border: 1px solid #e0e0e0;
}

.service-card:hover, .offer-card:hover, .info-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

/* Pulsanti */
.business-button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: var(--transition);
  text-decoration: none;
  display: inline-block;
}

.business-button:hover {
  background: var(--secondary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

/* Prezzi */
.price {
  color: var(--accent-color);
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0.5rem 0;
}

.price::before {
  content: '€';
  font-size: 1rem;
  margin-right: 2px;
}

/* Footer */
.business-footer {
  background: var(--text-color);
  color: white;
  text-align: center;
  padding: 2rem 0;
  margin-top: 3rem;
}

.business-footer p {
  margin: 0;
  opacity: 0.8;
}

/* Responsive */
@media (max-width: 768px) {
  .business-header h1 {
    font-size: 2rem;
  }

  .business-section {
    padding: 2rem 1rem;
  }

  .service-card, .offer-card, .info-card {
    padding: 1.5rem;
  }
}

/* Animazioni */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.business-section {
  animation: fadeInUp 0.6s ease-out;
}

/* Business-specific styling */
.business-${businessType} .business-header {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
}

.business-${businessType} .service-card {
  border-left: 4px solid var(--primary-color);
}

.business-${businessType} .offer-card {
  border-left: 4px solid var(--accent-color);
}

/* Special effects for ${businessType} */
.business-${businessType} .business-button {
  background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
}

.business-${businessType} .business-button:hover {
  background: linear-gradient(45deg, var(--secondary-color), var(--primary-color));
}
  `.trim();
}

/**
 * 📍 ESTRAI LOCATION DALLA DESCRIZIONE
 */
function extractLocation(description) {
  const locationPatterns = [
    /(?:a|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /zona\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /via\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
  ];

  for (const pattern of locationPatterns) {
    const match = description.match(pattern);
    if (match) return match[1];
  }
  return 'Centro Città';
}

/**
 * 🔧 ESTRAI SERVIZI DALLA DESCRIZIONE
 */
function extractServices(description, businessType) {
  const serviceKeywords = {
    'florist': ['consegna', 'composizioni', 'consulenza', 'manutenzione', 'decorazioni'],
    'restaurant': ['cucina', 'servizio', 'prenotazioni', 'catering', 'eventi'],
    'services': ['consulenza', 'assistenza', 'supporto', 'manutenzione']
  };

  const keywords = serviceKeywords[businessType] || serviceKeywords['services'];
  return keywords.filter(keyword =>
    description.toLowerCase().includes(keyword.toLowerCase())
  );
}

/**
 * 🛍️ ESTRAI PRODOTTI DALLA DESCRIZIONE
 */
function extractProducts(description, businessType) {
  const productKeywords = {
    'florist': ['fiori', 'rose', 'orchidee', 'piante', 'bouquet', 'composizioni'],
    'restaurant': ['piatti', 'menu', 'cucina', 'specialità', 'vini'],
    'retail': ['prodotti', 'articoli', 'servizi', 'offerte']
  };

  const keywords = productKeywords[businessType] || productKeywords['retail'];
  return keywords.filter(keyword =>
    description.toLowerCase().includes(keyword.toLowerCase())
  );
}

/**
 * 🎨 GENERA SEZIONI SPECIFICHE
 */
function generateSpecificSections(businessName, businessType, services, products, location, sectionCount) {
  const sections = [];

  // Sezione 1: Servizi Principali
  sections.push({
    type: 'serviziprincipali',
    title: 'Servizi Principali',
    content: {
      items: generateServiceItems(businessType, services, location),
      subtitle: `Servizi professionali di ${businessName}${location ? ` - ${location}` : ''}`
    }
  });

  // Sezione 2: Offerte Speciali
  if (sectionCount >= 2) {
    sections.push({
      type: 'offertespeciali',
      title: 'Offerte Speciali',
      content: {
        items: generateOfferItems(businessType, products),
        subtitle: `Promozioni speciali di ${businessName}`
      }
    });
  }

  // Sezione 3: Informazioni
  if (sectionCount >= 3) {
    sections.push({
      type: 'informazioni',
      title: 'Informazioni',
      content: {
        items: generateInfoItems(businessName, businessType, location),
        subtitle: `Scopri di più su ${businessName}`
      }
    });
  }

  // Sezione 4: Assistenza
  if (sectionCount >= 4) {
    sections.push({
      type: 'assistenza',
      title: 'Assistenza',
      content: {
        items: generateSupportItems(businessType, services),
        subtitle: `Supporto e assistenza di ${businessName}`
      }
    });
  }

  // Sezione 5: Contatti
  if (sectionCount >= 5) {
    sections.push({
      type: 'contatti',
      title: 'Contatti',
      content: {
        items: generateContactItems(location),
        subtitle: `Contatta ${businessName} per informazioni`,
        hasContacts: true
      }
    });
  }

  return sections;
}

/**
 * 🛠️ GENERA ITEMS SERVIZI SPECIFICI
 */
function generateServiceItems(businessType, services, location) {
  const templates = {
    'florist': [
      {
        name: `Consegna Fiori a Domicilio${location ? ` - ${location}` : ''}`,
        description: 'Servizio di consegna rapida e professionale direttamente a casa tua',
        price: '€8'
      },
      {
        name: 'Composizioni Floreali Personalizzate',
        description: 'Creazioni uniche su misura per ogni occasione speciale',
        price: '€45'
      },
      {
        name: 'Consulenza Floreale',
        description: 'Consigli esperti per scegliere i fiori perfetti per ogni momento',
        price: '€15'
      }
    ],
    'restaurant': [
      {
        name: 'Servizio di Catering',
        description: 'Servizio completo per eventi e cerimonie con menù personalizzati',
        price: '€25'
      },
      {
        name: 'Prenotazioni Online',
        description: 'Sistema di prenotazione digitale semplice e veloce',
        price: '€0'
      },
      {
        name: 'Menu Degustazione',
        description: 'Esperienza culinaria completa con i nostri piatti signature',
        price: '€65'
      }
    ]
  };

  return templates[businessType] || [
    {
      name: 'Servizio Personalizzato',
      description: 'Soluzione su misura per le tue specifiche esigenze',
      price: '€50'
    },
    {
      name: 'Consulenza Specializzata',
      description: 'Supporto esperto e consigli professionali',
      price: '€75'
    },
    {
      name: 'Assistenza Dedicata',
      description: 'Servizio di supporto completo e personalizzato',
      price: '€35'
    }
  ];
}

/**
 * 🎁 GENERA ITEMS OFFERTE SPECIFICHE
 */
function generateOfferItems(businessType, products) {
  const templates = {
    'florist': [
      {
        name: 'Bouquet di Rose Rosse -20%',
        description: 'Bouquet elegante di rose rosse fresche con sconto speciale',
        price: '€32'
      },
      {
        name: 'Orchidee Estive in Promozione',
        description: 'Orchidee colorate stagionali a prezzo ridotto',
        price: '€28'
      },
      {
        name: 'Composizione Mista Scontata',
        description: 'Miscela di fiori freschi con consegna gratuita',
        price: '€38'
      }
    ]
  };

  return templates[businessType] || [
    {
      name: 'Offerta Speciale 1',
      description: 'Promozione esclusiva con condizioni vantaggiose',
      price: '€25'
    },
    {
      name: 'Pacchetto Vantaggioso',
      description: 'Combinazione ottimale di prodotti e servizi',
      price: '€65'
    },
    {
      name: 'Offerta Limitata',
      description: 'Opportunità speciale valida per tempo limitato',
      price: '€45'
    }
  ];
}

/**
 * ℹ️ GENERA ITEMS INFORMAZIONI SPECIFICHE
 */
function generateInfoItems(businessName, businessType, location) {
  return [
    {
      name: 'Orari di Apertura',
      description: 'Lun-Ven 9:00-18:00, Sab 9:00-13:00, Dom chiuso',
      price: ''
    },
    {
      name: 'Location',
      description: `${location || 'Centro città'} - Facilmente raggiungibile con tutti i mezzi`,
      price: ''
    },
    {
      name: 'Servizi Offerti',
      description: `Specializzati in ${businessType} con attenzione ai dettagli e qualità`,
      price: ''
    }
  ];
}

/**
 * 🆘 GENERA ITEMS ASSISTENZA SPECIFICI
 */
function generateSupportItems(businessType, services) {
  const templates = {
    'florist': [
      {
        name: 'Consulenza Floreale Telefonica',
        description: 'Consigli esperti via telefono per scegliere i fiori migliori',
        price: '€10'
      },
      {
        name: 'Manutenzione Piante',
        description: 'Servizio di cura e manutenzione delle tue piante',
        price: '€20'
      },
      {
        name: 'Decorazione Eventi',
        description: 'Servizio completo di decorazione floreale per eventi',
        price: '€150'
      }
    ]
  };

  return templates[businessType] || [
    {
      name: 'Supporto Tecnico',
      description: 'Assistenza tecnica specializzata e risoluzione problemi',
      price: '€30'
    },
    {
      name: 'Consulenza Personalizzata',
      description: 'Consulenza dedicata per ottimizzare i tuoi risultati',
      price: '€60'
    },
    {
      name: 'Manutenzione Preventiva',
      description: 'Servizio di controllo e manutenzione regolare',
      price: '€40'
    }
  ];
}

/**
 * 📞 GENERA ITEMS CONTATTI SPECIFICI
 */
function generateContactItems(location) {
  return [
    {
      name: 'Telefono',
      description: '+39 06 12345678',
      price: ''
    },
    {
      name: 'Email',
      description: 'info@fioraioaroma.it',
      price: ''
    },
    {
      name: 'Indirizzo',
      description: `${location || 'Via Roma 123, Roma'} - Parcheggio disponibile`,
      price: ''
    }
  ];
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
    const result = await generateWebsiteWithClaude(businessName, businessType, businessDescription);

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

module.exports = router;
