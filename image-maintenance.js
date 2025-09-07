/**
 * 🛠️ IMAGE MAINTENANCE SCRIPT
 * Script per gestire e mantenere le immagini locali
 */

const fs = require('fs').promises;
const path = require('path');
const UnifiedImageService = require('./src/services/unified-image-service');

class ImageMaintenanceScript {
    constructor() {
        this.imagesDir = path.join(process.cwd(), 'uploads', 'images', 'business');
    }

    /**
     * 📊 Mostra statistiche dettagliate
     */
    async showDetailedStats() {
        try {
            console.log('📊 STATISTICHE IMMAGINI DETTAGLIATE');
            console.log('=====================================\n');

            const stats = await UnifiedImageService.getStorageStats();
            console.log(`📁 Directory: ${stats.directory}`);
            console.log(`📈 Totale file: ${stats.totalFiles}`);
            console.log(`💾 Spazio occupato: ${stats.totalSizeMB} MB\n`);

            // Analisi per business type
            const files = await fs.readdir(this.imagesDir);
            const businessTypes = {};

            for (const file of files) {
                const businessType = file.split('_')[0];
                if (!businessTypes[businessType]) {
                    businessTypes[businessType] = {
                        count: 0,
                        size: 0,
                        categories: {}
                    };
                }

                const filePath = path.join(this.imagesDir, file);
                const fileStats = await fs.stat(filePath);
                businessTypes[businessType].count++;
                businessTypes[businessType].size += fileStats.size;

                // Analizza categoria
                const parts = file.split('_');
                if (parts.length > 1) {
                    const category = parts[1];
                    businessTypes[businessType].categories[category] = 
                        (businessTypes[businessType].categories[category] || 0) + 1;
                }
            }

            console.log('📈 ANALISI PER BUSINESS TYPE:');
            for (const [type, data] of Object.entries(businessTypes)) {
                const sizeMB = (data.size / 1024 / 1024).toFixed(2);
                console.log(`\n🏢 ${type}:`);
                console.log(`   📸 File: ${data.count}`);
                console.log(`   💾 Spazio: ${sizeMB} MB`);
                console.log(`   📂 Categorie:`, data.categories);
            }

        } catch (error) {
            console.error('❌ Errore statistiche:', error);
        }
    }

    /**
     * 🧹 Pulizia avanzata con opzioni
     */
    async advancedCleanup(options = {}) {
        const {
            maxAgeHours = 24,
            keepMinFiles = 5,
            dryRun = false
        } = options;

        try {
            console.log('🧹 PULIZIA AVANZATA IMMAGINI');
            console.log('=============================\n');
            console.log(`⏰ Età massima: ${maxAgeHours} ore`);
            console.log(`📌 File minimi da mantenere: ${keepMinFiles}`);
            console.log(`🔍 Modalità: ${dryRun ? 'SIMULAZIONE' : 'EFFETTIVA'}\n`);

            const files = await fs.readdir(this.imagesDir);
            const now = Date.now();
            let deletedCount = 0;
            let savedSpace = 0;

            // Raggruppa per business type
            const businessGroups = {};
            for (const file of files) {
                const businessType = file.split('_')[0];
                if (!businessGroups[businessType]) {
                    businessGroups[businessType] = [];
                }
                
                const filePath = path.join(this.imagesDir, file);
                const stats = await fs.stat(filePath);
                businessGroups[businessType].push({
                    file,
                    filePath,
                    mtime: stats.mtime.getTime(),
                    size: stats.size
                });
            }

            // Pulizia per ogni business type
            for (const [businessType, fileList] of Object.entries(businessGroups)) {
                console.log(`🏢 Processando ${businessType}:`);

                // Ordina per data (più vecchi prima)
                fileList.sort((a, b) => a.mtime - b.mtime);

                for (let i = 0; i < fileList.length; i++) {
                    const fileData = fileList[i];
                    const ageHours = (now - fileData.mtime) / (1000 * 60 * 60);
                    const remainingFiles = fileList.length - deletedCount;

                    // Criteri di eliminazione
                    const tooOld = ageHours > maxAgeHours;
                    const canDelete = remainingFiles > keepMinFiles;

                    if (tooOld && canDelete) {
                        if (!dryRun) {
                            await fs.unlink(fileData.filePath);
                        }
                        
                        deletedCount++;
                        savedSpace += fileData.size;
                        
                        console.log(`   🗑️  ${dryRun ? '[SIMULA]' : ''} Eliminato: ${fileData.file} (${ageHours.toFixed(1)}h)`);
                    }
                }
            }

            const savedSpaceMB = (savedSpace / 1024 / 1024).toFixed(2);
            console.log(`\n✅ Pulizia completata:`);
            console.log(`   🗑️  File eliminati: ${deletedCount}`);
            console.log(`   💾 Spazio liberato: ${savedSpaceMB} MB`);

            if (dryRun) {
                console.log('\n⚠️  Questa era una SIMULAZIONE. Nessun file è stato effettivamente eliminato.');
                console.log('   Rimuovi --dry-run per eseguire la pulizia reale.');
            }

        } catch (error) {
            console.error('❌ Errore pulizia:', error);
        }
    }

    /**
     * 🔍 Verifica integrità immagini
     */
    async verifyImageIntegrity() {
        try {
            console.log('🔍 VERIFICA INTEGRITÀ IMMAGINI');
            console.log('===============================\n');

            const files = await fs.readdir(this.imagesDir);
            let corruptedCount = 0;
            let checkedCount = 0;

            for (const file of files) {
                const filePath = path.join(this.imagesDir, file);
                
                try {
                    const stats = await fs.stat(filePath);
                    
                    // Verifica dimensione minima (immagini troppo piccole potrebbero essere corrotte)
                    if (stats.size < 1024) { // 1KB
                        console.log(`⚠️  File sospetto (troppo piccolo): ${file} (${stats.size} bytes)`);
                        corruptedCount++;
                    }

                    checkedCount++;
                    
                    if (checkedCount % 10 === 0) {
                        console.log(`✅ Verificati ${checkedCount}/${files.length} file...`);
                    }

                } catch (error) {
                    console.log(`❌ Errore verifica ${file}: ${error.message}`);
                    corruptedCount++;
                }
            }

            console.log(`\n📊 Verifica completata:`);
            console.log(`   ✅ File verificati: ${checkedCount}`);
            console.log(`   ⚠️  File problematici: ${corruptedCount}`);

        } catch (error) {
            console.error('❌ Errore verifica:', error);
        }
    }
}

// CLI Interface
async function main() {
    const maintenance = new ImageMaintenanceScript();
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'stats':
            await maintenance.showDetailedStats();
            break;

        case 'cleanup':
            const maxAge = parseInt(args.find(arg => arg.startsWith('--max-age='))?.split('=')[1]) || 24;
            const keepMin = parseInt(args.find(arg => arg.startsWith('--keep-min='))?.split('=')[1]) || 5;
            const dryRun = args.includes('--dry-run');

            await maintenance.advancedCleanup({
                maxAgeHours: maxAge,
                keepMinFiles: keepMin,
                dryRun
            });
            break;

        case 'verify':
            await maintenance.verifyImageIntegrity();
            break;

        default:
            console.log('🛠️  IMAGE MAINTENANCE SCRIPT');
            console.log('============================\n');
            console.log('Comandi disponibili:');
            console.log('  stats                     - Mostra statistiche dettagliate');
            console.log('  cleanup [opzioni]         - Pulizia immagini');
            console.log('  verify                    - Verifica integrità\n');
            console.log('Opzioni cleanup:');
            console.log('  --max-age=<ore>          - Età massima file (default: 24)');
            console.log('  --keep-min=<numero>      - File minimi da mantenere (default: 5)');
            console.log('  --dry-run                - Simula senza eliminare\n');
            console.log('Esempi:');
            console.log('  node image-maintenance.js stats');
            console.log('  node image-maintenance.js cleanup --max-age=48 --dry-run');
            console.log('  node image-maintenance.js verify');
    }
}

if (require.main === module) {
    main();
}

module.exports = ImageMaintenanceScript;
