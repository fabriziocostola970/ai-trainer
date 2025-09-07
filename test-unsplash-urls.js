// TEST UNSPLASH URLS - Mostra i link esatti inviati a Unsplash
require('dotenv').config();

console.log('🔍 UNSPLASH API URL TESTER');
console.log('===========================');

// Simula esattamente cosa fa il nostro servizio
const { createApi } = require('unsplash-js');

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
});

console.log('API Key loaded:', process.env.UNSPLASH_ACCESS_KEY ? 'YES' : 'NO');
console.log('API Key preview:', process.env.UNSPLASH_ACCESS_KEY ? 
  process.env.UNSPLASH_ACCESS_KEY.substring(0, 10) + '...' : 'MISSING');

// Test delle query che usiamo per fioraio
const testQueries = [
  'flowers plants gardening',  // Hero per fioraio
  'florist shop flowers',      // Service per fioraio  
  'garden nature plants',      // Background per fioraio
  'piante fiori',              // Test italiano
  'fioraio',                   // Test business type diretto
];

async function testUnsplashUrls() {
  console.log('\n🔗 TESTING UNSPLASH SEARCH URLS:');
  console.log('================================');
  
  for (const query of testQueries) {
    console.log(`\n📍 Testing query: "${query}"`);
    
    // Costruiamo manualmente l'URL che Unsplash userebbe
    const baseUrl = 'https://api.unsplash.com/search/photos';
    const params = new URLSearchParams({
      query: query,
      page: '1',
      per_page: '2',
      orientation: 'landscape',
      order_by: 'relevant'
    });
    
    const fullUrl = `${baseUrl}?${params.toString()}`;
    console.log(`🔗 Full URL: ${fullUrl}`);
    console.log(`🔑 Headers: Authorization: Client-ID ${process.env.UNSPLASH_ACCESS_KEY?.substring(0, 10)}...`);
    
    try {
      // Test effettivo
      const result = await unsplash.search.getPhotos({
        query: query,
        page: 1,
        perPage: 2,
        orientation: 'landscape',
        orderBy: 'relevant'
      });
      
      if (result.errors) {
        console.log(`❌ ERRORS: ${JSON.stringify(result.errors)}`);
      } else {
        console.log(`✅ SUCCESS: Found ${result.response.results.length} images`);
        if (result.response.results[0]) {
          console.log(`📸 Sample image: ${result.response.results[0].urls.small}`);
        }
      }
    } catch (error) {
      console.log(`❌ EXCEPTION: ${error.message}`);
    }
    
    console.log('---');
  }
}

testUnsplashUrls().catch(console.error);
