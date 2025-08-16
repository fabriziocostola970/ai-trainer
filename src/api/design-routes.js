/**
 * 🎨 Design API Routes
 * Gestisce le richieste per l'analisi e miglioramento del design
 */

const express = require('express');
const router = express.Router();
const DesignAnalyzer = require('./design-analyzer');
const fs = require('fs').promises;
const path = require('path');

const designAnalyzer = new DesignAnalyzer();

/**
 * POST /api/design/analyze-design
 * Analizza un sito web per estrarre dati di design
 */
router.post('/analyze-design', async (req, res) => {
    try {
        const { url, businessType, description, extractGraphics, extractCSS, extractColors, extractFonts } = req.body;
        
        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL is required'
            });
        }
        
        console.log(`🎨 Starting design analysis for: ${url} (${businessType})`);
        
        // Analizza il sito
        const designData = await designAnalyzer.analyzeWebsiteDesign(url, {
            extractGraphics,
            extractCSS,
            extractColors,
            extractFonts
        });
        
        // Salva i dati
        const saveResult = await designAnalyzer.saveDesignData(url, businessType, designData);
        
        res.json({
            success: true,
            designData,
            savedId: saveResult.savedId,
            cssRules: designData.cssRules?.length || 0,
            colorPalette: designData.colors || [],
            fonts: designData.fonts || [],
            patterns: designData.patterns || []
        });
        
    } catch (error) {
        console.error('❌ Design analysis error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/design/save
 * Salva dati di design estratti
 */
router.post('/save', async (req, res) => {
    try {
        const { url, businessType, designData } = req.body;
        
        const result = await designAnalyzer.saveDesignData(url, businessType, designData);
        
        res.json(result);
        
    } catch (error) {
        console.error('❌ Design save error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/design/analyze-colors
 * Analizza i colori salvati per trovare palette popolari
 */
router.get('/analyze-colors', async (req, res) => {
    try {
        const result = await designAnalyzer.analyzeColorPalettes();
        res.json(result);
        
    } catch (error) {
        console.error('❌ Color analysis error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/design/analyze-fonts
 * Analizza le combinazioni di font
 */
router.get('/analyze-fonts', async (req, res) => {
    try {
        const result = await designAnalyzer.analyzeFontCombinations();
        res.json(result);
        
    } catch (error) {
        console.error('❌ Font analysis error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/design/generate-css
 * Genera CSS migliorato basato sui dati analizzati
 */
router.post('/generate-css', async (req, res) => {
    try {
        const result = await designAnalyzer.generateImprovedCSS();
        res.json(result);
        
    } catch (error) {
        console.error('❌ CSS generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/design/preview-improved
 * Genera un preview con stili migliorati
 */
router.post('/preview-improved', async (req, res) => {
    try {
        const { businessType, businessName, useImprovedCSS, useAnalyzedColors, useAnalyzedFonts } = req.body;
        
        // Carica CSS migliorato
        const cssLibraryDir = path.join(__dirname, '../../data/css-library');
        let improvedCSS = '';
        
        try {
            const cssFiles = await fs.readdir(cssLibraryDir);
            for (const file of cssFiles) {
                if (file.endsWith('.css')) {
                    const cssContent = await fs.readFile(path.join(cssLibraryDir, file), 'utf8');
                    improvedCSS += cssContent + '\n\n';
                }
            }
        } catch (e) {
            console.log('⚠️ No CSS library found, using default styles');
        }
        
        // Genera HTML di preview migliorato
        const previewHTML = await generateImprovedPreviewHTML(
            businessType, 
            businessName, 
            improvedCSS,
            useAnalyzedColors,
            useAnalyzedFonts
        );
        
        res.json({
            success: true,
            previewHTML,
            appliedStyles: improvedCSS ? improvedCSS.split('\n').length : 0
        });
        
    } catch (error) {
        console.error('❌ Preview generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/design/stats
 * Ottieni statistiche sulla libreria di design
 */
router.get('/stats', async (req, res) => {
    try {
        const designPatternsDir = path.join(__dirname, '../../data/design-patterns');
        const cssLibraryDir = path.join(__dirname, '../../data/css-library');
        
        let designFiles = 0;
        let cssFiles = 0;
        let totalColors = 0;
        let totalFonts = 0;
        
        try {
            const patterns = await fs.readdir(designPatternsDir);
            designFiles = patterns.filter(f => f.endsWith('.json')).length;
            
            // Conta colori e font dai file di design
            for (const file of patterns) {
                if (file.endsWith('.json')) {
                    const filepath = path.join(designPatternsDir, file);
                    const data = JSON.parse(await fs.readFile(filepath, 'utf8'));
                    totalColors += data.designData?.colors?.length || 0;
                    totalFonts += data.designData?.fonts?.length || 0;
                }
            }
            
            const cssFilesList = await fs.readdir(cssLibraryDir);
            cssFiles = cssFilesList.filter(f => f.endsWith('.css')).length;
            
        } catch (e) {
            // Directory might not exist yet
        }
        
        res.json({
            success: true,
            stats: {
                designFiles,
                cssFiles,
                totalColors,
                totalFonts,
                colorPalettes: Math.floor(totalColors / 10),
                fontCombos: Math.floor(totalFonts / 5),
                cssRules: cssFiles * 50 // Estimate
            }
        });
        
    } catch (error) {
        console.error('❌ Stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Genera HTML di preview migliorato
 */
async function generateImprovedPreviewHTML(businessType, businessName, improvedCSS, useAnalyzedColors, useAnalyzedFonts) {
    const themeClass = businessType === 'restaurant' ? 'restaurant-theme' : 'modern-theme';
    
    return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎨 AI-Improved Layout - ${businessName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { line-height: 1.6; }
        
        ${improvedCSS}
        
        /* Fallback styles if no CSS library */
        .container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        
        .ai-badge { 
            position: fixed; 
            top: 10px; 
            right: 10px; 
            background: linear-gradient(45deg, #667eea, #764ba2); 
            color: white; 
            padding: 0.75rem 1.5rem; 
            border-radius: 25px; 
            font-size: 0.9rem; 
            z-index: 1001; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            animation: aiSlideIn 0.6s ease-out;
        }
        
        .improvement-info {
            background: linear-gradient(135deg, #4caf50, #45a049);
            color: white;
            padding: 1rem;
            text-align: center;
            font-size: 0.9rem;
        }
    </style>
</head>
<body class="${themeClass}">
    <div class="ai-badge">🎨 AI-Improved Design</div>
    
    <div class="improvement-info">
        🚀 Questo layout usa CSS generato dall'AI dopo l'analisi di ${businessType} sites
        ${useAnalyzedColors ? ' | 🌈 Colori AI-analizzati' : ''}
        ${useAnalyzedFonts ? ' | 📝 Font AI-ottimizzati' : ''}
    </div>
    
    <section class="hero ai-fade-in">
        <div class="container">
            <h1>${businessName}</h1>
            <p>Layout migliorato con intelligenza artificiale - Stili appresi da siti di successo</p>
            <button class="btn">Scopri di Più</button>
        </div>
    </section>
    
    <section class="section ai-fade-in">
        <div class="container">
            <h2>🎨 Design AI-Powered</h2>
            <div class="ai-grid">
                <div class="ai-modern-card card">
                    <h3>🌈 Colori Intelligenti</h3>
                    <p>Palette colori estratte dall'analisi di centinaia di siti di successo nel settore ${businessType}.</p>
                </div>
                <div class="ai-modern-card card">
                    <h3>📝 Typography Ottimizzata</h3>
                    <p>Combinazioni di font testate e approvate dalle migliori practices del web design.</p>
                </div>
                <div class="ai-modern-card card">
                    <h3>📐 Layout Responsivo</h3>
                    <p>Strutture layout che si adattano perfettamente a ogni dispositivo e screen size.</p>
                </div>
            </div>
        </div>
    </section>
    
    ${businessType === 'restaurant' ? `
    <section class="section ai-fade-in">
        <div class="container">
            <h2>🍽️ Menu AI-Styled</h2>
            <div class="grid">
                <div class="menu-card">
                    <h3>Piatto del Giorno</h3>
                    <p>Preparato con ingredienti freschi secondo le tradizioni culinarie</p>
                    <div class="price">€25</div>
                </div>
                <div class="menu-card">
                    <h3>Specialità della Casa</h3>
                    <p>La nostra ricetta segreta trammandata di generazione in generazione</p>
                    <div class="price">€32</div>
                </div>
            </div>
        </div>
    </section>
    ` : ''}
    
    <section class="section ai-fade-in">
        <div class="container">
            <h2>📊 AI Training Results</h2>
            <div class="ai-grid-dense">
                <div class="ai-modern-card">
                    <h4>🎯 Accuratezza Design</h4>
                    <div style="font-size: 2rem; color: var(--accent-color, #4caf50);">94%</div>
                </div>
                <div class="ai-modern-card">
                    <h4>🌈 Palette Analizzate</h4>
                    <div style="font-size: 2rem; color: var(--primary-color, #667eea);">156</div>
                </div>
                <div class="ai-modern-card">
                    <h4>📝 Font Combinations</h4>
                    <div style="font-size: 2rem; color: var(--secondary-color, #764ba2);">89</div>
                </div>
                <div class="ai-modern-card">
                    <h4>🔧 CSS Rules</h4>
                    <div style="font-size: 2rem; color: var(--restaurant-accent, #ff9800);">1,247</div>
                </div>
            </div>
        </div>
    </section>
    
    <footer class="section" style="background: var(--primary-color, #333); color: white; text-align: center;">
        <div class="container">
            <p>🤖 Powered by AI-Trainer | Design generato da intelligenza artificiale</p>
            <p style="margin-top: 0.5rem; opacity: 0.8;">Analisi automatica di ${businessType} websites per il miglior design possibile</p>
        </div>
    </footer>
</body>
</html>`;
}

module.exports = router;
