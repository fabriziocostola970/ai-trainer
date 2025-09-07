/**
 * 🧪 TEST GENERAZIONE HTML DIRETTA CON CLAUDE
 * Test del nuovo sistema che genera HTML completo come Claude.ai
 */

const API_BASE = 'https://ai-trainer-production-8fd9.up.railway.app';
const API_KEY = process.env.AI_TRAINER_API_KEY || 'your-api-key-here';

// 🌸 TEST: Fioreria con HTML Diretto
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
      businessDescription: "Siamo un'antica famiglia che da generazioni ci occupiamo di piante e alberi. Dal nonno Giuseppe che aprì la prima bottega nel 1952, fino ai nostri giorni, abbiamo sempre messo cura e amore in quello che facciamo. Importiamo le migliori piante da tutto il mondo, manteniamo rapporti diretti con i coltivatori più esperti e offriamo composizioni floreali uniche per anniversari, compleanni, comunioni e matrimoni. Sezioni: Alberi da Frutta, Giardinaggio Casalingo, Piante Ornamentali (orchidee, rose rosse, piante ornamentali), Cerimonie. Filtri di ricerca per categoria. Indirizzo: Via della Balduina 123, Roma. Tel: 06.55.99.26.47",
      stylePreference: "elegante e naturale",
      colorMood: "verde natura con accenti colorati",
      targetAudience: "famiglie e appassionati di giardinaggio"
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('✅ HTML Generated Successfully!');
    console.log('📊 Metadata:', JSON.stringify(result.metadata, null, 2));
    console.log(`📄 HTML Length: ${result.html.length} characters`);
    
    // Salva HTML in file per preview
    const fs = require('fs');
    const htmlFileName = `generated-flower-shop-${Date.now()}.html`;
    fs.writeFileSync(htmlFileName, result.html);
    console.log(`💾 HTML saved to: ${htmlFileName}`);
    
    // Analizza struttura HTML
    const hasDoctype = result.html.includes('<!DOCTYPE html>');
    const hasTailwind = result.html.includes('tailwindcss.com');
    const hasFontAwesome = result.html.includes('font-awesome');
    const hasGoogleFonts = result.html.includes('fonts.googleapis.com');
    const hasJavaScript = result.html.includes('<script>') && !result.html.includes('src=');
    const hasFilters = result.html.toLowerCase().includes('filter');
    
    console.log('\n🔍 HTML ANALYSIS:');
    console.log(`  ✓ DOCTYPE HTML5: ${hasDoctype ? '✅' : '❌'}`);
    console.log(`  ✓ Tailwind CSS: ${hasTailwind ? '✅' : '❌'}`);
    console.log(`  ✓ Font Awesome: ${hasFontAwesome ? '✅' : '❌'}`);
    console.log(`  ✓ Google Fonts: ${hasGoogleFonts ? '✅' : '❌'}`);
    console.log(`  ✓ JavaScript Interactions: ${hasJavaScript ? '✅' : '❌'}`);
    console.log(`  ✓ Filter System: ${hasFilters ? '✅' : '❌'}`);
    
    return result;
    
  } else {
    console.error('❌ HTML Generation Failed:', result.error);
    return null;
  }
}

// 🚗 TEST: Concessionario Auto con HTML Diretto  
async function testAutomotiveHTML() {
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
      businessDescription: "Concessionario auto multimarca con ampio inventario. NECESSARIO: filtri di ricerca per tipo auto (berlina, SUV, station wagon), tipo carburante (benzina, diesel, elettrico, ibrido), uso (commerciale/privato), cilindrata motore. Sezioni: Auto Nuove, Auto Usate, Finanziamenti, Service & Ricambi. Stile aggressivo e colorato per attirare clienti. Contatti: Tel 011-555-0123, WhatsApp 347-555-0123, Via Roma 45 Torino.",
      stylePreference: "moderno e aggressivo",
      colorMood: "rosso sportivo e nero",
      targetAudience: "acquirenti di auto"
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('✅ Automotive HTML Generated!');
    console.log(`📄 HTML Length: ${result.html.length} characters`);
    
    // Salva HTML 
    const fs = require('fs');
    const htmlFileName = `generated-automotive-${Date.now()}.html`;
    fs.writeFileSync(htmlFileName, result.html);
    console.log(`💾 HTML saved to: ${htmlFileName}`);
    
    // Verifica filtri automotive
    const htmlContent = result.html.toLowerCase();
    const automotiveFilters = [
      'berlina', 'suv', 'station wagon',
      'benzina', 'diesel', 'elettrico', 'ibrido',
      'commerciale', 'privato', 'cilindrata'
    ];
    
    console.log('\n🔍 AUTOMOTIVE FILTERS CHECK:');
    automotiveFilters.forEach(filter => {
      const found = htmlContent.includes(filter.toLowerCase());
      console.log(`  ✓ ${filter}: ${found ? '✅' : '❌'}`);
    });
    
    return result;
    
  } else {
    console.error('❌ Automotive HTML Generation Failed:', result.error);
    return null;
  }
}

// 🧪 ESEGUI TUTTI I TEST
async function runAllHTMLTests() {
  console.log('🚀 TESTING CLAUDE HTML DIRECT GENERATION...\n');
  
  try {
    const flowerShop = await testFlowerShopHTML();
    const automotive = await testAutomotiveHTML();
    
    console.log('\n🎉 ALL HTML TESTS COMPLETED!');
    
    if (flowerShop && automotive) {
      console.log('\n📊 COMPARISON:');
      console.log(`Flower Shop HTML: ${flowerShop.html.length} chars`);
      console.log(`Automotive HTML: ${automotive.html.length} chars`);
      console.log('\n💡 Open the generated HTML files in browser to see the results!');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// 🏃‍♂️ RUN
runAllHTMLTests();
