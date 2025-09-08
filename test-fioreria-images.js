/**
 * 🔍 TEST UNIFIED IMAGE SERVICE - Fioreria  
 * Testiamo cosa trova il sistema per migliorare la coerenza
 */

// ⚡ Carica variabili ambiente PRIMA di tutto
require('dotenv').config();

const UnifiedImageService = require('./src/services/unified-image-service.js');

async function testFioreriaImages() {
  console.log('🌸 TESTING FIORERIA IMAGES...\n');
  
  try {
    const result = await UnifiedImageService.getBusinessImages(
      'Fioreria Balduina',
      'fioreria', 
      'fioreria tradizionale dal 1895 con alberi da frutta, giardinaggio casalingo, piante ornamentali e composizioni per cerimonie',
      6
    );
    
    console.log('📊 RISULTATI:');
    console.log('Total images:', result.total);
    console.log('Use local:', result.useLocal);
    console.log('Source:', result.source);
    
    if (result.hero) {
      console.log('\n🎯 HERO IMAGES:');
      result.hero.forEach((img, i) => {
        console.log(`${i+1}. ${img.url || img.webformatURL}`);
        console.log(`   Alt: ${img.alt || img.tags || 'N/A'}`);
      });
    }
    
    if (result.services) {
      console.log('\n🔧 SERVICE IMAGES:');
      result.services.forEach((img, i) => {
        console.log(`${i+1}. ${img.url || img.webformatURL}`);
        console.log(`   Alt: ${img.alt || img.tags || 'N/A'}`);
      });
    }
    
    console.log('\n📝 KEYWORDS USED:');
    console.log('Primary:', result.keywords?.primary);
    console.log('Secondary:', result.keywords?.secondary);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFioreriaImages();
