const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { CompetitorAnalysisSystem } = require('../lib/competitor-analysis-system');

// POST /api/ai/analyze-competitors
router.post('/analyze-competitors', async (req, res) => {
  try {
    const { businessType } = req.body;

    if (!businessType) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_BUSINESS_TYPE',
        message: 'businessType is required'
      });
    }

    console.log(`🚀 Avvio analisi competitor per: ${businessType}`);

    // 🚀 Avvio sistema di analisi competitor
    const result = await CompetitorAnalysisSystem.analyzeAndStoreCompetitors(businessType);

    if (result.success) {
      return res.json({
        success: true,
        message: 'Analisi competitor completata',
        data: {
          businessType,
          totalProcessed: result.totalProcessed || 0,
          successCount: result.successCount || 0,
          results: result.results || []
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'ANALYSIS_FAILED',
        message: result.error || 'Errore durante l\'analisi'
      });
    }

  } catch (error) {
    console.error('❌ Errore API analyze-competitors:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Errore interno del server'
    });
  }
});

// POST /api/ai/check-competitor-count
router.post('/check-competitor-count', async (req, res) => {
  try {
    const { businessType } = req.body;

    if (!businessType) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_BUSINESS_TYPE',
        message: 'businessType is required'
      });
    }

    console.log(`🔍 Controllo competitor per: ${businessType}`);

    const count = await CompetitorAnalysisSystem.checkCompetitorCount(businessType);

    return res.json({
      success: true,
      count: count
    });

  } catch (error) {
    console.error('❌ Errore API check-competitor-count:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Errore interno del server'
    });
  }
});

// POST /api/ai/competitors
router.post('/', async (req, res) => {
  try {
    const { businessName, description } = req.body;
    if (!businessName || !description) {
      return res.status(400).json({ success: false, error: 'Missing businessName or description' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, error: 'OpenAI API key not configured' });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `Given the following business details:
Business name: "${businessName}"
Business description: "${description}"

1. Infer the most appropriate businessType for this business. Use specific categories:
   - "florist" for flower shops, fioristi, flower arrangements
   - "bakery" for panetterie, pasticcerie, bread/cake shops
   - "restaurant" for ristoranti, pizzerie, food establishments
   - "gym" for palestre, fitness centers
   - "hotel" for hotels, B&B, hospitality
   - "retail" for general retail stores, negozi
   - "beauty" for parrucchieri, saloni di bellezza, spa
   - "automotive" for car dealers, mechanic shops
   - "tech-startup" for technology companies, software
   - "real-estate" for real estate agencies
   - "travel" for travel agencies, tour operators
   - "services" only for professional services (consulting, legal, accounting)

2. Generate exactly 15 real competitor websites for this businessType.

IMPORTANT: 
- Analyze the business description carefully for industry keywords
- "Fioraio", "fiori", "composizioni floreali" = "florist" NOT "services"
- "Negozio" can be retail, but check the products sold

Requirements:
- Must be real, existing websites (not fictional)
- Should be well-known brands in the inferred businessType industry
- Include diverse examples (local, national, international if possible)
- Focus on websites with good design and user experience
- Provide complete, working URLs
- Mix of different sizes: large corporations, medium businesses, and boutique/local businesses

Respond ONLY with JSON format:
{
  "businessType": "...",
  "competitors": [
    {
      "url": "https://example.com",
      "name": "Company Name",
      "description": "Brief description of the business"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
      temperature: 0.3
    });

    let result;
    try {
      result = JSON.parse(completion.choices[0].message.content);
    } catch (err) {
      return res.status(500).json({ success: false, error: 'OpenAI response parsing failed', details: completion.choices[0].message.content });
    }

    if (!result.businessType || !Array.isArray(result.competitors)) {
      return res.status(500).json({ success: false, error: 'OpenAI response missing businessType or competitors', details: result });
    }

    return res.json({ success: true, businessType: result.businessType, competitors: result.competitors });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;