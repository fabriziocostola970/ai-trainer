/**
 * 🧹 ESTRATTORE HTML PULITO
 * Estrae l'HTML puro dai file JSON generati
 */

const fs = require('fs');
const path = require('path');

function extractCleanHTML(inputFile, outputFile) {
  try {
    console.log(`📖 Leggendo ${inputFile}...`);
    
    // Leggi il file JSON
    const rawContent = fs.readFileSync(inputFile, 'utf8');
    const jsonData = JSON.parse(rawContent);
    
    let cleanHTML = jsonData.html;
    
    // Rimuovi i markdown code blocks
    if (cleanHTML.startsWith('```html\n')) {
      cleanHTML = cleanHTML.replace(/^```html\n/, '').replace(/\n```$/, '');
    }
    
    // Salva l'HTML pulito
    fs.writeFileSync(outputFile, cleanHTML, 'utf8');
    
    console.log(`✅ HTML pulito salvato in ${outputFile}`);
    console.log(`📏 Dimensioni: ${cleanHTML.length} caratteri`);
    
    return cleanHTML;
  } catch (error) {
    console.error('❌ Errore nell\'estrazione:', error.message);
    return null;
  }
}

// Estrai entrambi i siti
console.log('🚀 ESTRAZIONE HTML PULITO...\n');

// Fioreria
extractCleanHTML(
  path.join(__dirname, 'generated-fioreria.html'),
  path.join(__dirname, 'fioreria-clean.html')
);

console.log('');

// Automotive  
extractCleanHTML(
  path.join(__dirname, 'generated-automotive.html'),
  path.join(__dirname, 'automotive-clean.html')
);

console.log('\n🎉 Estrazione completata!');
