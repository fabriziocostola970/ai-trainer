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
   * Fallback parser se OpenAI fallisce
   */
  fallbackParse(userInput) {
    const lowerInput = userInput.toLowerCase();

    // Mapping intelligente per business italiani comuni
    const typeMappings = {
      'fioraio': ['fior', 'bouquet', 'composizion', 'matrimon', 'fiori'],
      'ristorante': ['ristorant', 'pizzeria', 'trattoria', 'cucina', 'menu', 'cena', 'pranzo'],
      'parrucchiere': ['parrucchier', 'barbier', 'capelli', 'taglio', 'acconciatur'],
      'meccanico': ['meccanic', 'auto', 'riparazion', 'officina', 'carrozzeria'],
      'idraulico': ['idraulic', 'tubi', 'acqua', 'scarico', 'rubinett'],
      'elettricista': ['elettric', 'corrente', 'impiant', 'elettrico', 'prese'],
      'avvocato': ['avvocat', 'legale', 'diritto', 'tribunale', 'causa'],
      'commercialista': ['commercialist', 'contabilit', 'fiscale', 'dichiarazion', 'iva'],
      'dentista': ['dentist', 'denti', 'odontoiatr', 'implant', 'ortodont'],
      'veterinario': ['veterinari', 'animal', 'cane', 'gatto', 'pet'],
      'palestra': ['palestra', 'fitness', 'allenamento', 'sport', 'gym'],
      'farmacia': ['farmaci', 'medicinali', 'farmacia', 'salute'],
      'bar': ['bar', 'caffè', 'bibite', 'aperitivo', 'cocktail'],
      'gelateria': ['gelater', 'gelato', 'cono', 'coppetta'],
      'panificio': ['panifici', 'pane', 'forno', 'pasticceri'],
      'macelleria': ['maceller', 'carne', 'bistecca', 'affettati'],
      'negozio': ['negozio', 'boutique', 'shop', 'vendita', 'prodotti']
    };

    let businessType = 'servizio'; // default italiano
    let confidence = 0.3;

    for (const [type, keywords] of Object.entries(typeMappings)) {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        businessType = type;
        confidence = 0.8;
        break;
      }
    }

    // Estrazione nome business (cerca tra virgolette o dopo "sono" o simili)
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

    // Estrazione location italiana
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
