/**
 * 🧪 TEST HTML GENERATION SYSTEM
 * Test del nuovo sistema che genera HTML diretto come Claude.ai
 */

const API_BASE = 'https://ai-trainer-production-8fd9.up.railway.app';
const API_KEY = process.env.AI_TRAINER_API_KEY || 'your-api-key-here';

// 🌸 TEST: Fioraio con HTML Generation
async function testFlowerShopHTML() {
  console.log('🌸 Testing: Fioreria HTML Generation...');
  
  const response = await fetch(`${API_BASE}/api/claude/generate-html`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      businessName: "Fioreria Balduina",
      businessType: "florist",
      businessDescription: "Siamo un'antica famiglia che da generazioni ci occupiamo di piante e alberi. Importiamo le migliori piante da tutto il mondo, manteniamo rapporti diretti con i coltivatori più esperti e offriamo composizioni floreali uniche per anniversari, compleanni, comunioni e matrimoni. Sezioni richieste: Alberi da Frutta, Giardinaggio Casalingo, Piante Ornamentali, Cerimonie. Contatti: Via della Balduina 123 Roma, Tel 06.55.99.26.47. Stile moderno e accattivante con filtri interattivi.",
      style: "moderno e colorato con animazioni"
    })
  });
  
  if (!response.ok) {
    console.error(`❌ HTTP Error: ${response.status}`);
    const errorText = await response.text();
    console.error('Error details:', errorText);
    return;
  }
  
  const result = await response.json(); // JSON response with HTML inside
  
  if (!result.success || !result.html) {
    console.error('❌ Invalid response format');
    return;
  }
  
  const htmlContent = result.html;
  
  console.log('✅ HTML Generated successfully!');
  console.log(`📏 HTML Size: ${htmlContent.length} characters`);
  
  // Verifica che contenga elementi moderni
  const checks = {
    'Tailwind CSS': htmlContent.includes('tailwindcss'),
    'Font Awesome': htmlContent.includes('font-awesome'),
    'Gradients': htmlContent.includes('gradient'),
    'Hover Effects': htmlContent.includes('hover:'),
    'Responsive': htmlContent.includes('md:') || htmlContent.includes('lg:'),
    'Animations': htmlContent.includes('transition') || htmlContent.includes('transform'),
    'Business Name': htmlContent.includes('Fioreria Balduina'),
    'Contact Info': htmlContent.includes('06.55.99.26.47'),
    'Sezioni Richieste': htmlContent.includes('Alberi da Frutta') && htmlContent.includes('Giardinaggio'),
  };
  
  console.log('\n🔍 ANALISI QUALITÀ HTML:');
  Object.entries(checks).forEach(([check, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${check}`);
  });
  
  // Salva HTML per preview
  const fs = require('fs');
  fs.writeFileSync('./generated-fioreria.html', htmlContent);
  console.log('\n💾 HTML salvato in: generated-fioreria.html');
  
  return result;
}

// 🚗 TEST: Concessionario Auto con HTML
async function testAutoDealerHTML() {
  console.log('\n🚗 Testing: Concessionario Auto HTML Generation...');
  
  const response = await fetch(`${API_BASE}/api/claude/generate-html`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      businessName: "AutoMotor Premium",
      businessType: "automotive",
      businessDescription: "Concessionario auto multimarca con ampio inventario. NECESSARI filtri di ricerca per: tipo auto (berlina, SUV, station wagon), carburante (benzina, diesel, elettrico, ibrido), uso (commerciale/privato), cilindrata. Sezioni: Auto Nuove, Auto Usate, Finanziamenti, Service & Ricambi. Stile aggressivo e sportivo. Contatti: Via Roma 45 Torino, Tel 011-555-0123, WhatsApp 347-555-0123.",
      style: "aggressivo e sportivo con colori automotive"
    })
  });
  
  if (!response.ok) {
    console.error(`❌ HTTP Error: ${response.status}`);
    return;
  }
  
  const result = await response.json();
  
  if (!result.success || !result.html) {
    console.error('❌ Invalid response format');
    return;
  }
  
  const htmlContent = result.html;
  
  console.log('✅ HTML Generated successfully!');
  console.log(`📏 HTML Size: ${htmlContent.length} characters`);
  
  // Verifica filtri automotive specifici
  const automotiveChecks = {
    'Filtri Tipo Auto': htmlContent.includes('berlina') && htmlContent.includes('SUV'),
    'Filtri Carburante': htmlContent.includes('benzina') && htmlContent.includes('elettrico'),
    'Filtri Uso': htmlContent.includes('commerciale') && htmlContent.includes('privato'),
    'Sezioni Auto': htmlContent.includes('Auto Nuove') && htmlContent.includes('Auto Usate'),
    'Contatti Torino': htmlContent.includes('Torino') && htmlContent.includes('011-555-0123'),
    'WhatsApp': htmlContent.includes('347-555-0123'),
    'Stile Aggressivo': htmlContent.includes('gradient') || htmlContent.includes('bold'),
  };
  
  console.log('\n🔍 ANALISI AUTOMOTIVE:');
  Object.entries(automotiveChecks).forEach(([check, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${check}`);
  });
  
  // Salva HTML
  const fs = require('fs');
  fs.writeFileSync('./generated-automotive.html', htmlContent);
  console.log('💾 HTML salvato in: generated-automotive.html');
  
  return result;
}

// 🧪 ESEGUI TUTTI I TEST
async function runAllTests() {
  console.log('🚀 TESTING HTML GENERATION SYSTEM...\n');
  
  try {
    await testFlowerShopHTML();
    await testAutoDealerHTML();
    
    console.log('\n🎉 TUTTI I TEST HTML COMPLETATI!');
    console.log('\n📖 CONFRONTA I RISULTATI:');
    console.log('  • generated-fioreria.html - Stile moderno e naturale');
    console.log('  • generated-automotive.html - Stile aggressivo e automotive');
    console.log('\n💡 Apri i file HTML nel browser per vedere la differenza!');
    
  } catch (error) {
    console.error('❌ Errore nei test:', error);
  }
}

// 🏃‍♂️ RUN
runAllTests();
