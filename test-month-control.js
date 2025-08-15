// 🧪 Test per controllo aggiornamenti 1 mese
// Verifica che i siti non vengano aggiornati se modificati di recente

const DatabaseStorage = require('./src/storage/database-storage');

async function testMonthControl() {
  console.log('🧪 Testing month control functionality...');
  
  const storage = new DatabaseStorage();
  await storage.initialize();
  
  const testSites = [
    { url: 'https://test1.example.com', businessType: 'restaurant' },
    { url: 'https://test2.example.com', businessType: 'ecommerce' },
    { url: 'https://test3.example.com', businessType: 'services' }
  ];
  
  console.log('\n📋 Step 1: Check initial state');
  for (const site of testSites) {
    const sampleId = site.url.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const needsUpdate = await storage.needsUpdate(sampleId);
    console.log(`  ${site.url}: ${needsUpdate ? '✅ Needs update' : '⏸️ Recent'}`);
  }
  
  console.log('\n📋 Step 2: Save samples');
  for (const site of testSites) {
    const sampleId = site.url.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const sampleData = {
      url: site.url,
      businessType: site.businessType,
      html: '<html><body>Test content</body></html>',
      analysis: { confidence: 0.95 }
    };
    
    const result = await storage.saveSample(sampleId, sampleData);
    if (result.skipped) {
      console.log(`  ${site.url}: ⏸️ Skipped - ${result.reason}`);
    } else {
      console.log(`  ${site.url}: ✅ Saved`);
    }
  }
  
  console.log('\n📋 Step 3: Test filtering for batch training');
  const sitesForTraining = await storage.filterSitesForTraining(testSites);
  console.log(`  Filtered: ${sitesForTraining.length}/${testSites.length} sites need update`);
  
  console.log('\n📋 Step 4: Check again (should skip all recent)');
  for (const site of testSites) {
    const sampleId = site.url.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const result = await storage.saveSample(sampleId, {
      url: site.url,
      businessType: site.businessType,
      html: '<html><body>Updated content</body></html>',
      analysis: { confidence: 0.98 }
    });
    
    if (result.skipped) {
      console.log(`  ${site.url}: ⏸️ Correctly skipped - ${result.reason}`);
    } else {
      console.log(`  ${site.url}: ❌ Unexpected save!`);
    }
  }
  
  console.log('\n✅ Month control test completed!');
  
  await storage.pool.end();
}

// Run test
testMonthControl().catch(console.error);
