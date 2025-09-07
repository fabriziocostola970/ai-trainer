/**
 * 🧪 TEST CONCESSIONARIO AUTO CON FILTRI DI RICERCA
 * Test specifico per verificare che il sistema implementi i filtri richiesti
 */

const API_BASE = 'https://ai-trainer-production-8fd9.up.railway.app';
const API_KEY = process.env.AI_TRAINER_API_KEY || 'your-api-key-here';

// 🚗 ESEMPIO: Concessionario Auto con Filtri Specifici
async function testAutomotiveDealer() {
  console.log('🚗 Testing: Concessionario Auto con Filtri di Ricerca...');
  
  const response = await fetch(`${API_BASE}/api/claude/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      businessName: "AutoMotor Premium",
      businessType: "automotive",
      businessDescription: "Concessionario auto multimarca con ampio inventario. NECESSARIO: filtri di ricerca per tipo auto (berlina, SUV, station wagon), tipo carburante (benzina, diesel, elettrico, ibrido), uso (commerciale/privato), cilindrata motore. Sezioni: Auto Nuove, Auto Usate, Finanziamenti, Service & Ricambi. Stile aggressivo e colorato per attirare clienti. Contatti: Tel 011-555-0123, WhatsApp 347-555-0123, Via Roma 45 Torino."
    })
  });
  
  const result = await response.json();
  console.log('🌐 Website generato:', JSON.stringify(result, null, 2));
  
  // 🔍 ANALISI RISULTATI
  if (result.success) {
    const website = result.website;
    
    console.log('\n🔍 ANALISI FILTRI E REQUISITI:');
    console.log('- Sezioni generate:', website.sections.length);
    
    // Verifica sezioni richieste
    const requiredSections = ['Auto Nuove', 'Auto Usate', 'Finanziamenti', 'Service'];
    const foundSections = website.sections.map(s => s.title);
    console.log('- Sezioni trovate:', foundSections);
    
    requiredSections.forEach(section => {
      const found = foundSections.some(title => title.toLowerCase().includes(section.toLowerCase()));
      console.log(`  ✓ ${section}: ${found ? '✅ TROVATA' : '❌ MANCANTE'}`);
    });
    
    // Verifica filtri di ricerca
    const websiteContent = JSON.stringify(website);
    const filterTypes = ['berlina', 'SUV', 'benzina', 'diesel', 'elettrico', 'commerciale', 'cilindrata'];
    
    console.log('\n🔍 VERIFICA FILTRI DI RICERCA:');
    filterTypes.forEach(filter => {
      const found = websiteContent.toLowerCase().includes(filter.toLowerCase());
      console.log(`  ✓ ${filter}: ${found ? '✅ PRESENTE' : '❌ MANCANTE'}`);
    });
    
    // Verifica contatti
    const contacts = website.contact;
    console.log('\n📞 VERIFICA CONTATTI:');
    console.log(`  ✓ Telefono: ${contacts.phone || '❌ MANCANTE'}`);
    console.log(`  ✓ WhatsApp: ${contacts.whatsapp || '❌ MANCANTE'}`);
    console.log(`  ✓ Indirizzo: ${contacts.address || '❌ MANCANTE'}`);
    
    // Verifica stile aggressivo
    const hasAggressiveStyle = websiteContent.toLowerCase().includes('aggressivo') || 
                              website.colors.primary?.includes('#FF') || 
                              website.colors.secondary?.includes('#FF');
    console.log(`  ✓ Stile aggressivo/colorato: ${hasAggressiveStyle ? '✅ PRESENTE' : '❌ MANCANTE'}`);
    
    if (result.metadata?.requirements_validation) {
      console.log('\n📋 VALIDAZIONE AUTOMATICA:');
      console.log('- Requisiti totali:', result.metadata.requirements_validation.total_requirements);
      console.log('- Requisiti soddisfatti:', result.metadata.requirements_validation.satisfied);
      console.log('- Requisiti completati automaticamente:', result.metadata.requirements_validation.missing_auto_completed);
    }
  }
  
  return result;
}

// 🧪 ESEGUI TEST
async function runTest() {
  console.log('🚀 TESTING AUTOMOTIVE DEALER WITH FILTERS...\n');
  
  try {
    await testAutomotiveDealer();
    console.log('\n🎉 TEST COMPLETATO!');
    
  } catch (error) {
    console.error('❌ Errore nel test:', error);
  }
}

// 🏃‍♂️ RUN
runTest();
