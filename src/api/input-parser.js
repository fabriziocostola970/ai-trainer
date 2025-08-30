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

      const prompt = `ANALIZZA QUESTO INPUT ITALIANO E RESTITUISCI INFORMAZIONI IN ITALIANO

INPUT UTENTE (ITALIANO): "${userInput}"

ESTRAI INFORMAZIONI IN FORMATO JSON:
{
  "businessType": "TIPO SPECIFICO ITALIANO (fioraio, ristorante, parrucchiere, meccanico, idraulico, elettricista, avvocato, commercialista, dentista, veterinario, palestra, negozio abbigliamento, farmacia, bar, gelateria, panificio, macelleria, etc.)",
  "businessName": "nome esatto del business se presente, altrimenti null",
  "location": "città italiana se menzionata (es. Roma, Milano, Napoli), altrimenti null",
  "features": ["caratteristiche chiave in italiano (consegna a domicilio, prenotazione online, e-commerce, catalogo prodotti, portfolio, blog, etc.)"],
  "industry": "settore specifico italiano (ristorazione italiana, servizi floreali, parrucchieria uomo/donna, meccanica auto, etc.)",
  "language": "sempre 'italiano'",
  "confidence": "livello di confidenza 0-1"
}

REGOLE IMPORTANTI:
- businessType DEVE essere specifico italiano (NON "services" o "business")
- Mantieni TUTTO in italiano, NON tradurre in inglese
- Riconosci business italiani comuni: fioraio, ristorante, parrucchiere, meccanico, idraulico, elettricista, avvocato, commercialista, dentista, veterinario, palestra, farmacia, bar, gelateria, panificio, macelleria, etc.
- Se ambiguo, scegli il tipo più probabile dal contesto
- Features devono essere utili per costruire il sito web

ESEMPI:
"Ho un ristorante a Roma" → {"businessType": "ristorante", "location": "Roma"}
"Sono un fioraio specializzato in matrimoni" → {"businessType": "fioraio", "features": ["servizi matrimonio"]}
"Vendo vestiti online" → {"businessType": "negozio abbigliamento", "features": ["e-commerce"]}

RISPONDI SOLO CON JSON VALIDO`;

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
   * Fallback parser completamente dinamico - apprende dai dati esistenti
   */
  async fallbackParse(userInput) {
    const lowerInput = userInput.toLowerCase();

    try {
      // 🧠 Apprendimento dinamico: analizza pattern esistenti nel database
      const storage = new DatabaseStorage();
      const existingPatterns = await storage.pool.query(`
        SELECT DISTINCT business_type, semantic_analysis
        FROM ai_design_patterns
        WHERE quality_score > 6.0
        ORDER BY quality_score DESC
        LIMIT 50
      `);

      // Costruisci mapping dinamico dai pattern esistenti
      const dynamicMappings = {};
      const keywordFrequency = {};

      existingPatterns.rows.forEach(row => {
        const businessType = row.business_type;
        if (!dynamicMappings[businessType]) {
          dynamicMappings[businessType] = [];
        }

        // Estrai keywords dal semantic_analysis
        if (row.semantic_analysis) {
          const semantic = row.semantic_analysis.toLowerCase();
          const words = semantic.split(/[\s,.;!?]+/).filter(word =>
            word.length > 3 && !['that', 'with', 'this', 'from', 'they', 'have'].includes(word)
          );

          words.forEach(word => {
            if (!keywordFrequency[word]) keywordFrequency[word] = {};
            keywordFrequency[word][businessType] = (keywordFrequency[word][businessType] || 0) + 1;
          });
        }
      });

      // Costruisci mapping basato su frequenza keywords
      Object.entries(keywordFrequency).forEach(([keyword, typeCounts]) => {
        const bestType = Object.entries(typeCounts).sort(([,a], [,b]) => b - a)[0];
        if (bestType && bestType[1] >= 2) { // Almeno 2 occorrenze
          if (!dynamicMappings[bestType[0]]) {
            dynamicMappings[bestType[0]] = [];
          }
          if (!dynamicMappings[bestType[0]].includes(keyword)) {
            dynamicMappings[bestType[0]].push(keyword);
          }
        }
      });

      console.log(`🧠 [Dynamic Learning] Learned ${Object.keys(dynamicMappings).length} business types from database`);

      // Usa il mapping dinamico per riconoscere il business type
      let businessType = 'servizio'; // default italiano
      let confidence = 0.3;

      for (const [type, keywords] of Object.entries(dynamicMappings)) {
        if (keywords.some(keyword => lowerInput.includes(keyword))) {
          businessType = type;
          confidence = 0.8;
          console.log(`🧠 [Dynamic Recognition] Matched "${type}" via keyword learning`);
          break;
        }
      }

      // Se non trova match dinamico, usa GPT-4 per classificazione intelligente
      if (businessType === 'servizio' && confidence < 0.8) {
        console.log('🧠 [Dynamic Fallback] Using GPT-4 for intelligent classification');

        const classificationPrompt = `Classifica questo business italiano in una categoria specifica basata sul testo fornito.

TESTO: "${userInput}"

REGOLE:
- Riconosci automaticamente il settore (es. ristorazione, servizi floreali, meccanica, parrucchieria, etc.)
- NON usare categorie generiche come "servizio" o "business"
- Mantieni sempre in italiano
- Se ambiguo, scegli la categoria più probabile dal contesto

Rispondi SOLO con la categoria specifica in italiano, senza spiegazioni aggiuntive.`;

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "user", content: classificationPrompt }],
          max_tokens: 20,
          temperature: 0.1
        });

        const aiClassification = response.choices[0].message.content.trim().toLowerCase();
        if (aiClassification && aiClassification !== 'servizio' && aiClassification !== 'business') {
          businessType = aiClassification;
          confidence = 0.9;
          console.log(`🧠 [AI Classification] GPT-4 classified as: "${businessType}"`);
        }
      }

      // Estrazione nome business dinamica
      let businessName = null;
      const namePatterns = [
        /"([^"]+)"/,  // tra virgolette
        /'([^']+)'/,  // tra apici
        /(?:sono|ho|gestisco)\s+([^,\.!?]+)/i,  // dopo "sono", "ho", "gestisco"
        /([A-Z][^,\.!?]*)/  // parole che iniziano con maiuscola
      ];

      for (const pattern of namePatterns) {
        const match = userInput.match(pattern);
        if (match && match[1] && match[1].length > 3) {
          businessName = match[1].trim();
          break;
        }
      }

      // Estrazione location italiana dinamica
      let location = null;
      const cities = ['roma', 'milano', 'napoli', 'torino', 'palermo', 'genova', 'bologna', 'firenze', 'bari', 'catania', 'venezia', 'verona', 'messina', 'padova', 'trieste', 'brescia', 'taranto', 'prato', 'modena', 'reggio calabria', 'reggio emilia', 'perugia', 'livorno', 'ravenna', 'cagliari', 'foggia', 'rimini', 'salerno', 'ferrara', 'sassari', 'latina', 'giugliano', 'monza', 'bergamo', 'pescara', 'vicenza', 'terni', 'forlì', 'trento', 'bolzano'];

      for (const city of cities) {
        if (lowerInput.includes(city)) {
          location = city.charAt(0).toUpperCase() + city.slice(1);
          break;
        }
      }

      return {
        businessType,
        businessName,
        location,
        features: [],
        industry: businessType,
        language: 'italiano',
        confidence
      };

    } catch (error) {
      console.error('❌ [Dynamic Parser] Error:', error);
      // Fallback finale se tutto fallisce
      return {
        businessType: 'servizio',
        businessName: null,
        location: null,
        features: [],
        industry: 'servizio',
        language: 'italiano',
        confidence: 0.1
      };
    }
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
