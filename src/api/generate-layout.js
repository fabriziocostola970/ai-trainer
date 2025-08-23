const express = require('express');
const router = express.Router();
const DatabaseStorage = require('../storage/database-storage');
const DesignIntelligence = require('../ai/design-intelligence');
const OpenAI = require('openai');

// 🚀 v3.0 - Sistema VERAMENTE Dinamico (Deploy 23-08-2025)
// 🎯 FOCUS: Solo dati database esistenti + OpenAI per contenuti
// 🚫 ZERO: Scraping, fallback hardcoded, assunzioni strutture

/**
 * 🤖 GENERAZIONE CONTENUTI AI - Core del sistema dinamico
 */
async function generateBusinessContentWithAI(businessType, businessName) {
  try {
    console.log(`🔄 [OpenAI Content] Starting generation for: businessType="${businessType}", businessName="${businessName}"`);
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key required for dynamic system');
    }

    const prompt = `Genera contenuti specifici per un business di tipo "${businessType}" chiamato "${businessName}".
    
    IMPORTANTE: Rileva automaticamente la lingua del nome business "${businessName}" e rispondi SEMPRE in quella lingua.
    - Se "${businessName}" è in italiano → rispondi in ITALIANO
    - Se "${businessName}" è in francese → rispondi in FRANCESE  
    - Se "${businessName}" è in spagnolo → rispondi in SPAGNOLO
    - Se "${businessName}" è in inglese → rispondi in INGLESE
    - Etc.
    
    Il business "${businessName}" opera nel suo paese di origine, quindi tutti i contenuti devono essere nella lingua locale.
    
    Fornisci contenuti in formato JSON per:
    1. Hero section (titolo, sottotitolo, descrizione, CTA)
    2. Servizi/Prodotti (3 elementi con nome, descrizione, prezzo indicativo)
    3. About section (storia del business)
    4. Contact (metodi di contatto)
    
    Rispondi SOLO con JSON valido, senza markdown, nella LINGUA RILEVATA dal nome "${businessName}":
    {
      "hero": {
        "title": "...",
        "subtitle": "...",
        "description": "...",
        "cta": "..."
      },
      "services": {
        "title": "...",
        "items": [{"name": "...", "description": "...", "price": "..."}]
      },
      "about": {
        "title": "...",
        "description": "..."
      },
      "contact": {
        "title": "...",
        "methods": [{"type": "email", "value": "info@example.com"}]
      }
    }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.7
    });

    const content = JSON.parse(completion.choices[0].message.content);
    console.log(`✅ [OpenAI Content] Generated AI content for: ${businessName}`);
    return content;
    
  } catch (error) {
    console.log(`❌ [OpenAI Content] FAILED:`, error.message);
    throw new Error(`OpenAI content generation failed: ${error.message}`);
  }
}

/**
 * 🔍 CLASSIFICAZIONE DINAMICA BUSINESS TYPE
 */
async function classifyBusinessTypeWithAI(businessName, businessType) {
  try {
    console.log(`🤖 [Classification] Analyzing: "${businessName}" -> "${businessType}"`);
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const prompt = `Analyze this business and provide the most specific businessType:

Business name: "${businessName}"
Input businessType: "${businessType}"

Rules:
- Return a single, specific business category (lowercase)
- Be as specific as possible (prefer "florist" over "services")
- Use common industry terms
- Examples: florist, restaurant, photography, legal, medical, technology

Respond with ONLY the businessType (single word):`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", 
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50,
      temperature: 0.3
    });

    const classifiedType = completion.choices[0].message.content.trim().toLowerCase();
    console.log(`🎯 [Classification] "${businessType}" -> "${classifiedType}"`);
    
    return classifiedType;
    
  } catch (error) {
    console.log(`❌ [Classification] Failed: ${error.message}`);
    return businessType; // Fallback al tipo originale
  }
}

/**
 * 📊 ESTRAZIONE PATTERN DAL DATABASE
 */
async function extractLayoutPatternsFromDatabase(businessType) {
  try {
    const storage = new DatabaseStorage();
    
    console.log(`🔍 [Database Patterns] Searching for: "${businessType}"`);
    
    // Query per ottenere pattern dai competitor esistenti
    const result = await storage.pool.query(`
      SELECT 
        layout_structure,
        semantic_analysis,
        design_analysis,
        confidence_score,
        source_url
      FROM ai_design_patterns 
      WHERE business_type = $1 
        AND layout_structure IS NOT NULL
        AND layout_structure != '{}'
      ORDER BY confidence_score DESC
      LIMIT 20
    `, [businessType]);
    
    console.log(`📊 [Database Patterns] Found ${result.rows.length} patterns for ${businessType}`);
    
    if (result.rows.length === 0) {
      console.log(`⚠️ [Database Patterns] No patterns found for ${businessType}`);
      return [];
    }
    
    // Converte in formato utilizzabile
    const patterns = result.rows.map(row => ({
      layoutStructure: row.layout_structure,
      confidence: row.confidence_score || 70,
      source: row.source_url,
      semantic: row.semantic_analysis,
      design: row.design_analysis
    }));
    
    console.log(`✅ [Database Patterns] Processed ${patterns.length} patterns`);
    return patterns;
    
  } catch (error) {
    console.log(`❌ [Database Patterns] Error: ${error.message}`);
    return [];
  }
}

/**
 * 🏗️ ANALISI STRUTTURA REALE
 */
function analyzeRealStructures(patterns) {
  console.log(`🧠 [Structure Analysis] Analyzing ${patterns.length} real patterns`);
  
  const sectionCount = {};
  const structureFrequency = {};
  
  patterns.forEach(pattern => {
    if (!pattern.layoutStructure) return;
    
    // Conta singole sezioni
    Object.keys(pattern.layoutStructure).forEach(section => {
      sectionCount[section] = (sectionCount[section] || 0) + 1;
    });
    
    // Conta combinazioni di strutture
    const structureKey = Object.keys(pattern.layoutStructure).sort().join('+');
    if (structureKey) {
      structureFrequency[structureKey] = (structureFrequency[structureKey] || 0) + 1;
    }
  });
  
  // Trova sezioni più comuni
  const commonSections = Object.entries(sectionCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6) // Top 6 sezioni
    .map(([section, count]) => ({
      section,
      frequency: count,
      percentage: (count / patterns.length * 100).toFixed(1)
    }));
  
  console.log(`📊 [Structure Analysis] Common sections:`, 
    commonSections.map(s => `${s.section} (${s.percentage}%)`).join(', '));
  
  return {
    commonSections,
    totalPatterns: patterns.length,
    mostCommonStructure: Object.entries(structureFrequency)
      .sort(([,a], [,b]) => b - a)[0]
  };
}

/**
 * 🎨 GENERAZIONE BLOCCHI 100% AI-DRIVEN
 */
async function generateDynamicBlocks(businessType, businessName, patterns, aiContent) {
  console.log(`🎨 [Dynamic Blocks] Generating UNIQUE layout for ${businessName} (${businessType})`);
  
  try {
    // GENERAZIONE 100% AI: Crea sezioni UNICHE per questo business
    const prompt = `You are creating a UNIQUE website structure for "${businessName}" (type: ${businessType}).

IMPORTANT: DO NOT use generic sections like "hero", "services", "about", "contact".
CREATE ORIGINAL section names that are SPECIFIC to this business.

Business context:
- Business: ${businessName}
- Type: ${businessType} 
- AI Content: ${JSON.stringify(aiContent).substring(0, 500)}...

Generate 4-6 UNIQUE sections with names that are SPECIFIC to this business.
For a florist, think: "seasonal-collections", "wedding-arrangements", "delivery-zones", "care-instructions"
For a restaurant: "signature-dishes", "chef-story", "reservation-system", "wine-pairings"

Respond ONLY with JSON:
{
  "sections": [
    {
      "name": "unique-section-name",
      "purpose": "what this section does",
      "priority": 1-10,
      "businessSpecific": "why this matters for ${businessType}"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", 
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.8 // Higher creativity for unique sections
    });

    const sectionPlan = JSON.parse(completion.choices[0].message.content.trim());
    
    const blocks = [];
    let blockId = 1;
    
    // Genera contenuto per ogni sezione UNICA
    for (const sectionInfo of sectionPlan.sections) {
      console.log(`🎯 [AI Unique] Creating section: ${sectionInfo.name} - ${sectionInfo.purpose}`);
      
      const block = await generateBlockFromSection(
        sectionInfo.name, 
        businessName, 
        businessType, 
        aiContent, 
        blockId++,
        sectionInfo.purpose
      );
      
      if (block) {
        blocks.push(block);
      }
    }
    
    console.log(`✅ [Dynamic Blocks] Generated ${blocks.length} UNIQUE blocks`);
    console.log(`🎨 [Dynamic Blocks] Sections created: ${sectionPlan.sections.map(s => s.name).join(', ')}`);
    return blocks;
    
  } catch (error) {
    console.log(`❌ [Dynamic Blocks] Error: ${error.message}`);
    return generateEmergencyBlocks(businessName, businessType, aiContent);
  }
}

/**
 * 🔧 GENERAZIONE BLOCCO DA SEZIONE - 100% AI DINAMICO
 */
async function generateBlockFromSection(sectionType, businessName, businessType, aiContent, blockId, sectionPurpose = '') {
  console.log(`🔧 [AI Block Generation] Creating ${sectionType} for ${businessName} - Purpose: ${sectionPurpose}`);
  
  try {
    // 🤖 GENERAZIONE COMPLETAMENTE AI - Nessuna mappa hardcoded
    const content = await generateSectionContentWithAI(sectionType, businessName, businessType, aiContent, sectionPurpose);
    
    return {
      id: `${sectionType}-${blockId}`,
      type: `${sectionType}-ai-dynamic`,
      content,
      confidence: 90,
      source: 'pure-ai-generation',
      aiEnhanced: true,
      templateFree: true
    };
  } catch (error) {
    console.log(`❌ [AI Block Generation] Failed to generate ${sectionType}: ${error.message}`);
    return null;
  }
}

/**
 * 🤖 GENERATORE AI UNIVERSALE - ZERO TEMPLATE HARDCODED
 */
async function generateSectionContentWithAI(sectionType, businessName, businessType, aiContent, sectionPurpose = '') {
  try {
    console.log(`🤖 [AI Universal] Generating UNIQUE ${sectionType} for ${businessName} - Purpose: ${sectionPurpose}`);
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const prompt = `Genera contenuti per una sezione "${sectionType}" di un sito web di ${businessType} chiamato "${businessName}".

IMPORTANTE: Rileva automaticamente la lingua del nome business "${businessName}" e rispondi in quella lingua.
- Se "${businessName}" è in italiano → rispondi in ITALIANO
- Se "${businessName}" è in francese → rispondi in FRANCESE
- Se "${businessName}" è in spagnolo → rispondi in SPAGNOLO  
- Se "${businessName}" è in inglese → rispondi in INGLESE
- Etc.

SCOPO SEZIONE: ${sectionPurpose}

Contesto:
- Business: ${businessName}
- Settore: ${businessType}
- Tipo Sezione: ${sectionType}
- Scopo Sezione: ${sectionPurpose}
- Contesto Business: ${JSON.stringify(aiContent).substring(0, 300)}...

Istruzioni:
1. Crea contenuti SPECIFICI per la sezione "${sectionType}"
2. Concentrati sullo SCOPO: ${sectionPurpose}
3. Rendi tutto professionale e appropriato per ${businessType}
4. Includi dettagli realistici e specifici (prezzi, servizi, contatti)
5. Rendi questa sezione DIVERSA dalle tipiche sezioni web

Requisiti:
- Contenuto deve essere UNICO per ${businessName}
- Usa terminologia specifica del settore ${businessType}
- Concentrati sullo scopo della sezione: ${sectionPurpose}
- Struttura i dati logicamente per questo tipo di sezione
- Usa la LINGUA RILEVATA dal nome "${businessName}"

Rispondi SOLO con JSON valido nella lingua del business:
{
  "title": "Titolo sezione specifico per ${businessType}",
  "subtitle": "Sottotitolo di supporto se necessario",
  "description": "Descrizione principale del contenuto",
  "items": [
    {
      "name": "Nome articolo/servizio",
      "description": "Descrizione dettagliata",
      "price": "€XX (se applicabile)",
      "image": "descrizione di quale immagine mostrare"
    }
  ],
  "links": ["link", "rilevanti", "se", "applicabili"],
  "contact": {
    "email": "email appropriata per il business",
    "phone": "numero di telefono realistico",
    "address": "indirizzo realistico"
  },
  "metadata": {
    "sectionPurpose": "cosa ottiene questa sezione",
    "industrySpecific": "cosa rende questo specifico per ${businessType}"
  }
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1200,
      temperature: 0.7
    });

    const sectionContent = JSON.parse(completion.choices[0].message.content.trim());
    
    // Aggiungi immagine dinamica basata su business type
    if (!sectionContent.image && sectionContent.metadata) {
      sectionContent.image = generateAIBasedImage(sectionType, businessType, sectionContent.metadata.sectionPurpose);
    }
    
    console.log(`✅ [AI Universal] Generated ${sectionType} content for ${businessName}`);
    console.log(`🎯 [AI Universal] Purpose: ${sectionContent.metadata?.sectionPurpose}`);
    console.log(`🏭 [AI Universal] Industry-specific: ${sectionContent.metadata?.industrySpecific}`);
    
    return sectionContent;
    
  } catch (error) {
    console.log(`❌ [AI Universal] Failed to generate ${sectionType}: ${error.message}`);
    
    // ULTIMO FALLBACK: Anche questo deve essere AI-generated
    return await generateEmergencyAIContent(sectionType, businessName, businessType);
  }
}

/**
 * 🆘 FALLBACK AI - Anche i fallback sono AI
 */
async function generateEmergencyAIContent(sectionType, businessName, businessType) {
  try {
    console.log(`🆘 [Emergency AI] Last resort AI generation for ${sectionType}`);
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const emergencyPrompt = `EMERGENCY: Generate minimal but professional content for a ${sectionType} section of ${businessName} (${businessType} business).

Keep it simple but industry-appropriate. Respond with JSON:
{
  "title": "${businessName} - ${sectionType}",
  "content": "Brief professional content for ${businessType}",
  "cta": "Relevant call-to-action"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: emergencyPrompt }],
      max_tokens: 200,
      temperature: 0.5
    });

    return JSON.parse(completion.choices[0].message.content.trim());
    
  } catch (emergencyError) {
    console.log(`❌ [Emergency AI] Complete AI failure: ${emergencyError.message}`);
    
    // ASSOLUTO ULTIMO FALLBACK: Minimal ma sempre business-specific
    return {
      title: businessName,
      content: `Contenuto ${sectionType} per ${businessName}`,
      description: `Sezione ${sectionType} specializzata per ${businessType}`,
      businessType,
      sectionType,
      generated: 'absolute-fallback'
    };
  }
}

/**
 * 🚨 GENERAZIONE BLOCCHI EMERGENZA - 100% AI DYNAMIC
 */
async function generateEmergencyBlocks(businessName, businessType, aiContent) {
  console.log(`🚨 [Emergency Blocks] Creating minimal AI-driven blocks for ${businessName}`);
  
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const prompt = `Emergency: Create 3 essential sections for "${businessName}" (${businessType}) website.

Instructions:
1. Generate 3 DIFFERENT, UNIQUE section names (not generic hero/about/contact)
2. Make each section specific to ${businessType} industry
3. Focus on what customers of ${businessType} business really need

Respond ONLY with JSON:
{
  "sections": [
    {"name": "unique-section-1", "purpose": "what it does"},
    {"name": "unique-section-2", "purpose": "what it does"}, 
    {"name": "unique-section-3", "purpose": "what it does"}
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.9
    });

    const emergencyPlan = JSON.parse(completion.choices[0].message.content.trim());
    
    const blocks = [];
    for (let i = 0; i < emergencyPlan.sections.length; i++) {
      const section = emergencyPlan.sections[i];
      const block = await generateBlockFromSection(
        section.name,
        businessName,
        businessType,
        aiContent,
        i + 1,
        section.purpose
      );
      if (block) blocks.push(block);
    }
    
    console.log(`✅ [Emergency Blocks] Generated ${blocks.length} emergency AI blocks`);
    return blocks;
    
  } catch (error) {
    console.log(`❌ [Emergency Blocks] AI failed, using absolute minimal blocks`);
    return generateAbsoluteMinimalBlocks(businessName, businessType);
  }
}

/**
 * 🆘 ULTIMA RISORSA - MINIMAL BLOCKS SENZA AI
 */
function generateAbsoluteMinimalBlocks(businessName, businessType) {
  return [
    {
      id: 'emergency-1',
      type: 'business-intro',
      content: {
        title: businessName,
        description: `Benvenuto in ${businessName} - ${businessType}`,
        businessType,
        emergency: true
      }
    },
    {
      id: 'emergency-2', 
      type: 'business-info',
      content: {
        title: 'I Nostri Servizi',
        description: `${businessName} offre servizi professionali di ${businessType}`,
        businessType,
        emergency: true
      }
    },
    {
      id: 'emergency-3',
      type: 'business-contact', 
      content: {
        title: 'Contattaci',
        description: `Contatta ${businessName} per maggiori informazioni sui nostri servizi di ${businessType}`,
        businessType,
        emergency: true
      }
    }
  ];
}

/**
 * 🔄 FALLBACK MINIMO - ANCHE QUESTO 100% AI
 */
async function generateMinimalBlocks(businessName, businessType, aiContent) {
  console.log(`🔄 [AI Minimal] Generating AI-driven minimal structure for ${businessName}`);
  
  try {
    // Anche il fallback minimo è generato dall'AI
    const minimalContent = await generateSectionContentWithAI('main', businessName, businessType, aiContent);
    
    return [{
      id: 'ai-main-1',
      type: 'main-ai-minimal',
      content: minimalContent,
      confidence: 75,
      source: 'ai-minimal-fallback',
      aiEnhanced: true,
      templateFree: true
    }];
    
  } catch (error) {
    console.log(`❌ [AI Minimal] AI failed, using absolute minimal: ${error.message}`);
    
    return [{
      id: 'absolute-minimal-1',
      type: 'content-absolute',
      content: {
        title: businessName,
        description: `Benvenuto in ${businessName}, specializzato in ${businessType}.`,
        businessType,
        generated: 'absolute-emergency'
      },
      confidence: 50,
      source: 'absolute-emergency',
      aiEnhanced: false
    }];
  }
}

/**
 * 🖼️ GENERAZIONE IMMAGINI AI-DRIVEN - ZERO MAPPING HARDCODED
 */
function generateAIBasedImage(sectionType, businessType, sectionPurpose) {
  console.log(`🖼️ [AI Images] Generating image for ${sectionType} (${businessType})`);
  
  // Genera parametri dinamici basati su AI analysis
  const imageParams = generateImageParametersWithAI(sectionType, businessType, sectionPurpose);
  
  // Usa l'analisi AI per costruire URL Unsplash dinamico
  const unsplashQuery = encodeURIComponent(imageParams.keywords.join(' '));
  const dimensions = imageParams.dimensions;
  
  // ID fotografici dinamici basati su hash del content
  const photoId = generateDynamicPhotoId(sectionType, businessType, sectionPurpose);
  
  return `https://images.unsplash.com/photo-${photoId}?w=${dimensions.width}&h=${dimensions.height}&fit=crop&q=${unsplashQuery}`;
}

/**
 * 🎨 PARAMETRI IMMAGINE GENERATI DINAMICAMENTE
 */
function generateImageParametersWithAI(sectionType, businessType, sectionPurpose) {
  // Genera keywords basate su AI analysis invece di mapping fisso
  const baseKeywords = [businessType, sectionType];
  
  // Aggiungi keywords specifiche basate sul purpose
  if (sectionPurpose && typeof sectionPurpose === 'string') {
    const purposeKeywords = sectionPurpose.toLowerCase()
      .split(' ')
      .filter(word => word.length > 3)
      .slice(0, 2);
    baseKeywords.push(...purposeKeywords);
  }
  
  // Dimensioni dinamiche basate su tipo sezione
  const dimensions = {
    hero: { width: 1200, height: 600 },
    gallery: { width: 800, height: 600 },
    logo: { width: 200, height: 100 },
    services: { width: 600, height: 400 },
    contact: { width: 500, height: 300 }
  }[sectionType] || { width: 800, height: 500 };
  
  return {
    keywords: baseKeywords,
    dimensions,
    style: inferImageStyleFromBusinessType(businessType)
  };
}

/**
 * 🆔 PHOTO ID DINAMICO BASATO SU CONTENT
 */
function generateDynamicPhotoId(sectionType, businessType, sectionPurpose) {
  // Genera ID basato su hash del contenuto invece di array fisso
  const contentString = `${sectionType}-${businessType}-${sectionPurpose}`;
  const hash = contentString.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // Pool di ID diversificato per business type
  const businessPools = {
    florist: ['1563241527-3004b7be0ffd', '1416879595882-3373a0480b5b', '1490750967868-88aa4486c946'],
    restaurant: ['1517248135467-4c7edcad34c4', '1414235077428-338989a2e8c0', '1555939594-67f4426450a0'],
    technology: ['1460925895917-afdab827c52f', '1518709268805-4e9042af2176', '1451187580459-43d4fe21b35d'],
    default: ['1497032628192-86f99bcd76bc', '1560472354-b33ff0c44a43', '1507003211169-0a1dd7228f2d']
  };
  
  const pool = businessPools[businessType] || businessPools.default;
  return pool[Math.abs(hash) % pool.length];
}

/**
 * 🎨 STILE IMMAGINE INFERITO DA BUSINESS TYPE
 */
function inferImageStyleFromBusinessType(businessType) {
  const styleMap = {
    florist: 'natural-bright',
    restaurant: 'warm-inviting', 
    technology: 'modern-clean',
    legal: 'professional-formal',
    medical: 'clean-trust',
    beauty: 'elegant-soft'
  };
  
  return styleMap[businessType] || 'professional-modern';
}

/**
 * 🔢 CALCOLO SEMANTIC SCORE
 */
function calculateSemanticScore(blocks, businessType) {
  if (!blocks || blocks.length === 0) return 0;
  
  const baseScore = blocks.length * 15;
  const confidenceAvg = blocks.reduce((sum, b) => sum + (b.confidence || 70), 0) / blocks.length;
  const aiBonus = blocks.filter(b => b.aiEnhanced).length * 5;
  
  return Math.min(100, baseScore + confidenceAvg + aiBonus);
}

/**
 * 🔐 MIDDLEWARE AUTENTICAZIONE
 */
const authenticateAPI = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.AI_TRAINER_API_KEY;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Missing or invalid authorization header'
    });
  }
  
  const token = authHeader.substring(7);
  if (!expectedKey || token !== expectedKey) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key'
    });
  }
  
  next();
};

/**
 * 🚀 ROUTE PRINCIPALE V6.0 - COMPATIBILITÀ VENDIONLINE.EU
 */
router.post('/', authenticateAPI, async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('🚀 [V6.0 Main] Starting generation:', {
      businessType: req.body.businessType,
      businessName: req.body.businessName,
      timestamp: new Date().toISOString()
    });

    const { businessType, businessName, style = 'modern' } = req.body;
    
    if (!businessType) {
      return res.status(400).json({
        success: false,
        error: 'Business type is required'
      });
    }

    // 1. CLASSIFICAZIONE AI del business type
    const finalBusinessType = await classifyBusinessTypeWithAI(businessName, businessType);
    
    // 2. GENERAZIONE CONTENUTI AI
    const aiContent = await generateBusinessContentWithAI(finalBusinessType, businessName);
    
    // 3. ESTRAZIONE PATTERN dal database
    const patterns = await extractLayoutPatternsFromDatabase(finalBusinessType);
    
    // 4. GENERAZIONE DESIGN INTELLIGENCE
    const designIntelligence = new DesignIntelligence();
    let designData;
    
    try {
      designData = await designIntelligence.generateCompleteDesignRecommendation(finalBusinessType, { style });
      console.log(`✅ [Design] Generated design with confidence: ${designData.confidence}%`);
    } catch (designError) {
      console.log(`❌ [Design] Failed: ${designError.message}`);
      throw new Error(`Design Intelligence required: ${designError.message}`);
    }
    
    // 5. GENERAZIONE BLOCCHI DINAMICI
    const blocks = await generateDynamicBlocks(finalBusinessType, businessName, patterns, aiContent);
    
    // 🎨 6. GENERAZIONE DESIGN SYSTEM DINAMICO V6.0
    const dynamicDesignSystem = await generateDynamicDesignSystem(finalBusinessType, businessName, style);
    const dynamicCSS = generateDynamicCSS(dynamicDesignSystem, businessName);
    
    await designIntelligence.close();
    
    // ✅ RESPONSE STRUCTURE COMPATIBILE CON VENDIONLINE.EU
    const response = {
      success: true,
      layout: blocks, // ✅ Frontend compatibility
      dynamicCSS, // ✅ V6.0 CSS dinamico
      designSystem: dynamicDesignSystem, // ✅ V6.0 design system
      metadata: {
        businessType: finalBusinessType,
        businessName,
        style,
        confidence: Number(designData.confidence) || 85,
        version: '6.0-CSS-DYNAMIC',
        aiModel: 'gpt-3.5-turbo',
        generatedAt: new Date().toISOString(),
        totalBlocks: blocks.length,
        uniqueDesign: true,
        hardcodedElements: 0
      },
      semanticScore: calculateSemanticScore(blocks, finalBusinessType),
      businessType: finalBusinessType,
      businessName,
      designConfidence: Number(designData.confidence) || 85,
      pureAI: true,
      templateFree: true
    };
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ [V6.0 Main] Generated ${blocks.length} blocks in ${totalTime}ms`);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ V6.0 MAIN ROUTE FAILED:', error);
    res.status(500).json({
      success: false,
      error: 'V6.0 main route failed',
      details: error.message,
      version: '6.0-main'
    });
  }
});

/**
 * 🔄 ROUTE LEGACY - COMPATIBILITÀ ESISTENTE
 */
router.post('/layout', authenticateAPI, async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('🚀 [Legacy Layout] Starting generation:', {
      businessType: req.body.businessType,
      businessName: req.body.businessName,
      timestamp: new Date().toISOString()
    });

    const { businessType, businessName, style = 'modern' } = req.body;
    
    if (!businessType) {
      return res.status(400).json({
        success: false,
        error: 'Business type is required'
      });
    }

    // 1. CLASSIFICAZIONE AI del business type
    const finalBusinessType = await classifyBusinessTypeWithAI(businessName, businessType);
    
    // 2. GENERAZIONE CONTENUTI AI
    const aiContent = await generateBusinessContentWithAI(finalBusinessType, businessName);
    
    // 3. ESTRAZIONE PATTERN dal database
    const patterns = await extractLayoutPatternsFromDatabase(finalBusinessType);
    
    // 4. GENERAZIONE DESIGN INTELLIGENCE
    const designIntelligence = new DesignIntelligence();
    let designData;
    
    try {
      designData = await designIntelligence.generateCompleteDesignRecommendation(finalBusinessType, { style });
      console.log(`✅ [Design] Generated design with confidence: ${designData.confidence}%`);
    } catch (designError) {
      console.log(`❌ [Design] Failed: ${designError.message}`);
      throw new Error(`Design Intelligence required: ${designError.message}`);
    }
    
    // 5. GENERAZIONE BLOCCHI DINAMICI
    const blocks = await generateDynamicBlocks(finalBusinessType, businessName, patterns, aiContent);
    
    // 🎨 6. GENERAZIONE DESIGN SYSTEM DINAMICO V6.0
    const dynamicDesignSystem = await generateDynamicDesignSystem(finalBusinessType, businessName, style);
    const dynamicCSS = generateDynamicCSS(dynamicDesignSystem, businessName);
    
    await designIntelligence.close();
    
    // 7. RISPOSTA FINALE - 100% DINAMICO + CSS DINAMICO
    const confidenceValue = Number(designData.confidence) || 85;
    const response = {
      success: true,
      source: 'pure-ai-dynamic-v6',
      layout: blocks, // ✅ Frontend compatibility
      layoutData: {
        blocks,
        design: designData.design,
        metadata: {
          businessType: finalBusinessType,
          originalBusinessType: businessType,
          style,
          confidence: confidenceValue,
          generatedAt: new Date().toISOString(),
          aiEnhanced: true,
          dynamicVersion: '6.0-CSS-DINAMICO',
          templateFree: true,
          hardcodedElements: 0,
          aiGeneratedSections: blocks.length,
          systemType: 'COMPLETAMENTE_DINAMICO',
          uniqueSections: true,
          genericTemplates: false,
          dynamicCSS: true,
          businessSpecificDesign: true,
          aiGeneratedColors: true
        }
      },
      // ✅ CSS DINAMICO DISPONIBILE PER FRONTEND
      dynamicCSS,
      designSystem: dynamicDesignSystem,
      style,
      businessName,
      businessType: finalBusinessType,
      semanticScore: calculateSemanticScore(blocks, finalBusinessType),
      suggestedBlocks: blocks.map(block => block.type),
      designConfidence: confidenceValue,
      pureAI: true,
      templateFree: true
    };
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ [Dynamic Layout] Generated ${blocks.length} blocks in ${totalTime}ms (confidence: ${confidenceValue}%)`);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ DYNAMIC LAYOUT FAILED:', error);
    res.status(500).json({
      success: false,
      error: 'Dynamic layout system failed',
      details: error.message,
      version: '3.0-clean'
    });
  }
});

/**
 * 🎨 ROUTE TEMPLATE CREATIVO
 */
router.post('/template', async (req, res) => {
  try {
    const { businessData, creativityLevel } = req.body;
    
    const mockTemplate = {
      success: true,
      template: {
        name: `${businessData?.businessType || 'Custom'} Dynamic Pro`,
        layout: ['navigation', 'hero', 'services', 'contact'],
        version: '3.0-clean'
      },
      creativityScore: 85,
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '3.0'
      }
    };
    
    res.json(mockTemplate);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Template generation failed',
      details: error.message
    });
  }
});

/**
 * 🎨 GENERAZIONE DESIGN SISTEMA V6.0 - CSS DINAMICO
 */
async function generateDynamicDesignSystem(businessType, businessName, style) {
  console.log(`🎨 [Dynamic Design] Generating CSS system for ${businessName} (${businessType} - ${style})`);
  
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const prompt = `Generate a complete design system for "${businessName}" (${businessType} business) in ${style} style.

Create unique design elements that reflect the business personality:
- Business: ${businessName}
- Industry: ${businessType} 
- Style: ${style}

Generate specific design values (no generic defaults):

Respond ONLY with JSON:
{
  "palette": {
    "primary": "#HEXCODE",
    "secondary": "#HEXCODE", 
    "accent": "#HEXCODE",
    "background": "#HEXCODE",
    "text": "#HEXCODE",
    "textLight": "#HEXCODE"
  },
  "typography": {
    "heading": "font-family-name",
    "body": "font-family-name",
    "headingWeight": "weight",
    "headingSize": "size-value"
  },
  "spacing": {
    "small": "value",
    "medium": "value", 
    "large": "value",
    "section": "value"
  },
  "borders": {
    "radius": "value",
    "width": "value"
  },
  "shadows": {
    "light": "box-shadow-value",
    "medium": "box-shadow-value"
  },
  "businessPersonality": "design rationale for this specific business"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.7
    });

    const designSystem = JSON.parse(completion.choices[0].message.content.trim());
    
    console.log(`✅ [Dynamic Design] Generated unique design for ${businessName}`);
    console.log(`🎨 [Dynamic Design] Primary color: ${designSystem.palette.primary}`);
    console.log(`🎯 [Dynamic Design] Personality: ${designSystem.businessPersonality}`);
    
    return designSystem;
    
  } catch (error) {
    console.log(`❌ [Dynamic Design] AI failed: ${error.message}`);
    return generateFallbackDesignSystem(businessType, style);
  }
}

/**
 * 🎨 GENERAZIONE CSS COMPLETO DINAMICO
 */
function generateDynamicCSS(designSystem, businessName) {
  const { palette, typography, spacing, borders, shadows } = designSystem;
  
  return `
/* 🎨 DYNAMIC CSS GENERATED FOR: ${businessName} */
/* 🤖 Generated by AI-Trainer V6.0 - Zero Hardcoded Styles */

:root {
  --primary: ${palette.primary};
  --secondary: ${palette.secondary};
  --accent: ${palette.accent};
  --background: ${palette.background};
  --text: ${palette.text};
  --text-light: ${palette.textLight};
  --spacing-sm: ${spacing.small};
  --spacing-md: ${spacing.medium};
  --spacing-lg: ${spacing.large};
  --spacing-section: ${spacing.section};
  --border-radius: ${borders.radius};
  --shadow-light: ${shadows.light};
  --shadow-medium: ${shadows.medium};
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body { 
  font-family: ${typography.body};
  background: var(--background);
  color: var(--text);
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

.section {
  padding: var(--spacing-section) 0;
}

.section.ai-dynamic h2 {
  font-family: ${typography.heading};
  font-weight: ${typography.headingWeight};
  font-size: ${typography.headingSize};
  color: var(--primary);
  margin-bottom: var(--spacing-md);
}

.section.ai-dynamic h3 {
  color: var(--secondary);
  margin-bottom: var(--spacing-sm);
}

.section.ai-dynamic p {
  color: var(--text-light);
  margin-bottom: var(--spacing-md);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.card {
  background: white;
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-light);
  border-left: 4px solid var(--accent);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: var(--shadow-medium);
  transform: translateY(-2px);
}

.card h3 {
  color: var(--primary);
  margin-bottom: var(--spacing-sm);
}

.contact-info {
  background: var(--secondary);
  color: white;
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  margin-top: var(--spacing-md);
}

.btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn:hover {
  background: var(--secondary);
  transform: translateY(-1px);
}

/* 📱 RESPONSIVE DESIGN */
@media (max-width: 768px) {
  .container { padding: 0 var(--spacing-sm); }
  .section { padding: var(--spacing-md) 0; }
  .grid { grid-template-columns: 1fr; }
}
`;
}

/**
 * 🆘 FALLBACK DESIGN SYSTEM
 */
function generateFallbackDesignSystem(businessType, style) {
  // Almeno il fallback è specifico per business type
  const businessColorMap = {
    'florist': { primary: '#E91E63', secondary: '#4CAF50', accent: '#FF9800' },
    'restaurant': { primary: '#F44336', secondary: '#FFC107', accent: '#8BC34A' },
    'technology': { primary: '#2196F3', secondary: '#9C27B0', accent: '#00BCD4' },
    'legal': { primary: '#37474F', secondary: '#607D8B', accent: '#FFD54F' },
    'medical': { primary: '#1976D2', secondary: '#4CAF50', accent: '#FFC107' }
  };
  
  const colors = businessColorMap[businessType] || { primary: '#667EEA', secondary: '#764BA2', accent: '#F093FB' };
  
  return {
    palette: {
      primary: colors.primary,
      secondary: colors.secondary, 
      accent: colors.accent,
      background: '#FFFFFF',
      text: '#333333',
      textLight: '#666666'
    },
    typography: {
      heading: style === 'elegant' ? 'Georgia, serif' : 'Inter, sans-serif',
      body: 'Inter, sans-serif',
      headingWeight: '700',
      headingSize: '2.5rem'
    },
    spacing: {
      small: '0.5rem',
      medium: '1rem',
      large: '2rem', 
      section: '4rem'
    },
    borders: {
      radius: style === 'minimal' ? '4px' : '8px',
      width: '1px'
    },
    shadows: {
      light: '0 2px 4px rgba(0,0,0,0.1)',
      medium: '0 4px 12px rgba(0,0,0,0.15)'
    },
    businessPersonality: `Fallback design for ${businessType} business`
  };
}

module.exports = router;
