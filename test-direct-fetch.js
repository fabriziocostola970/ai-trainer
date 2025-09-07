// TEST UNSPLASH CON FETCH DIRETTO
require('dotenv').config();

console.log('🔍 TESTING UNSPLASH WITH DIRECT FETCH');
console.log('=====================================');

async function testDirectFetch() {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
  
  const query = 'flowers plants gardening';
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=1&per_page=2&orientation=landscape`;
  
  console.log('🔗 URL:', url);
  console.log('🔑 Authorization: Client-ID', apiKey);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${apiKey}`
      }
    });
    
    console.log('📡 Response Status:', response.status);
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS!');
      console.log('📊 Total results:', data.total);
      console.log('📸 Results count:', data.results.length);
      if (data.results[0]) {
        console.log('🖼️ First image URL:', data.results[0].urls.small);
        console.log('🏷️ First image description:', data.results[0].description || data.results[0].alt_description);
      }
    } else {
      console.log('❌ ERROR Response:', data);
    }
    
  } catch (error) {
    console.error('❌ Fetch Error:', error.message);
  }
}

testDirectFetch();
