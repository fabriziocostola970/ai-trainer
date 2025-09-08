/**
 * 🧹 SCRIPT PER PULIRE E ESTRARRE HTML DAI FILE GENERATI
 */

const fs = require('fs');

function cleanHTMLFile(inputFile, outputFile) {
  try {
    console.log(`🔧 Cleaning ${inputFile}...`);
    
    // Leggi il file JSON
    const rawContent = fs.readFileSync(inputFile, 'utf8');
    const jsonData = JSON.parse(rawContent);
    
    // Estrai l'HTML pulito
    let cleanHTML = jsonData.html;
    
    // Rimuovi i markdown code blocks se presenti
    if (cleanHTML.startsWith('```html\n')) {
      cleanHTML = cleanHTML.replace(/^```html\n/, '').replace(/\n```$/, '');
    }
    
    // Salva l'HTML pulito
    fs.writeFileSync(outputFile, cleanHTML);
    
    console.log(`✅ HTML pulito salvato in: ${outputFile}`);
    console.log(`📏 Dimensione: ${cleanHTML.length} caratteri`);
    
    return cleanHTML;
    
  } catch (error) {
    console.error(`❌ Errore nella pulizia di ${inputFile}:`, error.message);
    return null;
  }
}

// Pulisci entrambi i file
console.log('🚀 PULIZIA FILE HTML GENERATI...\n');

const fioreriaHTML = cleanHTMLFile('./generated-fioreria.html', './fioreria-clean.html');
const automotiveHTML = cleanHTMLFile('./generated-automotive.html', './automotive-clean.html');

if (fioreriaHTML && automotiveHTML) {
  console.log('\n🎉 ENTRAMBI I FILE PULITI CON SUCCESSO!');
  console.log('📂 File puliti:');
  console.log('  • fioreria-clean.html');
  console.log('  • automotive-clean.html');
} else {
  console.log('\n❌ Errore nella pulizia dei file');
}
