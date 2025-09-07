/**
 * 🧪 TEST DIRETTO CLAUDE SONNET GENERATOR
 * Script per testare il sistema Claude senza interfacce
 */

const API_BASE = 'https://ai-trainer-production-8fd9.up.railway.app';
const API_KEY = process.env.AI_TRAINER_API_KEY || 'your-api-key-here';

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

// 🎯 ESEMPIO 2: Negozio Tecnologia Complesso
async function testTechStore() {
  console.log('💻 Testing: Tech Store con Claude Sonnet...');
  
  const response = await fetch(`${API_BASE}/api/claude/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      businessName: "TechPoint Enterprise Solutions",
      businessType: "technology",
      businessDescription: "Azienda specializzata in soluzioni enterprise IT, consulenza cloud, cybersecurity e trasformazione digitale per grandi corporation"
    })
  });
  
  const result = await response.json();
  console.log('🌐 Website generato:', JSON.stringify(result, null, 2));
  return result;
}

// 🎯 ESEMPIO 3: Fioraio Locale
async function testFlorist() {
  console.log('🌸 Testing: Fioraio con Claude Sonnet...');
  
  const response = await fetch(`${API_BASE}/api/claude/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      businessName: "Fiori & Passioni",
      businessType: "florist",
      businessDescription: "Negozio di fiori familiare specializzato in composizioni per matrimoni, bouquet personalizzati e piante da appartamento"
    })
  });
  
  const result = await response.json();
  console.log('🌐 Website generato:', JSON.stringify(result, null, 2));
  return result;
}

// 🧪 ESEGUI TUTTI I TEST
async function runAllTests() {
  console.log('🚀 STARTING CLAUDE SONNET TESTS...\n');
  
  try {
    const pizzeria = await testPizzeria();
    console.log(`✅ Pizzeria: ${pizzeria.website?.sections?.length || 0} sezioni generate\n`);
    
    const techStore = await testTechStore();
    console.log(`✅ Tech Store: ${techStore.website?.sections?.length || 0} sezioni generate\n`);
    
    const florist = await testFlorist();
    console.log(`✅ Fioraio: ${florist.website?.sections?.length || 0} sezioni generate\n`);
    
    console.log('🎉 TUTTI I TEST COMPLETATI CON SUCCESSO!');
    
  } catch (error) {
    console.error('❌ Errore nei test:', error);
  }
}

// 🏃‍♂️ RUN
runAllTests();

// 📋 ISTRUZIONI PER USO:
// 1. Salva questo file come test-claude-direct.js
// 2. Esegui: node test-claude-direct.js
// 3. Vedrai 3 siti web generati con complessità diverse
// 4. Copia il JSON risultante per vedere il sito completo
