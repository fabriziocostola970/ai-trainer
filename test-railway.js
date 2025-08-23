// Test rapido per AI-Trainer Railway service
const https = require('https');

function makeHttpsRequest(url, options = {}) {
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
    req.end();
  });
}

async function testRailwayService() {
  try {
    console.log('🧪 Testing AI-Trainer Railway Service...\n');
    
    // Test health check
    console.log('1. Testing health check...');
    const healthResult = await makeHttpsRequest('https://ai-trainer-production-8fd9.up.railway.app/health');
    console.log('✅ Health check:', healthResult.status, healthResult.data);
    
    // Test database
    console.log('\n2. Testing database...');
    const dbResult = await makeHttpsRequest('https://ai-trainer-production-8fd9.up.railway.app/debug/db');
    console.log('✅ Database check:', dbResult.status, dbResult.data);
    
    // Test business types
    console.log('\n3. Testing business types...');
    const businessResult = await makeHttpsRequest('https://ai-trainer-production-8fd9.up.railway.app/debug/business-types');
    console.log('✅ Business types:', businessResult.status, businessResult.data);
    
    console.log('\n🎯 Sistema Railway AI-Trainer funzionante!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRailwayService();
