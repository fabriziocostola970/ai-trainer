// 🧪 Test V6.0 CSS Dinamico su Railway
const https = require('https');

const testData = JSON.stringify({
    businessType: "Fioraio a Roma",
    businessName: "Fioraio a Roma", 
    style: "elegant"
});

const options = {
    hostname: 'ai-trainer-production-8fd9.up.railway.app',
    port: 443,
    path: '/api/generate-layout',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ai-trainer-1e212623176704eea6dba3b62117d36c0f64d6512419defdd25226294c45a90d',
        'Content-Length': Buffer.byteLength(testData)
    }
};

console.log('🧪 Testing V6.0 CSS Dynamic System on Railway...');
console.log('📋 Request:', testData);

const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            console.log('\n=== 📋 RAW RESPONSE ===');
            console.log(data);
            console.log('======================\n');
            
            const response = JSON.parse(data);
            
            console.log('\n=== 🎨 V6.0 CSS DINAMICO TEST RESULTS ===');
            console.log('✅ Success:', response.success);
            
            if (!response.success) {
                console.log('❌ Error:', response.error);
                console.log('📝 Message:', response.message);
                return;
            }
            console.log('🏢 Business Type:', response.businessType);
            console.log('📊 Semantic Score:', response.semanticScore);
            
            // Test CSS dinamico
            const hasDynamicCSS = response.dynamicCSS && response.dynamicCSS.length > 0;
            console.log('🎨 CSS Dinamico Presente:', hasDynamicCSS ? '✅ SÌ' : '❌ NO');
            
            if (hasDynamicCSS) {
                console.log('📏 CSS Length:', response.dynamicCSS.length, 'characters');
                
                // Verifica colori specifici per fioraio
                const hasFloristColors = response.dynamicCSS.includes('#E91E63') || response.dynamicCSS.includes('#4CAF50');
                console.log('🌸 Colori Fioraio (Rosa/Verde):', hasFloristColors ? '✅ PRESENTI' : '❌ MANCANTI');
                
                // Verifica variabili CSS dinamiche
                const hasCSSVariables = response.dynamicCSS.includes('--primary') && response.dynamicCSS.includes('--secondary');
                console.log('🎯 Variabili CSS Dinamiche:', hasCSSVariables ? '✅ PRESENTI' : '❌ MANCANTI');
                
                // Mostra prima parte del CSS
                console.log('🎨 CSS Preview (primi 200 caratteri):', response.dynamicCSS.substring(0, 200) + '...');
            }
            
            // Test Design System
            const hasDesignSystem = response.designSystem && response.designSystem.palette;
            console.log('🎨 Design System Presente:', hasDesignSystem ? '✅ SÌ' : '❌ NO');
            
            if (hasDesignSystem) {
                console.log('🎨 Palette Primary:', response.designSystem.palette.primary);
                console.log('🎨 Palette Secondary:', response.designSystem.palette.secondary);
                console.log('📝 Typography Heading:', response.designSystem.typography?.heading);
            }
            
            // Test Layout dinamico
            const hasLayout = response.layout && response.layout.length > 0;
            console.log('🏗️ Layout Dinamico:', hasLayout ? '✅ SÌ' : '❌ NO');
            
            if (hasLayout) {
                console.log('📊 Sezioni Generate:', response.layout.length);
                console.log('🎨 Sezioni:', response.layout.map(block => block.type).join(', '));
            }
            
            console.log('\n=== 🚀 RISULTATO FINALE ===');
            const isFullyDynamic = hasDynamicCSS && hasDesignSystem && hasLayout;
            console.log('🏆 Sistema V6.0 100% Dinamico:', isFullyDynamic ? '✅ FUNZIONANTE' : '❌ PROBLEMI');
            
            if (isFullyDynamic) {
                console.log('🎉 IL SISTEMA V6.0 È COMPLETAMENTE DINAMICO!');
                console.log('🎨 CSS, Design System e Layout sono tutti generati dall\'AI!');
            } else {
                console.log('⚠️ Alcuni elementi potrebbero essere ancora hardcoded');
            }
            
        } catch (error) {
            console.error('❌ Error parsing response:', error.message);
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
});

req.write(testData);
req.end();
