const express = require('express');
const router = express.Router();
const DatabaseStorage = require('../storage/database-storage');

// 🤖 CLAUDE SONNET WEBSITE GENERATOR - Sistema Parallelo V1.0
// 🎯 FOCUS: Generazione siti intelligente basata su pattern database esistenti
// 🚫 NON TOCCA: Sistema AI-Trainer esistente, mantiene compatibilità totale

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
        "layoutPatterns",
        "cssThemes", 
        "qualityScore",
        "semanticAnalysis",
        "designAnalysis"
      FROM ai_design_patterns 
      WHERE "businessType" = $1 
        AND "qualityScore" > 7.0
      ORDER BY "qualityScore" DESC
      LIMIT 10
    `, [businessType]);
    
    if (result.rows.length === 0) {
      console.log(`📊 [Claude Pattern Analysis] No patterns found for ${businessType}, using general patterns`);
      return null;
    }
    
    // Analizza pattern di successo
    const patterns = result.rows.map(row => ({
      layout: row.layoutPatterns,
      themes: row.cssThemes,
      quality: row.qualityScore,
      semantic: row.semanticAnalysis,
      design: row.designAnalysis
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
  
  // Genera prompt specifico per business type
  const businessSpecificGuidance = {
    'florist': 'Focus on seasonal arrangements, custom bouquets, wedding services, and delivery information',
    'restaurant': 'Emphasize menu highlights, chef specialties, reservation system, and location/ambiance',
    'technology': 'Highlight product features, pricing tiers, case studies, and technical support',
    'legal': 'Showcase practice areas, attorney profiles, case results, and consultation booking',
    'medical': 'Present services, doctor credentials, patient testimonials, and appointment scheduling',
    'retail': 'Feature product categories, promotions, customer reviews, and store locations'
  };
  
  const guidance = businessSpecificGuidance[businessType] || 
    `Focus on core services, unique value proposition, customer benefits, and contact information`;

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
async function simulateClaudeResponse(prompt, businessName, businessType, complexity) {
  // Questa è una simulazione - sarà sostituita con vera API Claude
  console.log(`🎭 [Claude Simulation] Simulating Claude response for: ${businessName}`);
  
  const sectionCount = complexity >= 6 ? 5 : complexity >= 4 ? 4 : 3;
  
  // Template basato su business type e complexity
  const businessTemplates = {
    'florist': {
      sections: ['Seasonal Arrangements', 'Custom Bouquets', 'Wedding Services', 'Delivery Info', 'Contact'],
      colors: { primary: '#E91E63', secondary: '#4CAF50', accent: '#FF9800' }
    },
    'restaurant': {
      sections: ['Menu Highlights', 'Chef Specials', 'Private Events', 'Reservations', 'Location'],
      colors: { primary: '#F44336', secondary: '#FFC107', accent: '#8BC34A' }
    },
    'technology': {
      sections: ['Product Features', 'Pricing Plans', 'Case Studies', 'API Docs', 'Support'],
      colors: { primary: '#2196F3', secondary: '#9C27B0', accent: '#00BCD4' }
    }
  };
  
  const template = businessTemplates[businessType] || businessTemplates['florist'];
  const selectedSections = template.sections.slice(0, sectionCount);
  
  return {
    businessName,
    businessType,
    complexity,
    totalSections: selectedSections.length,
    sections: selectedSections.map((sectionName, index) => ({
      id: `${sectionName.toLowerCase().replace(/\s+/g, '-')}-${index + 1}`,
      type: `${sectionName.replace(/\s+/g, '')}-ai-dynamic`,
      title: sectionName,
      description: `Professional ${sectionName.toLowerCase()} for ${businessName}`,
      items: Array.from({length: 3}, (_, i) => ({
        name: `${sectionName} Item ${i + 1}`,
        description: `High quality ${sectionName.toLowerCase()} service`,
        price: index < selectedSections.length - 1 ? `€${(i + 1) * 25}` : ''
      })),
      hasContacts: index === selectedSections.length - 1 // Solo ultima sezione
    })),
    design: {
      primaryColor: template.colors.primary,
      secondaryColor: template.colors.secondary,
      accentColor: template.colors.accent,
      style: complexity >= 7 ? 'luxury' : complexity >= 5 ? 'modern' : 'clean',
      businessPersonality: `Professional ${businessType} design with ${complexity >= 6 ? 'sophisticated' : 'clean'} aesthetic`
    },
    metadata: {
      generatedBy: 'claude-sonnet-simulation',
      basedOnPatterns: 0,
      patternQuality: 'simulated',
      sections: selectedSections.length
    }
  };
}

/**
 * 🚀 ROUTE PRINCIPALE CLAUDE GENERATOR
 */
router.post('/generate', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { businessName, businessType } = req.body;
    
    if (!businessName || !businessType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: businessName, businessType'
      });
    }
    
    console.log(`🚀 [Claude Route] Starting generation for: ${businessName} (${businessType})`);
    
    // Genera sito con Claude Sonnet
    const result = await generateWebsiteWithClaude(businessName, businessType);
    
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
