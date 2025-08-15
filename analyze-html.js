// Analisi HTML per caratteri problematici
const fs = require('fs');

try {
  const html = fs.readFileSync('example-raw.html', 'utf8');
  
  console.log('🔍 ANALISI HTML:');
  console.log(`📊 Total characters: ${html.length}`);
  
  // Cerca caratteri problematici
  const nullBytes = (html.match(/\x00/g) || []).length;
  console.log(`❌ Null bytes: ${nullBytes}`);
  
  const smartQuotes = (html.match(/[""'']/g) || []).length;
  console.log(`📝 Smart quotes: ${smartQuotes}`);
  
  const backslashes = (html.match(/\\/g) || []).length;
  console.log(`🔙 Backslashes: ${backslashes}`);
  
  const dollars = (html.match(/\$/g) || []).length;
  console.log(`💲 Dollar signs: ${dollars}`);
  
  const singleQuotes = (html.match(/'/g) || []).length;
  console.log(`' Single quotes: ${singleQuotes}`);
  
  const doubleQuotes = (html.match(/"/g) || []).length;
  console.log(`" Double quotes: ${doubleQuotes}`);
  
  console.log('\n🧹 TESTING SANITIZATION:');
  
  // Test di sanitizzazione base
  let sanitized = html
    .replace(/\x00/g, '') // Remove null bytes
    .replace(/[""]/g, '"') // Normalize smart quotes
    .replace(/['']/g, "'") // Normalize apostrophes
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/'/g, "''"); // Escape single quotes for SQL
  
  console.log(`Original: ${html.length} chars`);
  console.log(`Sanitized: ${sanitized.length} chars`);
  console.log(`Difference: ${html.length - sanitized.length}`);
  
  // Salva versione sanitizzata
  fs.writeFileSync('example-sanitized.html', sanitized, 'utf8');
  console.log('✅ Sanitized version saved');
  
  // Mostra un piccolo campione
  console.log('\n📝 SAMPLE (first 200 chars):');
  console.log(html.substring(0, 200));
  
} catch (error) {
  console.error('Error:', error.message);
}
