const OpenAI = require('openai');

/**
 * 🔍 INPUT NATURAL PARSER - Analizza input utente per estrarre business info
 * Sostituisce il questionario con NLP per capire business type, location, features
 */
class InputNaturalParser {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Analizza input naturale dell'utente
   * @param {string} userInput - Es: "Voglio un sito per la mia pizzeria a Roma con consegna a domicilio"
   * @returns {Object} - { businessType, businessName, location, features, language }
   */
  async parseUserInput(userInput) {
    try {
      console.log(`🔍 [Input Parser] Analyzing: "${userInput}"`);

      const prompt = `Analizza questo input dell'utente e estrai le informazioni chiave per creare un sito web.

INPUT UTENTE: "${userInput}"

Estrai le seguenti informazioni in formato JSON:
{
  "businessType": "tipo di business principale (es. ristorante, negozio, servizio)",
  "businessName": "nome del business se menzionato, altrimenti null",
  "location": "città/paese se menzionato, altrimenti null",
  "features": ["array di caratteristiche chiave (es. consegna, prenotazione, e-commerce)"],
  "industry": "settore specifico (es. ristorazione italiana, abbigliamento sportivo)",
  "language": "lingua principale dell'input (es. italiano, inglese)",
  "confidence": "livello di confidenza 0-1"
}

IMPORTANTE:
- businessType deve essere specifico ma generico (es. "ristorante" non "pizzeria")
- Se non chiaro, usa il contesto per inferire
- Features devono essere actionable per il sito web
- Rispondi SOLO con JSON valido`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.2
      });

      const result = JSON.parse(completion.choices[0].message.content.trim());
      console.log(`✅ [Input Parser] Parsed:`, result);

      return result;

    } catch (error) {
      console.error(`❌ [Input Parser] Error:`, error.message);
      // Fallback: estrazione semplice
      return this.fallbackParse(userInput);
    }
  }

  /**
   * Fallback parser se OpenAI fallisce
   */
  fallbackParse(userInput) {
    const lowerInput = userInput.toLowerCase();

    // Mapping semplice basato su keywords
    const typeMappings = {
      'ristorante': ['ristorante', 'pizzeria', 'trattoria', 'cucina'],
      'negozio': ['negozio', 'shop', 'store', 'boutique'],
      'servizio': ['servizio', 'agenzia', 'studio', 'consulenza'],
      'ecommerce': ['vendita', 'online', 'e-commerce', 'prodotti']
    };

    let businessType = 'servizio'; // default
    for (const [type, keywords] of Object.entries(typeMappings)) {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        businessType = type;
        break;
      }
    }

    return {
      businessType,
      businessName: null,
      location: null,
      features: [],
      industry: businessType,
      language: 'italiano',
      confidence: 0.5
    };
  }

  /**
   * Valida e arricchisce il parsing
   */
  async validateAndEnrich(parsedData) {
    // Qui possiamo aggiungere validazione con database o altre API
    return parsedData;
  }
}

module.exports = InputNaturalParser;
