const express = require('express');
const router = express.Router();

// Middleware per autenticazione API
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

// POST /api/generate/layout - Genera layout semantico ottimizzato
router.post('/layout', authenticateAPI, async (req, res) => {
  try {
    console.log('🎨 Richiesta generazione layout:', {
      businessType: req.body.businessType,
      blocksCount: req.body.currentBlocks?.length || 0,
      timestamp: new Date().toISOString()
    });

    const { businessType, currentBlocks, preferences, requirements } = req.body;
    
    // Validation
    if (!businessType) {
      return res.status(400).json({
        success: false,
        error: 'businessType is required'
      });
    }
    
    // Mock response for now (will be replaced with AI logic)
    const mockResponse = {
      success: true,
      layout: currentBlocks || [],
      semanticScore: 85,
      designScore: 78,
      recommendations: [
        'Consider moving navigation to top',
        'Hero section could benefit from stronger CTA',
        'Add testimonials section for social proof'
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        aiModel: 'mock-v1.0',
        processingTime: '1.2s'
      }
    };
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    res.json(mockResponse);
    
  } catch (error) {
    console.error('❌ Template generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Template generation failed',
      details: error.message
    });
  }
});

// POST /api/generate/template
router.post('/template', async (req, res) => {
  try {
    console.log('🎯 Creative template generation request:', req.body);
    
    const { businessData, inspirationDataset, creativityLevel } = req.body;
    
    // Mock creative template response
    const mockTemplate = {
      success: true,
      template: {
        name: `${businessData?.businessType || 'Custom'} Creative Pro`,
        layout: ['navigation-modern', 'hero-animated', 'features-grid', 'testimonials-video', 'cta-prominent'],
        colorPalette: ['#667EEA', '#764BA2', '#F093FB', '#F5F7FA'],
        typography: {
          primary: 'Inter',
          secondary: 'JetBrains Mono'
        },
        customBlocks: [
          'interactive-demo',
          'pricing-calculator',
          'feature-comparison'
        ]
      },
      creativityScore: 89,
      businessAlignment: 92,
      metadata: {
        generatedAt: new Date().toISOString(),
        creativityLevel: creativityLevel || 'high',
        processingTime: '2.1s'
      }
    };
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2100));
    
    res.json(mockTemplate);
    
  } catch (error) {
    console.error('❌ Creative template generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Creative template generation failed',
      details: error.message
    });
  }
});

module.exports = router;
