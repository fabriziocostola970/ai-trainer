/**
 * 🔒 TEST SICURO CLAUDE SONNET GENERATOR
 * Versione sicura senza API key hardcoded
 */

const API_BASE = 'https://ai-trainer-production-8fd9.up.railway.app';

// 🔑 LEGGI API KEY DA VARIABILE AMBIENTE O PROMPT
const API_KEY = process.env.AI_TRAINER_API_KEY;

if (!API_KEY) {
  console.error('❌ ERRORE: Imposta la variabile ambiente AI_TRAINER_API_KEY');
  console.log('📋 ISTRUZIONI:');
  console.log('   Windows: $env:AI_TRAINER_API_KEY="your-api-key"');
  console.log('   Linux/Mac: export AI_TRAINER_API_KEY="your-api-key"');
  console.log('   Oppure modifica il file .env');
  process.exit(1);
}

// 🎯 ESEMPIO 1: Pizzeria Semplice
async function testPizzeria() {
  console.log('🍕 Testing: Pizzeria con Claude Sonnet...');
  
  const response = await fetch(`${API_BASE}/api/claude/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      businessName: "Pizzeria La Margherita",
      businessType: "restaurant",
      businessDescription: "Pizzeria artigianale con forno a legna, specializzata in pizza napoletana autentica e ingredienti freschi locali"
    })
  });
  
  const result = await response.json();
  console.log('🌐 Website generato:', JSON.stringify(result, null, 2));
  return result;
}

// 🧪 ESEGUI TEST SICURO
async function runSecureTest() {
  console.log('🔒 STARTING SECURE CLAUDE SONNET TEST...\n');
  
  try {
    const pizzeria = await testPizzeria();
    console.log(`✅ Pizzeria: ${pizzeria.website?.totalSections} sezioni generate\n`);
    console.log('🎉 TEST COMPLETATO IN SICUREZZA!');
    
  } catch (error) {
    console.error('❌ Errore nel test:', error);
  }
}

// 🏃‍♂️ RUN
runSecureTest();

// 📋 ISTRUZIONI SICURE:
// 1. Imposta API key: $env:AI_TRAINER_API_KEY="your-key"
// 2. Esegui: node test-claude-secure.js
// 3. ✅ Nessuna API key esposta nel codice!
