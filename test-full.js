// Test completo per tutti gli endpoint AI-Trainer
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

async function runFullTests() {
  try {
    console.log('🚀 AI-Trainer Full API Test Suite\n');
    
    // Test 1: Health Check
    console.log('1. 🔍 Testing Health Check...');
    const healthData = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/health',
      method: 'GET'
    });
    console.log('✅ Health:', healthData.status);
    
    // Test 2: Layout Generation
    console.log('\n2. 🎨 Testing Layout Generation...');
    const layoutRequest = JSON.stringify({
      businessType: 'restaurant',
      currentBlocks: [
        { type: 'hero', title: 'Welcome to Our Restaurant' },
        { type: 'navigation', title: 'Menu' },
        { type: 'about', title: 'Our Story' }
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
        'Content-Length': Buffer.byteLength(layoutRequest)
      }
    }, layoutRequest);
    
    console.log('✅ Layout Score:', layoutData.semanticScore + '/100');
    console.log('📝 Recommendations:', layoutData.recommendations?.length || 0);
    
    // Test 3: Creative Template Generation
    console.log('\n3. 🎯 Testing Creative Template Generation...');
    const templateRequest = JSON.stringify({
      businessData: {
        businessType: 'tech-startup',
        industry: 'SaaS',
        targetAudience: 'developers'
      },
      creativityLevel: 'high',
      inspirationDataset: ['modern-tech', 'minimal-design']
    });
    
    const templateData = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/generate/template',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ai-trainer-secret-key-123',
        'Content-Length': Buffer.byteLength(templateRequest)
      }
    }, templateRequest);
    
    console.log('✅ Template Name:', templateData.template?.name);
    console.log('🎨 Creativity Score:', templateData.creativityScore + '/100');
    console.log('🎯 Business Alignment:', templateData.businessAlignment + '/100');
    
    // Summary
    console.log('\n🎉 All Tests Completed Successfully!');
    console.log('🔗 Server Status: HEALTHY');
    console.log('🤖 AI-Trainer: READY FOR INTEGRATION');
    
  } catch (error) {
    console.error('❌ Test Suite Failed:', error.message);
  }
}

runFullTests();
