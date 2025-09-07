/**
 * 🧪 TEST IMAGE DOWNLOAD SERVICE
 * Testa il nuovo sistema di download e storage locale delle immagini
 */

const ImageDownloadService = require('./src/services/image-download-service');
const UnifiedImageService = require('./src/services/unified-image-service');

async function testImageDownloadSystem() {
    console.log('🚀 TESTING IMAGE DOWNLOAD SYSTEM');
    console.log('================================');

    try {
        // Test 1: Download Service Basic
        console.log('\n📥 TEST 1: Basic Download Service');
        const downloadService = new ImageDownloadService();
        
        // Test download di una singola immagine
        const testUrl = 'https://images.pexels.com/photos/3184416/pexels-photo-3184416.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
        console.log('Testing single image download...');
        
        const singleResult = await downloadService.downloadImage(testUrl, 'ristorante', 'hero');
        console.log('Single download result:', {
            success: singleResult.success,
            fileName: singleResult.fileName,
            url: singleResult.url,
            size: singleResult.size
        });

        // Test 2: Unified Service con Download
        console.log('\n🔄 TEST 2: Unified Service with Local Storage');
        
        const businessImages = await UnifiedImageService.getBusinessImages('ristorante', 'Nonna Maria', 4);
        
        console.log('Business images result:', {
            source: businessImages.source,
            total: businessImages.total,
            useLocal: businessImages.useLocal,
            localImagesCount: businessImages.localImages ? 
                (businessImages.localImages.hero.length + 
                 businessImages.localImages.services.length + 
                 businessImages.localImages.backgrounds.length) : 0
        });

        if (businessImages.useLocal && businessImages.localImages) {
            console.log('\n📂 Local Images URLs:');
            console.log('Hero:', businessImages.localImages.hero.map(img => img.url));
            console.log('Services:', businessImages.localImages.services.map(img => img.url));
            console.log('Backgrounds:', businessImages.localImages.backgrounds.map(img => img.url));
        }

        // Test 3: Storage Stats
        console.log('\n📊 TEST 3: Storage Statistics');
        const stats = await UnifiedImageService.getStorageStats();
        console.log('Storage stats:', stats);

        // Test 4: URL Helper
        console.log('\n🔗 TEST 4: Image URL Helper');
        const imageUrls = UnifiedImageService.getImageUrls(businessImages);
        console.log('All image URLs:', imageUrls);

        console.log('\n✅ All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Run tests
if (require.main === module) {
    testImageDownloadSystem();
}

module.exports = testImageDownloadSystem;
