const express = require('express');
const router = express.Router();
const DatabaseStorage = require('../storage/database-storage');
const DesignIntelligence = require('../ai/design-intelligence');

// 🧠 ENHANCED DESIGN GENERATION API  
// Utilizza Design Intelligence per generare design basati sui pattern estratti

const authenticateAPI = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.AI_TRAINER_API_KEY;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Missing or invalid authorization header'
    });
  }
  
  const token = authHeader.substring(7);
  if (!expectedKey || token !== expectedKey) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key'
    });
  }
  
  next();
};

// 🧠 POST /api/generate/design-palette - Enhanced with AI
router.post('/design-palette', authenticateAPI, async (req, res) => {
  try {
    const { businessType, style = 'modern', requirements = {} } = req.body;
    
    console.log('🧠 Generating AI-powered design for:', { businessType, style, requirements });
    
    const designAI = new DesignIntelligence();
    
    // Utilizza Design Intelligence per generare design ottimizzato
    const colorPalette = await designAI.generateColorPalette(businessType, style);
    const fontRecommendations = await designAI.recommendFontPairings(businessType, requirements.tone || 'professional');
    const layoutSuggestions = await designAI.generateLayoutSuggestions(businessType, requirements.contentType || 'standard');
    
    // Genera CSS ottimizzato
    const cssRecommendations = designAI.generateCSSRecommendations(colorPalette, fontRecommendations, layoutSuggestions);
    
    await designAI.close();
    
    const response = {
      success: true,
      source: 'ai-design-intelligence',
      design: {
        // 🎨 Colors (basati sui pattern più efficaci)
        primaryColor: colorPalette.primary,
        secondaryColor: colorPalette.secondary,
        accentColor: colorPalette.accent,
        backgroundColor: colorPalette.background,
        textColor: colorPalette.text,
        palette: colorPalette.palette,
        
        // ✍️ Typography (analizzato da siti reali)
        typography: {
          primaryFont: fontRecommendations.primary,
          secondaryFont: fontRecommendations.secondary,
          fontWeights: fontRecommendations.weights,
          fontSizes: fontRecommendations.sizes,
          bestPairings: fontRecommendations.bestPairings
        },
        
        // 📐 Layout (pattern di successo)
        layout: {
          style: layoutSuggestions.recommendedStyle,
          gridSystem: layoutSuggestions.gridSystem,
          spacing: layoutSuggestions.spacing,
          sections: layoutSuggestions.sections,
          responsive: layoutSuggestions.responsive
        },
        
        // 🎯 CSS Ready-to-use
        css: cssRecommendations,
        
        // 📊 Confidence metrics
        confidence: {
          colors: colorPalette.confidence,
          typography: fontRecommendations.confidence,
          layout: layoutSuggestions.confidence,
          overall: Math.round((
            (colorPalette.confidence === 'high' ? 90 : colorPalette.confidence === 'medium' ? 70 : 50) +
            (fontRecommendations.confidence === 'high' ? 90 : fontRecommendations.confidence === 'medium' ? 70 : 50) +
            (layoutSuggestions.confidence === 'high' ? 90 : layoutSuggestions.confidence === 'medium' ? 70 : 50)
          ) / 3)
        }
      },
      businessType,
      style,
      requirements,
      generatedAt: new Date().toISOString(),
      processingTime: Date.now() - Date.now() // TODO: measure actual time
    };
    
    console.log(`✅ AI design generated with ${response.design.confidence.overall}% confidence`);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Design generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      source: 'ai-design-intelligence'
    });
  }
});

// 🎯 NEW: POST /api/generate/complete-design - Full AI-powered design system
router.post('/complete-design', authenticateAPI, async (req, res) => {
  try {
    const { businessType, requirements = {} } = req.body;
    
    if (!businessType) {
      return res.status(400).json({
        success: false,
        error: 'businessType is required'
      });
    }
    
    console.log('🎯 Generating complete AI design system for:', businessType);
    
    const designAI = new DesignIntelligence();
    const completeDesign = await designAI.generateCompleteDesignRecommendation(businessType, requirements);
    await designAI.close();
    
    res.json({
      success: true,
      ...completeDesign,
      message: 'Complete design system generated using extracted patterns',
      processingTime: Date.now() - Date.now() // TODO: measure actual time
    });
    
  } catch (error) {
    console.error('❌ Complete design generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 📊 NEW: GET /api/generate/design-analytics/:businessType - Analisi pattern estratti
router.get('/design-analytics/:businessType', authenticateAPI, async (req, res) => {
  try {
    const { businessType } = req.params;
    const designAI = new DesignIntelligence();
    
    // Query analisi pattern estratti
    const analytics = await designAI.pool.query(`
      SELECT 
        pattern_type,
        COUNT(*) as total_patterns,
        AVG(effectiveness_score) as avg_effectiveness,
        MAX(effectiveness_score) as max_effectiveness,
        SUM(usage_count) as total_usage
      FROM design_patterns 
      WHERE business_type = $1 
      GROUP BY pattern_type
      ORDER BY total_patterns DESC
    `, [businessType]);
    
    const colorTrends = await designAI.pool.query(`
      SELECT primary_color, COUNT(*) as frequency 
      FROM design_patterns 
      WHERE business_type = $1 AND pattern_type = 'color_palette'
      GROUP BY primary_color 
      ORDER BY frequency DESC 
      LIMIT 10
    `, [businessType]);
    
    const fontTrends = await designAI.pool.query(`
      SELECT primary_font, COUNT(*) as frequency 
      FROM design_patterns 
      WHERE business_type = $1 AND pattern_type = 'typography'
      GROUP BY primary_font 
      ORDER BY frequency DESC 
      LIMIT 10
    `, [businessType]);
    
    await designAI.close();
    
    res.json({
      success: true,
      businessType,
      analytics: {
        overview: analytics.rows,
        colorTrends: colorTrends.rows,
        fontTrends: fontTrends.rows,
        totalPatterns: analytics.rows.reduce((sum, row) => sum + parseInt(row.total_patterns), 0),
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Design analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
    `, [
      businessType, 'color_palette', 
      generatedDesign.primaryColor, generatedDesign.secondaryColor,
      generatedDesign.accentColor, generatedDesign.backgroundColor,
      generatedDesign.textColor, JSON.stringify(generatedDesign.palette),
      generatedDesign.layoutStyle, generatedDesign.typography.primaryFont,
      generatedDesign.typography.secondaryFont, JSON.stringify(generatedDesign.typography.fontWeights),
      JSON.stringify(generatedDesign.typography.fontSizes), JSON.stringify(generatedDesign.spacing),
      generatedDesign.imageStyle, 'ai_generated', 0.85, 1
    ]);
    
    console.log(`✅ Created new design pattern with ID: ${newPattern.rows[0].id}`);
    
    res.json({
      success: true,
      source: 'ai_generated',
      design: {
        ...generatedDesign,
        patternId: newPattern.rows[0].id,
        effectiveness: 8.5, // Default per nuovi pattern
        usageCount: 1
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating design palette:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      fallback: generateFallbackDesign()
    });
  }
});

// 📊 GET /api/analyze/design-trends
router.get('/design-trends/:businessType', authenticateAPI, async (req, res) => {
  try {
    const { businessType } = req.params;
    
    const storage = new DatabaseStorage();
    
    // Analizza trends per business type
    const colorTrends = await storage.pool.query(`
      SELECT 
        primary_color, secondary_color, accent_color,
        COUNT(*) as usage_frequency,
        AVG(effectiveness_score) as avg_effectiveness,
        MAX(updated_at) as last_used
      FROM design_patterns 
      WHERE business_type = $1 AND pattern_type = 'color_palette'
      GROUP BY primary_color, secondary_color, accent_color
      ORDER BY usage_frequency DESC, avg_effectiveness DESC
      LIMIT 10
    `, [businessType]);
    
    const layoutTrends = await storage.pool.query(`
      SELECT 
        layout_style,
        COUNT(*) as frequency,
        AVG(effectiveness_score) as effectiveness
      FROM design_patterns 
      WHERE business_type = $1 AND layout_style IS NOT NULL
      GROUP BY layout_style
      ORDER BY frequency DESC
    `, [businessType]);
    
    res.json({
      success: true,
      businessType,
      trends: {
        colors: colorTrends.rows,
        layouts: layoutTrends.rows,
        totalPatterns: colorTrends.rows.length,
        analysisDate: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error analyzing design trends:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🧠 Funzione per generare design intelligenti
function generateIntelligentDesign(businessType, style) {
  // Regole business-specific
  const businessRules = {
    'restaurant': {
      colors: ['#D4841C', '#8B4513', '#FFF8DC', '#F4A460'], // Warm, appetite-inducing
      layout: 'warm_inviting',
      fonts: ['Playfair Display', 'Open Sans'],
      imageStyle: 'photography'
    },
    'technology': {
      colors: ['#1E40AF', '#3B82F6', '#F8FAFC', '#64748B'], // Modern blues
      layout: 'minimal_tech',
      fonts: ['Inter', 'JetBrains Mono'],
      imageStyle: 'abstract'
    },
    'fashion': {
      colors: ['#000000', '#FFFFFF', '#F1F5F9', '#E11D48'], // Elegant contrast
      layout: 'editorial',
      fonts: ['Montserrat', 'Lora'],
      imageStyle: 'photography'
    },
    'ecommerce': {
      colors: ['#059669', '#10B981', '#F0FDF4', '#374151'], // Trust-building greens
      layout: 'conversion_focused',
      fonts: ['Roboto', 'Source Sans Pro'],
      imageStyle: 'product_focused'
    }
  };
  
  const rules = businessRules[businessType] || businessRules['technology'];
  
  return {
    primaryColor: rules.colors[0],
    secondaryColor: rules.colors[1],
    accentColor: rules.colors[3],
    backgroundColor: rules.colors[2],
    textColor: '#1F2937',
    palette: rules.colors,
    layoutStyle: rules.layout,
    typography: {
      primaryFont: rules.fonts[0],
      secondaryFont: rules.fonts[1],
      fontWeights: [400, 600, 700],
      fontSizes: {
        h1: 48, h2: 36, h3: 24, h4: 20, 
        body: 16, small: 14, caption: 12
      }
    },
    spacing: [8, 16, 24, 32, 48, 64],
    imageStyle: rules.imageStyle,
    confidence: 0.85
  };
}

function generateFallbackDesign() {
  return {
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    accentColor: '#EF4444',
    backgroundColor: '#F8FAFC',
    textColor: '#1F2937',
    palette: ['#3B82F6', '#1E40AF', '#F8FAFC', '#EF4444'],
    layoutStyle: 'modern',
    typography: {
      primaryFont: 'Inter',
      secondaryFont: 'Open Sans',
      fontWeights: [400, 600],
      fontSizes: { h1: 36, h2: 24, body: 16 }
    },
    spacing: [16, 24, 32],
    imageStyle: 'modern'
  };
}

module.exports = router;
