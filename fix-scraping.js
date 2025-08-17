// 🔧 Script per rimuovere funzioni di scraping e mantenere solo Unsplash API

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/api/generate-layout.js');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Removing scraping functions...');

// Rimuovi la funzione scrapeUnsplashFromCompetitors
content = content.replace(
  /\/\/ 🕷️ SCRAPING DINAMICO[\s\S]*?^async function extractStockImages/m,
  '// 🕷️ SCRAPING REMOVED FOR COPYRIGHT SAFETY\n\n// 🔍 ESTRAZIONE SOLO IMMAGINI STOCK/UNSPLASH\nfunction extractStockImages'
);

// Rimuovi la funzione extractStockImages
content = content.replace(
  /\/\/ 🔍 ESTRAZIONE SOLO IMMAGINI STOCK\/UNSPLASH[\s\S]*?^\/\/ 🖼️ OTTIMIZZAZIONE URL IMMAGINI/m,
  '// 🔍 EXTRACTION REMOVED FOR COPYRIGHT SAFETY\n\n// 🖼️ OTTIMIZZAZIONE URL IMMAGINI'
);

// Rimuovi optimizeImageUrl
content = content.replace(
  /\/\/ 🖼️ OTTIMIZZAZIONE URL IMMAGINI[\s\S]*?^\/\/ 💾 SALVATAGGIO PATTERN NEL DATABASE/m,
  '// 🖼️ OPTIMIZATION REMOVED FOR COPYRIGHT SAFETY\n\n// 💾 SALVATAGGIO PATTERN NEL DATABASE'
);

// Modifica triggerControlledTraining per usare solo Unsplash API
content = content.replace(
  /\/\/ 🚀 Training controllato SENZA loop infiniti \(con Unsplash Scraping\)/,
  '// 🚀 Training controllato SENZA scraping (solo Unsplash API libere)'
);

content = content.replace(
  /\/\/ 🕷️ STEP 2: Scraping SOLO immagini Unsplash dai competitor[\s\S]*?(?=    return false;)/,
  `    // 🖼️ STEP 2: SOLO Unsplash API per immagini copyright-free
    console.log(\`📸 Using ONLY Unsplash API for copyright-free images: \${businessType}\`);
    const unsplashImages = await generateUnsplashFallback(businessType, 8);
    
    if (unsplashImages.length > 0) {
      // 💾 STEP 3: Salva nel database
      await saveBusinessImagesPattern(businessType, unsplashImages, storage);
      console.log(\`✅ Controlled training completed for: \${businessType}\`);
      return true;
    } else {
      console.log(\`⚠️ Unsplash API failed, using hardcoded stock for: \${businessType}\`);
      const hardcodedImages = getHardcodedStockImages(businessType, 6);
      await saveBusinessImagesPattern(businessType, hardcodedImages, storage);
      return true;
    }
    
`
);

// Scrivi il file modificato
fs.writeFileSync(filePath, content);
console.log('✅ Scraping functions removed successfully!');
console.log('🔗 System now uses ONLY Unsplash API for copyright-free images');
