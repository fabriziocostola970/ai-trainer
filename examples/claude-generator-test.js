// 🤖 ESEMPIO UTILIZZO CLAUDE SONNET GENERATOR
// Test del nuovo sistema parallelo che non modifica nulla dell'esistente

const testClaudeGenerator = async () => {
  const API_BASE = 'https://ai-trainer-production-8fd9.up.railway.app';
  const API_KEY = 'your-api-key-here'; // Sostituire con la vera API key

  console.log('🧪 Testing Claude Sonnet Generator...');

  try {
    // 🔍 1. TEST: Analisi pattern esistenti per fioraio
    console.log('\n🔍 Step 1: Analyzing existing patterns...');
    
    const patternsResponse = await fetch(`${API_BASE}/api/claude/patterns/florist`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const patternsData = await patternsResponse.json();
    console.log('📊 Patterns found:', patternsData);

    // 🤖 2. TEST: Generazione sito con Claude
    console.log('\n🤖 Step 2: Generating website with Claude...');
    
    const generateResponse = await fetch(`${API_BASE}/api/claude/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        businessName: 'Fioraio delle Rose',
        businessType: 'florist'
      })
    });
    
    const websiteData = await generateResponse.json();
    console.log('🌐 Generated website:', websiteData);

    // 📋 3. CONFRONTO: Con sistema AI-Trainer esistente
    console.log('\n📋 Step 3: Comparing with AI-Trainer classic...');
    
    const classicResponse = await fetch(`${API_BASE}/api/generate-layout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        businessName: 'Fioraio delle Rose',
        businessType: 'florist'
      })
    });
    
    const classicData = await classicResponse.json();
    console.log('🎯 AI-Trainer classic:', classicData);

    // 🔍 4. ANALISI RISULTATI
    console.log('\n🔍 Step 4: Analysis...');
    console.log('Claude sections:', websiteData.website?.totalSections || 'N/A');
    console.log('Classic sections:', classicData.layout?.blocks?.length || 'N/A');
    console.log('Claude complexity:', websiteData.website?.complexity || 'N/A');
    console.log('Claude based on patterns:', websiteData.metadata?.basedOnPatterns || 0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// 🎯 ESEMPI DI UTILIZZO DEL NUOVO SISTEMA

// Esempio 1: Business semplice (locale)
const testSimpleBusiness = async () => {
  const response = await fetch('/api/claude/generate', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer your-api-key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      businessName: 'Pizzeria Mario', // Nome semplice → Complexity: 3
      businessType: 'restaurant'
    })
  });
  
  const result = await response.json();
  // Aspettato: 3-4 sezioni, design semplice
  console.log('Simple business result:', result);
};

// Esempio 2: Business complesso (enterprise)  
const testComplexBusiness = async () => {
  const response = await fetch('/api/claude/generate', {
    method: 'POST', 
    headers: {
      'Authorization': 'Bearer your-api-key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      businessName: 'McDonald\'s Enterprise Solutions', // Nome enterprise → Complexity: 8
      businessType: 'restaurant'
    })
  });
  
  const result = await response.json();
  // Aspettato: 6-8 sezioni, design sofisticato
  console.log('Complex business result:', result);
};

// Esempio 3: Analisi pattern per business type
const testPatternAnalysis = async () => {
  const response = await fetch('/api/claude/patterns/technology', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer your-api-key'
    }
  });
  
  const patterns = await response.json();
  console.log('Technology patterns:', patterns);
  // Mostra: sezioni comuni, numero medio sezioni, quality score, etc.
};

// 🚀 INTEGRAZIONE CON VENDIONLINE.EU

const integrateWithVendiOnline = async (businessName, businessType) => {
  // Nel frontend di VendiOnline.EU, aggiungere opzione per usare Claude
  
  try {
    // Opzione 1: Sistema AI-Trainer classico
    const classicResult = await generateWithAITrainer(businessName, businessType);
    
    // Opzione 2: Sistema Claude Sonnet (nuovo)
    const claudeResult = await generateWithClaude(businessName, businessType);
    
    // Confronto e scelta del migliore
    const bestResult = claudeResult.website.totalSections > 4 ? claudeResult : classicResult;
    
    return bestResult;
  } catch (error) {
    // Fallback al sistema esistente
    return await generateWithAITrainer(businessName, businessType);
  }
};

const generateWithClaude = async (businessName, businessType) => {
  const response = await fetch('/api/claude/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.AI_TRAINER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ businessName, businessType })
  });
  
  return await response.json();
};

// 📝 DOCUMENTAZIONE ENDPOINT

/*
🤖 CLAUDE SONNET ENDPOINT:

POST /api/claude/generate
- Genera sito web utilizzando Claude Sonnet
- Input: { businessName, businessType }
- Output: { success, website, metadata }
- Features: Pattern learning, business complexity detection, intelligent prompting

GET /api/claude/patterns/:businessType  
- Analizza pattern esistenti per un business type
- Output: { businessType, patterns, statistics }
- Features: Database analysis, success factors, section recommendations

🎯 VANTAGGI RISPETTO AL SISTEMA ESISTENTE:
✅ Pattern learning dal database ai_design_patterns
✅ Business complexity detection automatica  
✅ Numero sezioni dinamico (3-8 basato su complessità)
✅ Una sola sezione contatti (risolve duplicazione)
✅ Prompt intelligenti basati su successi reali
✅ Sistema completamente parallelo (non rompe nulla)

🔧 CONFIGURAZIONE:
- Usa stesso database ai_design_patterns
- Usa stessa autenticazione API
- Compatibile con VendiOnline.EU esistente
- Pronto per integrazione Claude API quando disponibile
*/

module.exports = {
  testClaudeGenerator,
  testSimpleBusiness,
  testComplexBusiness,  
  testPatternAnalysis,
  integrateWithVendiOnline,
  generateWithClaude
};
