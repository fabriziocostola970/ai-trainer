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
    console.log('🧪 Testing Layout Generation...\n');
    
    const testPayload = {
      businessType: 'services',  // Test con input generico 
      businessName: 'Fioraio Roma Center',
      description: 'fioraio a Roma',
      language: 'it'
    };
    
    console.log('📤 Request payload:', JSON.stringify(testPayload, null, 2));
    
    const result = await makeHttpsRequest(
      'https://ai-trainer-production-8fd9.up.railway.app/api/generate/layout',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ai-trainer-1e212623176704eea6dba3b62117d36c0f64d6512419defdd25226294c45a90d'
        }
      },
      JSON.stringify(testPayload)
    );
    
    console.log('\n📥 Response status:', result.status);
    console.log('📥 Response data:', JSON.stringify(result.data, null, 2));
    
    if (result.status === 200 && result.data.success) {
      console.log('\n✅ Layout generation successful!');
      console.log('🎯 Blocks generated:', result.data.layoutStructure?.blocks?.length || 0);
      console.log('🎨 Design system:', result.data.designSystem ? 'Applied' : 'Not applied');
      console.log('📊 Metadata:', result.data.metadata);
    } else {
      console.log('\n❌ Layout generation failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLayoutGeneration();
