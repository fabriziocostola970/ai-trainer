const express = require('express');
const router = express.Router();
const DatabaseStorage = require('../storage/database-storage');

// 🎨 GENERATE DESIGN PATTERNS API
// Genera palette colori e stili basati su training data

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

// 🎨 POST /api/generate/design-palette
router.post('/design-palette', authenticateAPI, async (req, res) => {
  try {
    const { businessType, style = 'modern' } = req.body;
    
    console.log('🎨 Generating design palette for:', { businessType, style });
    
    const storage = new DatabaseStorage();
    
    // 1. Cerca pattern esistenti per questo business type
    const existingPatterns = await storage.pool.query(`
      SELECT * FROM design_patterns 
      WHERE business_type = $1 
        AND pattern_type = 'color_palette'
        AND effectiveness_score > 7.0
      ORDER BY usage_count DESC, effectiveness_score DESC
      LIMIT 5
    `, [businessType]);
    
    console.log(`📊 Found ${existingPatterns.rows.length} existing patterns`);
    
    if (existingPatterns.rows.length > 0) {
      // Usa pattern esistenti con alta efficacia
      const bestPattern = existingPatterns.rows[0];
      
      // Incrementa usage_count
      await storage.pool.query(`
        UPDATE design_patterns 
        SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [bestPattern.id]);
      
      return res.json({
        success: true,
        source: 'learned_patterns',
        design: {
          primaryColor: bestPattern.primary_color,
          secondaryColor: bestPattern.secondary_color,
          accentColor: bestPattern.accent_color,
          backgroundColor: bestPattern.background_color,
          textColor: bestPattern.text_color,
          palette: bestPattern.color_palette,
          layoutStyle: bestPattern.layout_style,
          typography: {
            primaryFont: bestPattern.primary_font,
            secondaryFont: bestPattern.secondary_font,
            fontWeights: bestPattern.font_weights,
            fontSizes: bestPattern.font_sizes
          },
          spacing: bestPattern.spacing_scale,
          imageStyle: bestPattern.image_style,
          effectiveness: bestPattern.effectiveness_score,
          usageCount: bestPattern.usage_count + 1
        }
      });
    }
    
    // 2. Se non ci sono pattern, genera usando regole intelligenti
    const generatedDesign = generateIntelligentDesign(businessType, style);
    
    // 3. Salva il nuovo pattern nel database per future analisi
    const newPattern = await storage.pool.query(`
      INSERT INTO design_patterns (
        business_type, pattern_type, primary_color, secondary_color, 
        accent_color, background_color, text_color, color_palette,
        layout_style, primary_font, secondary_font, font_weights, 
        font_sizes, spacing_scale, image_style, extraction_method,
        confidence_level, usage_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id
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
