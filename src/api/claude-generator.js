const express = require('express');
const router = express.Router();
const DatabaseStorage = require('../storage/database-storage');
const OpenAI = require('openai');

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
  try {
    console.log(`🎨 [Claude Generator] Starting website generation for: ${businessName}${businessDescription ? ' with custom description' : ''}`);
    
    // 1. Analizza pattern esistenti dal database
    const patterns = await analyzeBusinessPatterns(businessType);
    
    // 2. Rileva complessità business (considera anche la descrizione)
    const complexity = detectBusinessComplexity(businessName, businessType, patterns, businessDescription);
    
    // 3. Genera prompt intelligente con descrizione
    const intelligentPrompt = await generateIntelligentPrompt(businessName, businessType, businessDescription, patterns, complexity);
    
    // 4. Simula risposta Claude (in attesa di implementazione API Claude)
    // TODO: Sostituire con vera chiamata Claude API
    const claudeResponse = await simulateClaudeResponse(intelligentPrompt, businessName, businessType, businessDescription, complexity);
    
    console.log(`✅ [Claude Generator] Website generated successfully for ${businessName}${businessDescription ? ' (personalized)' : ''}`);
    
    return {
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
    
  } catch (error) {
    console.log(`❌ [Claude Generator] Error: ${error.message}`);
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
  // Questa è una simulazione - sarà sostituita con vera API Claude
  console.log(`🎭 [Claude Simulation] Simulating intelligent Claude response for: ${businessName} (${businessType})`);
  
  const sectionCount = complexity >= 6 ? 5 : complexity >= 4 ? 4 : 3;
  
  // 🧠 SISTEMA DINAMICO DI GENERAZIONE CONTENUTI
  const businessIntelligence = {
    'florist': {
      sections: ['Composizioni Stagionali', 'Bouquet Personalizzati', 'Servizi Matrimonio', 'Consegna a Domicilio', 'Contatti'],
      content: {
        'Composizioni Stagionali': [
          { name: 'Composizioni Primaverili', description: 'Tulipani, narcisi e giacinti freschi di stagione', price: '€35' },
          { name: 'Bouquet Estivi', description: 'Girasoli, margherite e fiori di campo colorati', price: '€28' },
          { name: 'Decorazioni Autunnali', description: 'Crisantemi, dalie e foglie dorate', price: '€42' }
        ],
        'Bouquet Personalizzati': [
          { name: 'Bouquet Romantico', description: 'Rose rosse e bianche con baby breath delicato', price: '€45' },
          { name: 'Composizione Moderna', description: 'Orchidee esotiche con verde decorativo', price: '€65' },
          { name: 'Mazzo Profumato', description: 'Peonie, lavanda e eucalipto', price: '€38' }
        ],
        'Servizi Matrimonio': [
          { name: 'Bouquet Sposa', description: 'Composizione unica su misura per il giorno speciale', price: '€120' },
          { name: 'Addobbi Chiesa', description: 'Decorazioni floreali complete per cerimonia', price: '€350' },
          { name: 'Centrotavola', description: 'Composizioni eleganti per ricevimento', price: '€45' }
        ]
      },
      colors: { primary: '#E91E63', secondary: '#4CAF50', accent: '#FF9800' }
    },
    
    'restaurant': {
      sections: ['Menu del Giorno', 'Specialità Chef', 'Eventi Privati', 'Prenotazioni', 'Location'],
      content: {
        'Menu del Giorno': [
          { name: 'Antipasti Misti', description: 'Selezione di salumi, formaggi e verdure stagionali', price: '€18' },
          { name: 'Pasta Fresca', description: 'Tagliatelle ai porcini con tartufo nero pregiato', price: '€24' },
          { name: 'Pesce del Giorno', description: 'Branzino in crosta di sale con verdure grigliate', price: '€32' }
        ],
        'Specialità Chef': [
          { name: 'Risotto ai Funghi', description: 'Carnaroli mantecato con parmigiano 24 mesi', price: '€22' },
          { name: 'Bistecca Fiorentina', description: 'Carne chianina da 800g cotta alla griglia', price: '€45' },
          { name: 'Tiramisù della Casa', description: 'Dolce tradizionale con mascarpone e caffè', price: '€8' }
        ],
        'Eventi Privati': [
          { name: 'Cena Romantica', description: 'Tavolo riservato con menu degustazione', price: '€80' },
          { name: 'Compleanno Famiglia', description: 'Sala privata fino a 20 persone', price: '€35' },
          { name: 'Business Lunch', description: 'Menu veloce per pranzi di lavoro', price: '€25' }
        ]
      },
      colors: { primary: '#F44336', secondary: '#FFC107', accent: '#8BC34A' }
    },
    
    'technology': {
      sections: ['Soluzioni Software', 'Piani Pricing', 'Case Studies', 'Supporto Tecnico', 'Contatti'],
      content: {
        'Soluzioni Software': [
          { name: 'CRM Avanzato', description: 'Gestione clienti con AI e automazioni integrate', price: '€99/mese' },
          { name: 'E-commerce Platform', description: 'Piattaforma completa per vendite online', price: '€149/mese' },
          { name: 'App Mobile', description: 'Applicazione nativa iOS e Android personalizzata', price: '€299/mese' }
        ],
        'Piani Pricing': [
          { name: 'Starter', description: 'Perfetto per piccole imprese e startup', price: '€29/mese' },
          { name: 'Professional', description: 'Funzioni avanzate per aziende in crescita', price: '€79/mese' },
          { name: 'Enterprise', description: 'Soluzione completa per grandi organizzazioni', price: '€199/mese' }
        ],
        'Case Studies': [
          { name: 'Retail Chain', description: 'Aumento vendite del 150% in 6 mesi', price: '' },
          { name: 'Startup FinTech', description: 'Riduzione costi operativi del 40%', price: '' },
          { name: 'Agenzia Marketing', description: 'Automazione workflow e produttività +200%', price: '' }
        ]
      },
      colors: { primary: '#2196F3', secondary: '#9C27B0', accent: '#00BCD4' }
    },
    
    'travel': {
      sections: ['Destinazioni Top', 'Pacchetti Viaggio', 'Servizi Premium', 'Assistenza', 'Contatti'],
      content: {
        'Destinazioni Top': [
          { name: 'Maldive Luxury', description: 'Resort 5 stelle con spa e diving center', price: '€2.500' },
          { name: 'Safari Kenya', description: 'Tour fotografico nella savana africana', price: '€1.800' },
          { name: 'Giappone Tradizionale', description: 'Cultura, templi e cucina giapponese autentica', price: '€2.200' }
        ],
        'Pacchetti Viaggio': [
          { name: 'Weekend Europa', description: 'Capitali europee con volo e hotel inclusi', price: '€350' },
          { name: 'Settimana Mare', description: 'Sicilia o Sardegna con pensione completa', price: '€890' },
          { name: 'Tour Culturale', description: 'Italia artistica con guide esperte', price: '€1.200' }
        ],
        'Servizi Premium': [
          { name: 'Consulenza Personalizzata', description: 'Itinerario su misura per ogni esigenza', price: '€100' },
          { name: 'Assistenza 24/7', description: 'Supporto completo durante tutto il viaggio', price: 'Incluso' },
          { name: 'Transfer Luxury', description: 'Auto di lusso e chauffeur privato', price: '€150/giorno' }
        ]
      },
      colors: { primary: '#009688', secondary: '#FF5722', accent: '#FFC107' }
    }
  };
  
  // 🎯 FALLBACK INTELLIGENTE per business types non definiti
  const createDynamicContent = (businessType, sectionName) => {
    const templates = {
      'services': [
        { 
          name: `Servizio ${sectionName} Base`, 
          description: `Soluzione professionale per ${businessType}`, 
          price: '€50',
          image: generateAIBasedImage(sectionName.toLowerCase(), businessType, `Servizio base per ${businessType}`)
        },
        { 
          name: `Servizio ${sectionName} Premium`, 
          description: `Opzione avanzata con supporto dedicato`, 
          price: '€100',
          image: generateAIBasedImage(sectionName.toLowerCase(), businessType, `Servizio premium per ${businessType}`)
        },
        { 
          name: `Pacchetto ${sectionName} Completo`, 
          description: `Soluzione all-inclusive per ogni esigenza`, 
          price: '€150',
          image: generateAIBasedImage(sectionName.toLowerCase(), businessType, `Pacchetto completo per ${businessType}`)
        }
      ],
      'retail': [
        { 
          name: `Prodotto ${sectionName} Classico`, 
          description: `Qualità garantita e prezzo conveniente`, 
          price: '€25',
          image: generateAIBasedImage(sectionName.toLowerCase(), businessType, `Prodotto classico per ${businessType}`)
        },
        { 
          name: `Prodotto ${sectionName} Premium`, 
          description: `Materiali di alta qualità e design curato`, 
          price: '€65',
          image: generateAIBasedImage(sectionName.toLowerCase(), businessType, `Prodotto premium per ${businessType}`)
        },
        { 
          name: `Edizione ${sectionName} Limitata`, 
          description: `Pezzo unico per veri intenditori`, 
          price: '€120',
          image: generateAIBasedImage(sectionName.toLowerCase(), businessType, `Edizione limitata per ${businessType}`)
        }
      ]
    };
    
    const category = businessType.includes('service') ? 'services' : 'retail';
    return templates[category] || templates['services'];
  };
  
  const intelligence = businessIntelligence[businessType];
  let selectedSections, colors, contentData;
  
  if (intelligence) {
    // Business type conosciuto - usa dati specifici
    selectedSections = intelligence.sections.slice(0, sectionCount);
    colors = intelligence.colors;
    contentData = intelligence.content;
  } else {
    // Business type sconosciuto - genera contenuti dinamici
    selectedSections = [
      'Servizi Principali', 'Offerte Speciali', 'Informazioni', 
      'Assistenza', 'Contatti'
    ].slice(0, sectionCount);
    
    colors = { primary: '#2196F3', secondary: '#4CAF50', accent: '#FF9800' };
    contentData = {};
    
    selectedSections.forEach(section => {
      contentData[section] = createDynamicContent(businessType, section);
    });
  }
  
  return {
    businessName,
    businessType,
    businessDescription: businessDescription || '',
    complexity,
    totalSections: selectedSections.length,
    sections: selectedSections.map((sectionName, index) => {
      const sectionContent = contentData[sectionName] || createDynamicContent(businessType, sectionName);
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
    }),
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
}

/**
 * 🚀 ROUTE PRINCIPALE CLAUDE GENERATOR
 */
router.post('/generate', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { businessName, businessType, businessDescription } = req.body;
    
    if (!businessName || !businessType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: businessName, businessType'
      });
    }
    
    console.log(`🚀 [Claude Route] Starting generation for: ${businessName} (${businessType})${businessDescription ? ' with description' : ''}`);
    
    // Genera sito con Claude Sonnet
    const result = await generateWebsiteWithClaude(businessName, businessType, businessDescription);
    
    const processingTime = Date.now() - startTime;
    
    res.json({
      ...result,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
      version: 'claude-v1.0'
    });
    
  } catch (error) {
    console.log(`❌ [Claude Route] Error: ${error.message}`);
    
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
