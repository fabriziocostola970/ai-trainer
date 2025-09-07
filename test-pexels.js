// 🧪 TEST PEXELS SERVICE
require('dotenv').config();
const PexelsService = require('./src/services/pexels-service');

async function testPexels() {
  console.log('🧪 Testing Pexels Service...\n');
  
  const pexelsService = new PexelsService();
  
  try {
    // Test singola ricerca
    console.log('📸 Testing single search...');
    const singleResult = await pexelsService.searchImages('flowers', 2);
    console.log(`Found ${singleResult.length} flower images\n`);
    
    if (singleResult.length > 0) {
      console.log('First image:', singleResult[0].url);
      console.log('Photographer:', singleResult[0].photographer);
    }
    
    // Test business completo
    console.log('\n🏪 Testing business search...');
    const businessResult = await pexelsService.getBusinessImages('fioraio', 'Franco il Fioraio', 1);
    console.log(`Business search result: ${businessResult.total} total images`);
    console.log(`Hero images: ${businessResult.hero.length}`);
    
    if (businessResult.hero.length > 0) {
      console.log('Hero image URL:', businessResult.hero[0].url);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPexels();
