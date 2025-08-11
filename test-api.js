// Test script per AI-Trainer API
const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
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

async function testAPI() {
  try {
    console.log('🧪 Testing AI-Trainer API...\n');
    
    // Test health check
    console.log('1. Testing health check...');
    const healthData = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/health',
      method: 'GET'
    });
    console.log('✅ Health check:', healthData);
    
    // Test layout generation
    console.log('\n2. Testing layout generation...');
    const postData = JSON.stringify({
      businessType: 'restaurant',
      currentBlocks: [
        { type: 'hero', title: 'Welcome' },
        { type: 'navigation', title: 'Menu' }
      ],
      preferences: { style: 'modern' }
    });
    
    const layoutData = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/generate/layout',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ai-trainer-secret-key-123',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);
    
    console.log('✅ Layout generation:', JSON.stringify(layoutData, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();
