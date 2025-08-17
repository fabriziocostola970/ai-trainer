/**
 * 🧠 Design Intelligence System
 * Utilizza i dati estratti (CSS, colori, font) per migliorare le risposte dell'AI
 */

const { Pool } = require('pg');

class DesignIntelligence {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
    }

    /**
     * 🎨 Genera palette di colori basata sui pattern estratti
     */
    async generateColorPalette(businessType, style = 'modern') {
        try {
            console.log(`🎨 Generating color palette for ${businessType} (${style})`);
            
            // Query per trovare i pattern più efficaci per questo business type
            const query = `
                SELECT 
                    color_palette,
                    confidence_score as effectiveness_score,
                    1 as usage_count
                FROM ai_design_patterns 
                WHERE business_type = $1 
                    AND color_palette IS NOT NULL
                    AND confidence_score > 0.6
                ORDER BY confidence_score DESC
                LIMIT 5
            `;
            
            const result = await this.pool.query(query, [businessType]);
            
            if (result.rows.length === 0) {
                // Fallback ai pattern generali se non ci sono dati specifici
                return this.getDefaultColorPalette(businessType);
            }
            
            // Analizza i pattern e genera una palette ottimizzata
            const patterns = result.rows;
            const optimizedPalette = this.analyzeColorPatterns(patterns);
            
            console.log(`✅ Generated optimized palette:`, optimizedPalette);
            return optimizedPalette;
            
        } catch (error) {
            // Se le colonne non esistono (schema non compatibile), usa i default
            if (error.code === '42703' || error.message.includes('does not exist')) {
                console.log(`❌ Error generating color palette: ${error.message}`);
                console.log(`🎨 Using default color palette for ${businessType}`);
                return this.getDefaultColorPalette(businessType);
            }
            
            console.error('❌ Error generating color palette:', error);
            console.log(`🎨 Using default color palette for ${businessType}`);
            return this.getDefaultColorPalette(businessType);
        }
    }

    /**
     * ✍️ Raccomanda combinazioni di font basate sui dati estratti
     */
    async recommendFontPairings(businessType, tone = 'professional') {
        try {
            console.log(`✍️ Recommending fonts for ${businessType} (${tone})`);
            
            const query = `
                SELECT 
                    font_families,
                    confidence_score as effectiveness_score,
                    1 as usage_count
                FROM ai_design_patterns 
                WHERE business_type = $1 
                    AND font_families IS NOT NULL
                    AND confidence_score > 0.6
                ORDER BY confidence_score DESC
                LIMIT 10
            `;
            
            const result = await this.pool.query(query, [businessType]);
            
            if (result.rows.length === 0) {
                return this.getDefaultFontPairings(businessType, tone);
            }
            
            // Analizza le combinazioni più efficaci
            const fontPairings = this.analyzeFontPatterns(result.rows, tone);
            
            console.log(`✅ Recommended font pairings:`, fontPairings);
            return fontPairings;
            
        } catch (error) {
            // Se le colonne non esistono (schema non compatibile), usa i default
            if (error.code === '42703' || error.message.includes('does not exist')) {
                console.log(`❌ Error recommending fonts: ${error.message}`);
                return this.getDefaultFontPairings(businessType, tone);
            }
            
            console.error('❌ Error recommending fonts:', error);
            return this.getDefaultFontPairings(businessType, tone);
        }
    }

    /**
     * 📐 Genera layout suggestions basate sui pattern di successo
     */
    async generateLayoutSuggestions(businessType, contentType = 'standard') {
        try {
            console.log(`📐 Generating layout for ${businessType} (${contentType})`);
            
            const query = `
                SELECT 
                    layout_structure,
                    confidence_score as effectiveness_score,
                    1 as usage_count
                FROM ai_design_patterns 
                WHERE business_type = $1 
                    AND layout_structure IS NOT NULL
                    AND confidence_score > 0.6
                ORDER BY confidence_score DESC
                LIMIT 5
            `;
            
            const result = await this.pool.query(query, [businessType]);
            
            if (result.rows.length === 0) {
                return this.getDefaultLayoutSuggestions(businessType);
            }
            
            // Genera suggerimenti layout ottimizzati
            const layoutSuggestions = this.analyzeLayoutPatterns(result.rows, contentType);
            
            console.log(`✅ Generated layout suggestions:`, layoutSuggestions);
            return layoutSuggestions;
            
        } catch (error) {
            // Se le colonne non esistono (schema non compatibile), usa i default
            if (error.code === '42703' || error.message.includes('does not exist')) {
                console.log(`❌ Error generating layout: ${error.message}`);
                console.log(`📐 Using default layout suggestions for ${businessType}`);
                return this.getDefaultLayoutSuggestions(businessType);
            }
            
            console.error('❌ Error generating layout:', error);
            console.log(`📐 Using default layout suggestions for ${businessType}`);
            return this.getDefaultLayoutSuggestions(businessType);
        }
    }

    /**
     * 🎯 Combina tutti i design patterns per una risposta completa
     */
    async generateCompleteDesignRecommendation(businessType, requirements = {}) {
        try {
            console.log(`🎯 Generating complete design for ${businessType}`);
            
            const style = requirements.style || 'modern';
            const tone = requirements.tone || 'professional';
            const contentType = requirements.contentType || 'standard';
            
            // Esegui tutte le analisi in parallelo
            const [colorPalette, fontPairings, layoutSuggestions] = await Promise.all([
                this.generateColorPalette(businessType, style),
                this.recommendFontPairings(businessType, tone),
                this.generateLayoutSuggestions(businessType, contentType)
            ]);
            
            // Genera raccomandazioni CSS specifiche
            const cssRecommendations = this.generateCSSRecommendations(
                colorPalette, fontPairings, layoutSuggestions
            );
            
            const completeRecommendation = {
                businessType,
                requirements,
                design: {
                    colors: colorPalette,
                    typography: fontPairings,
                    layout: layoutSuggestions,
                    css: cssRecommendations
                },
                confidence: this.calculateConfidenceScore(colorPalette, fontPairings, layoutSuggestions),
                timestamp: new Date().toISOString()
            };
            
            console.log(`✅ Complete design recommendation generated with ${completeRecommendation.confidence}% confidence`);
            return completeRecommendation;
            
        } catch (error) {
            console.error('❌ Error generating complete design:', error);
            throw error;
        }
    }

    /**
     * 🔍 Analizza pattern di colori per generare palette ottimizzata
     */
    analyzeColorPatterns(patterns) {
        const colorFrequency = {};
        const effectivenessWeights = {};
        
        patterns.forEach(pattern => {
            const colors = [
                pattern.primary_color,
                pattern.secondary_color,
                pattern.accent_color,
                pattern.background_color,
                pattern.text_color
            ].filter(Boolean);
            
            colors.forEach(color => {
                colorFrequency[color] = (colorFrequency[color] || 0) + 1;
                effectivenessWeights[color] = Math.max(
                    effectivenessWeights[color] || 0,
                    pattern.effectiveness_score
                );
            });
        });
        
        // Ordina per frequenza ed efficacia
        const sortedColors = Object.keys(colorFrequency)
            .sort((a, b) => {
                const scoreA = (colorFrequency[a] * effectivenessWeights[a]);
                const scoreB = (colorFrequency[b] * effectivenessWeights[b]);
                return scoreB - scoreA;
            });
        
        return {
            primary: sortedColors[0] || '#3B82F6',
            secondary: sortedColors[1] || '#10B981',
            accent: sortedColors[2] || '#F59E0B',
            background: this.findBestBackground(patterns),
            text: this.findBestTextColor(patterns),
            palette: sortedColors.slice(0, 8),
            confidence: patterns.length >= 3 ? 'high' : patterns.length >= 1 ? 'medium' : 'low'
        };
    }

    /**
     * 📝 Analizza pattern di font per raccomandazioni ottimizzate
     */
    analyzeFontPatterns(patterns, tone) {
        const fontFrequency = {};
        const pairings = {};
        
        patterns.forEach(pattern => {
            const primary = pattern.primary_font;
            const secondary = pattern.secondary_font;
            
            if (primary) {
                fontFrequency[primary] = (fontFrequency[primary] || 0) + pattern.effectiveness_score;
            }
            
            if (primary && secondary) {
                const pairKey = `${primary}+${secondary}`;
                pairings[pairKey] = (pairings[pairKey] || 0) + pattern.effectiveness_score;
            }
        });
        
        // Trova le migliori combinazioni
        const topFonts = Object.keys(fontFrequency)
            .sort((a, b) => fontFrequency[b] - fontFrequency[a]);
        
        const topPairings = Object.keys(pairings)
            .sort((a, b) => pairings[b] - pairings[a]);
        
        return {
            primary: topFonts[0] || this.getDefaultFont('primary', tone),
            secondary: topFonts[1] || this.getDefaultFont('secondary', tone),
            weights: this.extractCommonWeights(patterns),
            sizes: this.extractCommonSizes(patterns),
            bestPairings: topPairings.slice(0, 3).map(pair => {
                const [primary, secondary] = pair.split('+');
                return { primary, secondary, score: pairings[pair] };
            }),
            confidence: patterns.length >= 3 ? 'high' : 'medium'
        };
    }

    /**
     * 🏗️ Analizza pattern di layout per suggerimenti strutturali
     */
    analyzeLayoutPatterns(patterns, contentType) {
        const layoutStyles = {};
        const gridSystems = {};
        const spacingPatterns = {};
        
        patterns.forEach(pattern => {
            if (pattern.layout_style) {
                layoutStyles[pattern.layout_style] = 
                    (layoutStyles[pattern.layout_style] || 0) + pattern.effectiveness_score;
            }
            
            if (pattern.grid_system) {
                gridSystems[pattern.grid_system] = 
                    (gridSystems[pattern.grid_system] || 0) + pattern.effectiveness_score;
            }
            
            if (pattern.spacing_scale) {
                const spacing = JSON.stringify(pattern.spacing_scale);
                spacingPatterns[spacing] = 
                    (spacingPatterns[spacing] || 0) + pattern.effectiveness_score;
            }
        });
        
        return {
            recommendedStyle: this.getBestOption(layoutStyles) || 'modern',
            gridSystem: this.getBestOption(gridSystems) || 'flexbox',
            spacing: this.getBestSpacing(spacingPatterns),
            sections: this.generateSectionSuggestions(contentType),
            responsive: this.generateResponsiveBreakpoints(),
            confidence: patterns.length >= 2 ? 'high' : 'medium'
        };
    }

    /**
     * 🎨 Genera CSS specifico basato sui pattern analizzati
     */
    generateCSSRecommendations(colors, fonts, layout) {
        return {
            rootVariables: this.generateCSSVariables(colors, fonts),
            typography: this.generateTypographyCSS(fonts),
            layout: this.generateLayoutCSS(layout),
            components: this.generateComponentCSS(colors, fonts),
            utilities: this.generateUtilityCSS(layout.spacing)
        };
    }

    // 🛠️ UTILITY METHODS

    getDefaultColorPalette(businessType) {
        const defaults = {
            restaurant: { primary: '#D97706', secondary: '#DC2626', accent: '#059669' },
            'tech-startup': { primary: '#3B82F6', secondary: '#8B5CF6', accent: '#06B6D4' },
            ecommerce: { primary: '#7C3AED', secondary: '#EC4899', accent: '#F59E0B' },
            portfolio: { primary: '#1F2937', secondary: '#6B7280', accent: '#3B82F6' },
            wellness: { primary: '#059669', secondary: '#0891B2', accent: '#8B5CF6' }
        };
        
        const base = defaults[businessType] || defaults['tech-startup'];
        return {
            ...base,
            background: '#FFFFFF',
            text: '#1F2937',
            palette: Object.values(base),
            confidence: 'medium'
        };
    }

    getDefaultFontPairings(businessType, tone) {
        const defaults = {
            professional: { primary: 'Inter', secondary: 'system-ui' },
            creative: { primary: 'Playfair Display', secondary: 'Source Sans Pro' },
            modern: { primary: 'Poppins', secondary: 'Open Sans' },
            elegant: { primary: 'Crimson Text', secondary: 'Lato' }
        };
        
        return {
            ...defaults[tone] || defaults.modern,
            weights: [400, 600, 700],
            sizes: { h1: 48, h2: 36, h3: 24, body: 16 },
            confidence: 'medium'
        };
    }

    getBestOption(options) {
        return Object.keys(options).sort((a, b) => options[b] - options[a])[0];
    }

    calculateConfidenceScore(colors, fonts, layout) {
        const scores = [colors.confidence, fonts.confidence, layout.confidence];
        const weights = { high: 100, medium: 70, low: 40 };
        const average = scores.reduce((sum, score) => sum + weights[score], 0) / scores.length;
        return Math.round(average);
    }

    // ... Altri metodi di utilità per CSS generation, spacing, etc.
    
    findBestBackground(patterns) {
        const backgrounds = patterns
            .map(p => p.background_color)
            .filter(Boolean);
        return backgrounds[0] || '#FFFFFF';
    }
    
    findBestTextColor(patterns) {
        const textColors = patterns
            .map(p => p.text_color)
            .filter(Boolean);
        return textColors[0] || '#1F2937';
    }
    
    extractCommonWeights(patterns) {
        const allWeights = patterns
            .map(p => p.font_weights)
            .filter(Boolean)
            .flat();
        return [...new Set(allWeights)].sort((a, b) => a - b) || [400, 600, 700];
    }
    
    extractCommonSizes(patterns) {
        const defaultSizes = { h1: 48, h2: 36, h3: 24, body: 16 };
        if (patterns.length === 0) return defaultSizes;
        
        const sizePattern = patterns[0].font_sizes;
        return sizePattern || defaultSizes;
    }
    
    getBestSpacing(spacingPatterns) {
        if (Object.keys(spacingPatterns).length === 0) {
            return [8, 16, 24, 32, 48, 64];
        }
        
        const bestPattern = this.getBestOption(spacingPatterns);
        return JSON.parse(bestPattern) || [8, 16, 24, 32, 48, 64];
    }
    
    generateSectionSuggestions(contentType) {
        const suggestions = {
            website: ['hero', 'features', 'about', 'contact'],
            landing: ['hero', 'benefits', 'testimonials', 'cta'],
            ecommerce: ['hero', 'products', 'categories', 'reviews'],
            portfolio: ['hero', 'gallery', 'about', 'contact']
        };
        
        return suggestions[contentType] || suggestions.website;
    }
    
    generateResponsiveBreakpoints() {
        return {
            mobile: '640px',
            tablet: '768px',
            desktop: '1024px',
            wide: '1280px'
        };
    }
    
    getDefaultFont(type, tone) {
        const fonts = {
            professional: { primary: 'Inter', secondary: 'system-ui' },
            creative: { primary: 'Playfair Display', secondary: 'Source Sans Pro' },
            modern: { primary: 'Poppins', secondary: 'Open Sans' },
            elegant: { primary: 'Crimson Text', secondary: 'Lato' }
        };
        
        return fonts[tone]?.[type] || fonts.modern[type];
    }
    
    generateTypographyCSS(fonts) {
        return `
/* 📝 Typography */
.font-primary { font-family: var(--font-primary); }
.font-secondary { font-family: var(--font-secondary); }

h1 { font-family: var(--font-primary); font-size: ${fonts.sizes?.h1 || 48}px; font-weight: 700; }
h2 { font-family: var(--font-primary); font-size: ${fonts.sizes?.h2 || 36}px; font-weight: 600; }
h3 { font-family: var(--font-primary); font-size: ${fonts.sizes?.h3 || 24}px; font-weight: 600; }
body { font-family: var(--font-secondary); font-size: ${fonts.sizes?.body || 16}px; font-weight: 400; }`;
    }
    
    generateLayoutCSS(layout) {
        return `
/* 📐 Layout */
.container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
.grid { display: ${layout.gridSystem === 'css-grid' ? 'grid' : 'flex'}; gap: ${layout.spacing?.[2] || 24}px; }
.section { padding: ${layout.spacing?.[4] || 48}px 0; }`;
    }
    
    generateComponentCSS(colors, fonts) {
        return `
/* 🎨 Components */
.btn-primary {
  background: var(--color-primary);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-family: var(--font-primary);
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.card {
  background: var(--color-background);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}`;
    }
    
    generateUtilityCSS(spacing) {
        // Safety check for undefined spacing
        if (!spacing || !Array.isArray(spacing)) {
            spacing = [8, 16, 24, 32, 48]; // Default spacing values
        }
        
        const utilities = spacing.map((space, index) => 
            `.m-${index} { margin: ${space}px; }\n.p-${index} { padding: ${space}px; }`
        ).join('\n');
        
        return `\n/* 🔧 Utilities */\n${utilities}`;
    }
    
    getOptimizedContactFields(businessType) {
        const baseFields = [
            { label: 'Nome', type: 'text', required: true },
            { label: 'Email', type: 'email', required: true },
            { label: 'Messaggio', type: 'textarea', required: true }
        ];
        
        switch (businessType) {
            case 'restaurant':
                return [
                    ...baseFields.slice(0, 2),
                    { label: 'Telefono', type: 'tel', required: false },
                    { label: 'Data Prenotazione', type: 'date', required: false },
                    ...baseFields.slice(2)
                ];
            case 'ecommerce':
                return [
                    ...baseFields,
                    { label: 'Interesse per', type: 'select', required: false }
                ];
            default:
                return baseFields;
        }
    }
    
    getOptimizedSubmitText(businessType) {
        const texts = {
            restaurant: 'Prenota Ora',
            ecommerce: 'Invia Richiesta',
            portfolio: 'Contattami',
            services: 'Richiedi Preventivo'
        };
        
        return texts[businessType] || 'Invia Messaggio';
    }
    
    generateCSSVariables(colors, fonts) {
        return `
:root {
  /* 🎨 Colors */
  --color-primary: ${colors.primary};
  --color-secondary: ${colors.secondary};
  --color-accent: ${colors.accent};
  --color-background: ${colors.background};
  --color-text: ${colors.text};
  
  /* ✍️ Typography */
  --font-primary: '${fonts.primary}', sans-serif;
  --font-secondary: '${fonts.secondary}', sans-serif;
  --font-weight-normal: 400;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}`;
    }

    /**
     * 🎯 Default Layout Suggestions (fallback when no data available)
     */
    getDefaultLayoutSuggestions(businessType) {
        console.log(`📐 Using default layout suggestions for ${businessType}`);
        
        const defaultLayouts = {
            restaurant: ['hero', 'about', 'menu', 'gallery', 'contact'],
            business: ['hero', 'about', 'services', 'team', 'contact'],
            ecommerce: ['hero', 'products', 'categories', 'about', 'contact'],
            portfolio: ['hero', 'portfolio', 'about', 'skills', 'contact'],
            blog: ['hero', 'posts', 'about', 'categories', 'contact'],
            nonprofit: ['hero', 'mission', 'programs', 'donate', 'contact'],
            health: ['hero', 'services', 'team', 'testimonials', 'contact'],
            education: ['hero', 'courses', 'about', 'faculty', 'contact'],
            tech: ['hero', 'products', 'solutions', 'team', 'contact'],
            default: ['hero', 'about', 'services', 'contact']
        };

        const layout = defaultLayouts[businessType] || defaultLayouts.default;
        
        return {
            layout: layout,
            spacing: [8, 16, 24, 32, 48], // Add default spacing values
            confidence: 0.6,
            method: 'fallback',
            source: 'default_patterns',
            semanticScore: 70,
            designScore: 65
        };
    }

    /**
     * 🎨 Default Color Palette (fallback when no data available)
     */
    getDefaultColorPalette(businessType) {
        console.log(`🎨 Using default color palette for ${businessType}`);
        
        const defaultPalettes = {
            restaurant: {
                primary: '#8B4513',
                secondary: '#D2691E', 
                accent: '#FFD700',
                background: '#FFFFFF',
                text: '#333333'
            },
            business: {
                primary: '#2563EB',
                secondary: '#1E40AF',
                accent: '#F59E0B',
                background: '#FFFFFF',
                text: '#1F2937'
            },
            health: {
                primary: '#059669',
                secondary: '#065F46',
                accent: '#10B981',
                background: '#F0FDF4',
                text: '#1F2937'
            },
            tech: {
                primary: '#7C3AED',
                secondary: '#5B21B6',
                accent: '#06B6D4',
                background: '#FFFFFF',
                text: '#111827'
            },
            default: {
                primary: '#3B82F6',
                secondary: '#1E40AF',
                accent: '#F59E0B',
                background: '#FFFFFF',
                text: '#1F2937'
            }
        };

        return defaultPalettes[businessType] || defaultPalettes.default;
    }

    async close() {
        await this.pool.end();
    }
}

module.exports = DesignIntelligence;
