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
    console.error('❌ AI Design generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      source: 'ai-design-intelligence'
    });
  }
});

// 🎯 POST /api/generate/complete-design - Full AI-powered design system
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

// 📊 GET /api/generate/design-analytics/:businessType - Analisi pattern estratti
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

// 🎨 Fallback design generation for testing
function generateFallbackDesign(businessType = 'general') {
  const fallbackDesigns = {
    restaurant: {
      primaryColor: '#D97706',
      secondaryColor: '#DC2626', 
      accentColor: '#059669',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      palette: ['#D97706', '#DC2626', '#059669', '#F59E0B'],
      typography: {
        primaryFont: 'Playfair Display',
        secondaryFont: 'Source Sans Pro',
        fontWeights: [400, 600, 700],
        fontSizes: { h1: 48, h2: 36, h3: 24, body: 16 }
      },
      layoutStyle: 'warm'
    },
    tech: {
      primaryColor: '#3B82F6',
      secondaryColor: '#8B5CF6',
      accentColor: '#06B6D4',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      palette: ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981'],
      typography: {
        primaryFont: 'Inter',
        secondaryFont: 'JetBrains Mono',
        fontWeights: [400, 500, 700],
        fontSizes: { h1: 56, h2: 40, h3: 28, body: 16 }
      },
      layoutStyle: 'modern'
    }
  };
  
  return fallbackDesigns[businessType] || fallbackDesigns.tech;
}

module.exports = router;
