// Test specifico per layout generation
const https = require('https');

function makeHttpsRequest(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testLayoutGeneration() {
  try {
    console.log('🎨 Testing V6.0 CSS Dynamic System on Railway...\n');
    
    const testPayload = {
      businessType: 'Fioraio a Roma',  // V6.0: Nome business per classificazione AI
      businessName: 'Fioraio a Roma',
      style: 'elegant'
    };
    
    console.log('📤 V6.0 Request payload:', JSON.stringify(testPayload, null, 2));
    
    const result = await makeHttpsRequest(
      'https://ai-trainer-production-8fd9.up.railway.app/api/generate-layout',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ai-trainer-1e212623176704eea6dba3b62117d36c0f64d6512419defdd25226294c45a90d'
        }
      },
      JSON.stringify(testPayload)
    );
    
    console.log('\n📥 V6.0 Response status:', result.status);
    console.log('📥 V6.0 Response data:', JSON.stringify(result.data, null, 2));
    
    if (result.status === 200 && result.data.success) {
      console.log('\n✅ V6.0 Layout generation successful!');
      console.log('🎯 Blocks generated:', result.data.layout?.length || 0);
      console.log('🎨 CSS Dynamic:', result.data.dynamicCSS ? 'PRESENT ✅' : 'MISSING ❌');
      console.log('🎨 Design System:', result.data.designSystem ? 'PRESENT ✅' : 'MISSING ❌');
      console.log('📊 Semantic Score:', result.data.semanticScore);
      console.log('🏢 Business Type:', result.data.businessType);
      
      // Test colori specifici fioraio
      if (result.data.dynamicCSS) {
        const hasFloristColors = result.data.dynamicCSS.includes('#E91E63') || result.data.dynamicCSS.includes('#4CAF50');
        console.log('🌸 Florist Colors (Rosa/Verde):', hasFloristColors ? 'FOUND ✅' : 'NOT FOUND ❌');
        console.log('📏 CSS Length:', result.data.dynamicCSS.length, 'characters');
      }
      
    } else {
      console.log('\n❌ V6.0 Layout generation failed');
      console.log('❌ Error:', result.data.error);
      console.log('📝 Message:', result.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLayoutGeneration();
