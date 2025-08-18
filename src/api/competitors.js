const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

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

1. Infer the most appropriate businessType for this business (e.g. "restaurant", "gym", "hotel", "bakery", etc).
2. Generate exactly 5 real competitor websites for this businessType.

Requirements:
- Must be real, existing websites (not fictional)
- Should be well-known brands in the inferred businessType industry
- Include diverse examples (local, national, international if possible)
- Focus on websites with good design and user experience
- Provide complete, working URLs

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
      max_tokens: 800,
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