/**
 * 🎨 Design Analyzer API
 * Analizza siti web per estrarre CSS, colori, font e pattern di design
 */

const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');

class DesignAnalyzer {
    constructor() {
        this.dataDir = path.join(__dirname, '../../data');
        this.designPatternsDir = path.join(this.dataDir, 'design-patterns');
        this.cssLibraryDir = path.join(this.dataDir, 'css-library');
    }

    /**
     * Analizza un sito web per estrarre dati di design
     */
    async analyzeWebsiteDesign(url, options = {}) {
        console.log(`🎨 Starting design analysis for: ${url}`);
        
        let browser;
        try {
            browser = await puppeteer.launch({ 
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });
            
            // Blocca le risorse non necessarie per velocizzare
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const resourceType = req.resourceType();
                if (['image', 'media', 'font'].includes(resourceType)) {
                    req.abort();
                } else {
                    req.continue();
                }
            });
            
            await page.goto(url, { 
                waitUntil: 'networkidle0',
                timeout: 30000 
            });
            
            // Estrai dati di design
            const designData = await page.evaluate(() => {
                const data = {
                    colors: [],
                    fonts: [],
                    cssRules: [],
                    layout: {},
                    patterns: []
                };
                
                // 🌈 ESTRAZIONE COLORI
                const extractColors = () => {
                    const colors = new Set();
                    const elements = document.querySelectorAll('*');
                    
                    elements.forEach(el => {
                        const styles = window.getComputedStyle(el);
                        
                        // Colori di testo
                        const color = styles.color;
                        if (color && color !== 'rgba(0, 0, 0, 0)') {
                            colors.add(color);
                        }
                        
                        // Colori di background
                        const bgColor = styles.backgroundColor;
                        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
                            colors.add(bgColor);
                        }
                        
                        // Colori di border
                        const borderColor = styles.borderColor;
                        if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)') {
                            colors.add(borderColor);
                        }
                    });
                    
                    return Array.from(colors).slice(0, 20); // Limit to top 20 colors
                };
                
                // 📝 ESTRAZIONE FONT
                const extractFonts = () => {
                    const fonts = new Set();
                    const elements = document.querySelectorAll('*');
                    
                    elements.forEach(el => {
                        const styles = window.getComputedStyle(el);
                        const fontFamily = styles.fontFamily;
                        const fontSize = styles.fontSize;
                        const fontWeight = styles.fontWeight;
                        
                        if (fontFamily) {
                            fonts.add({
                                family: fontFamily,
                                size: fontSize,
                                weight: fontWeight,
                                element: el.tagName.toLowerCase()
                            });
                        }
                    });
                    
                    return Array.from(fonts).slice(0, 15);
                };
                
                // 🔧 ESTRAZIONE CSS RULES
                const extractCSSRules = () => {
                    const rules = [];
                    
                    for (let i = 0; i < document.styleSheets.length; i++) {
                        try {
                            const sheet = document.styleSheets[i];
                            const cssRules = sheet.cssRules || sheet.rules;
                            
                            for (let j = 0; j < Math.min(cssRules.length, 50); j++) {
                                const rule = cssRules[j];
                                if (rule.type === CSSRule.STYLE_RULE) {
                                    rules.push({
                                        selector: rule.selectorText,
                                        cssText: rule.style.cssText,
                                        properties: Array.from(rule.style).map(prop => ({
                                            property: prop,
                                            value: rule.style.getPropertyValue(prop)
                                        }))
                                    });
                                }
                            }
                        } catch (e) {
                            // Skip inaccessible stylesheets
                        }
                    }
                    
                    return rules;
                };
                
                // 📐 ANALISI LAYOUT
                const analyzeLayout = () => {
                    const layout = {
                        sections: [],
                        navigation: null,
                        hero: null,
                        footer: null,
                        sidebar: null
                    };
                    
                    // Identifica sezioni principali
                    const mainElements = document.querySelectorAll('header, nav, main, section, aside, footer, .hero, .header');
                    mainElements.forEach(el => {
                        const rect = el.getBoundingClientRect();
                        layout.sections.push({
                            tag: el.tagName.toLowerCase(),
                            className: el.className,
                            width: rect.width,
                            height: rect.height,
                            top: rect.top
                        });
                    });
                    
                    return layout;
                };
                
                // 🎨 PATTERN RECOGNITION
                const identifyPatterns = () => {
                    const patterns = [];
                    
                    // Card patterns
                    const cards = document.querySelectorAll('.card, [class*="card"], .product, [class*="item"]');
                    if (cards.length > 2) {
                        patterns.push({
                            type: 'card-grid',
                            count: cards.length,
                            description: 'Card-based layout pattern'
                        });
                    }
                    
                    // Navigation patterns
                    const navs = document.querySelectorAll('nav, .nav, .menu, .navigation');
                    navs.forEach(nav => {
                        const navItems = nav.querySelectorAll('a, li');
                        if (navItems.length > 2) {
                            patterns.push({
                                type: 'navigation',
                                itemCount: navItems.length,
                                description: 'Navigation menu pattern'
                            });
                        }
                    });
                    
                    // Grid patterns
                    const grids = document.querySelectorAll('[class*="grid"], [class*="flex"], .row, .columns');
                    if (grids.length > 0) {
                        patterns.push({
                            type: 'grid-layout',
                            count: grids.length,
                            description: 'Grid-based layout system'
                        });
                    }
                    
                    return patterns;
                };
                
                // Esegui tutte le analisi
                data.colors = extractColors();
                data.fonts = extractFonts();
                data.cssRules = extractCSSRules();
                data.layout = analyzeLayout();
                data.patterns = identifyPatterns();
                
                return data;
            });
            
            // Aggiungi metadata
            designData.metadata = {
                url: url,
                title: await page.title(),
                timestamp: new Date().toISOString(),
                viewport: { width: 1920, height: 1080 }
            };
            
            console.log(`✅ Design analysis completed for ${url}`);
            console.log(`   🌈 Colors: ${designData.colors.length}`);
            console.log(`   📝 Fonts: ${designData.fonts.length}`);
            console.log(`   🔧 CSS Rules: ${designData.cssRules.length}`);
            console.log(`   🎨 Patterns: ${designData.patterns.length}`);
            
            return designData;
            
        } catch (error) {
            console.error(`❌ Design analysis failed for ${url}:`, error);
            throw error;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    /**
     * Salva i dati di design estratti
     */
    async saveDesignData(url, businessType, designData) {
        try {
            const filename = `design_${Date.now()}_${businessType}.json`;
            const filepath = path.join(this.designPatternsDir, filename);
            
            const dataToSave = {
                url,
                businessType,
                designData,
                savedAt: new Date().toISOString()
            };
            
            await fs.writeFile(filepath, JSON.stringify(dataToSave, null, 2));
            
            console.log(`💾 Design data saved: ${filename}`);
            return { success: true, savedId: filename };
            
        } catch (error) {
            console.error(`❌ Failed to save design data:`, error);
            throw error;
        }
    }

    /**
     * Analizza tutti i colori salvati per trovare palette popolari
     */
    async analyzeColorPalettes() {
        try {
            const files = await fs.readdir(this.designPatternsDir);
            const colorMap = new Map();
            const businessTypeColors = {};
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filepath = path.join(this.designPatternsDir, file);
                    const data = JSON.parse(await fs.readFile(filepath, 'utf8'));
                    
                    const businessType = data.businessType;
                    if (!businessTypeColors[businessType]) {
                        businessTypeColors[businessType] = [];
                    }
                    
                    // Analizza colori
                    data.designData.colors.forEach(color => {
                        colorMap.set(color, (colorMap.get(color) || 0) + 1);
                        businessTypeColors[businessType].push(color);
                    });
                }
            }
            
            // Trova colori più popolari
            const popularColors = Array.from(colorMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
                .map(([color]) => color);
            
            // Genera armonie cromatiche
            const colorHarmonies = this.generateColorHarmonies(popularColors);
            
            return {
                success: true,
                popularColors,
                colorHarmonies,
                businessTypeColors: Object.fromEntries(
                    Object.entries(businessTypeColors).map(([type, colors]) => [
                        type, [...new Set(colors)].slice(0, 10)
                    ])
                )
            };
            
        } catch (error) {
            console.error(`❌ Color analysis failed:`, error);
            throw error;
        }
    }

    /**
     * Analizza combinazioni di font
     */
    async analyzeFontCombinations() {
        try {
            const files = await fs.readdir(this.designPatternsDir);
            const fontMap = new Map();
            const fontPairings = [];
            const businessTypeFonts = {};
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filepath = path.join(this.designPatternsDir, file);
                    const data = JSON.parse(await fs.readFile(filepath, 'utf8'));
                    
                    const businessType = data.businessType;
                    if (!businessTypeFonts[businessType]) {
                        businessTypeFonts[businessType] = [];
                    }
                    
                    // Analizza font
                    data.designData.fonts.forEach(font => {
                        const fontKey = font.family || 'Unknown';
                        fontMap.set(fontKey, (fontMap.get(fontKey) || 0) + 1);
                        businessTypeFonts[businessType].push(fontKey);
                    });
                }
            }
            
            // Font più popolari
            const popularFonts = Array.from(fontMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 15)
                .map(([font]) => font);
            
            // Genera combinazioni di font
            for (let i = 0; i < popularFonts.length - 1; i++) {
                for (let j = i + 1; j < popularFonts.length; j++) {
                    fontPairings.push({
                        header: popularFonts[i],
                        body: popularFonts[j],
                        score: Math.random() * 100 // Placeholder score
                    });
                }
            }
            
            return {
                success: true,
                popularFonts,
                fontPairings: fontPairings.slice(0, 10),
                businessTypeFonts: Object.fromEntries(
                    Object.entries(businessTypeFonts).map(([type, fonts]) => [
                        type, [...new Set(fonts)].slice(0, 5)
                    ])
                )
            };
            
        } catch (error) {
            console.error(`❌ Font analysis failed:`, error);
            throw error;
        }
    }

    /**
     * Genera CSS migliorato basato sui dati analizzati
     */
    async generateImprovedCSS() {
        try {
            const colorAnalysis = await this.analyzeColorPalettes();
            const fontAnalysis = await this.analyzeFontCombinations();
            
            // Genera CSS temi
            const themes = this.generateCSSThemes(colorAnalysis, fontAnalysis);
            
            // Salva CSS files
            const cssFiles = [];
            for (const [themeName, css] of Object.entries(themes)) {
                const filename = `theme_${themeName}.css`;
                const filepath = path.join(this.cssLibraryDir, filename);
                await fs.writeFile(filepath, css);
                cssFiles.push(filename);
            }
            
            // Genera CSS per layout responsivi
            const responsiveCSS = this.generateResponsivePatterns();
            const responsiveFilename = 'responsive_patterns.css';
            await fs.writeFile(
                path.join(this.cssLibraryDir, responsiveFilename), 
                responsiveCSS
            );
            cssFiles.push(responsiveFilename);
            
            return {
                success: true,
                cssFiles,
                colorPalettes: Object.keys(themes),
                typography: fontAnalysis.fontPairings.length,
                layouts: 1
            };
            
        } catch (error) {
            console.error(`❌ CSS generation failed:`, error);
            throw error;
        }
    }

    /**
     * Genera temi CSS basati sui colori e font analizzati
     */
    generateCSSThemes(colorAnalysis, fontAnalysis) {
        const themes = {};
        
        // Tema "Modern" basato sui colori più popolari
        if (colorAnalysis.popularColors.length >= 3) {
            const primaryColor = colorAnalysis.popularColors[0];
            const secondaryColor = colorAnalysis.popularColors[1];
            const accentColor = colorAnalysis.popularColors[2];
            
            themes.modern = `
/* 🎨 Modern Theme - AI Generated from Popular Sites */
:root {
    --primary-color: ${primaryColor};
    --secondary-color: ${secondaryColor};
    --accent-color: ${accentColor};
    --text-color: #333333;
    --bg-color: #ffffff;
    --border-radius: 8px;
    --shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.modern-theme {
    font-family: ${fontAnalysis.popularFonts[0] || 'Arial, sans-serif'};
    line-height: 1.6;
    color: var(--text-color);
}

.modern-theme .hero {
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: white;
    padding: 4rem 2rem;
    text-align: center;
    border-radius: var(--border-radius);
}

.modern-theme .card {
    background: var(--bg-color);
    padding: 2rem;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
    margin-bottom: 2rem;
    transition: transform 0.3s ease;
}

.modern-theme .card:hover {
    transform: translateY(-5px);
}

.modern-theme .btn {
    background: var(--accent-color);
    color: white;
    padding: 1rem 2rem;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all 0.3s ease;
}

.modern-theme .btn:hover {
    opacity: 0.9;
    transform: translateY(-2px);
}
`;
        }
        
        // Tema "Business" per business types specifici
        if (colorAnalysis.businessTypeColors.restaurant) {
            const restaurantColors = colorAnalysis.businessTypeColors.restaurant;
            themes.restaurant = `
/* 🍕 Restaurant Theme - AI Learned from Restaurant Sites */
:root {
    --restaurant-primary: ${restaurantColors[0] || '#d32f2f'};
    --restaurant-secondary: ${restaurantColors[1] || '#ff6b35'};
    --restaurant-accent: ${restaurantColors[2] || '#ffc107'};
}

.restaurant-theme {
    font-family: ${fontAnalysis.businessTypeFonts?.restaurant?.[0] || 'Georgia, serif'};
}

.restaurant-theme .menu-card {
    background: linear-gradient(45deg, var(--restaurant-primary), var(--restaurant-secondary));
    color: white;
    padding: 2rem;
    border-radius: 12px;
    margin: 1rem 0;
}

.restaurant-theme .price {
    color: var(--restaurant-accent);
    font-weight: bold;
    font-size: 1.2rem;
}
`;
        }
        
        return themes;
    }

    /**
     * Genera pattern CSS responsivi
     */
    generateResponsivePatterns() {
        return `
/* 📐 Responsive Patterns - AI Generated */

/* Grid System */
.ai-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    padding: 2rem;
}

.ai-grid-dense {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
}

/* Flexbox Patterns */
.ai-flex-center {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
}

.ai-flex-space-between {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* Mobile-First Responsive */
@media (max-width: 768px) {
    .ai-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
        padding: 1rem;
    }
    
    .ai-mobile-stack {
        flex-direction: column;
    }
}

/* AI-Generated Animations */
.ai-fade-in {
    animation: aiSlideIn 0.6s ease-out;
}

@keyframes aiSlideIn {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Modern Card Pattern */
.ai-modern-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    padding: 2rem;
    transition: all 0.3s ease;
    border: 1px solid rgba(0,0,0,0.05);
}

.ai-modern-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}
`;
    }

    /**
     * Genera armonie cromatiche
     */
    generateColorHarmonies(colors) {
        // Placeholder implementation
        const harmonies = [];
        
        for (let i = 0; i < Math.min(colors.length, 5); i++) {
            harmonies.push({
                primary: colors[i],
                secondary: colors[(i + 1) % colors.length],
                accent: colors[(i + 2) % colors.length],
                type: 'triadic'
            });
        }
        
        return harmonies;
    }
}

module.exports = DesignAnalyzer;
