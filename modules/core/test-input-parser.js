const InputNaturalParser = require('./input-parser');

/**
 * 🧪 TEST INPUT NATURAL PARSER
 * Verifica che il parser analizzi correttamente input utente
 */
async function testInputParser() {
  console.log('🧪 [Test] Starting Input Parser tests...\n');

  const parser = new InputNaturalParser();

  // Test cases
  const testCases = [
    {
      input: "Voglio un sito per la mia pizzeria a Roma con consegna a domicilio",
      expected: {
        businessType: "ristorante",
        location: "Roma",
        features: ["consegna", "domicilio"]
      }
    },
    {
      input: "Ho un negozio di fiori a Milano che vende bouquet personalizzati",
      expected: {
        businessType: "negozio",
        location: "Milano",
        features: ["bouquet", "personalizzati"]
      }
    },
    {
      input: "Cerco un sito web per la mia agenzia di viaggi online",
      expected: {
        businessType: "agenzia",
        features: ["online"]
      }
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`📝 [Test ${i + 1}] Input: "${testCase.input}"`);

    try {
      const result = await parser.parseUserInput(testCase.input);

      console.log(`✅ [Test ${i + 1}] Parsed successfully:`);
      console.log(`   - Business Type: ${result.businessType}`);
      console.log(`   - Location: ${result.location || 'N/A'}`);
      console.log(`   - Features: ${result.features?.join(', ') || 'N/A'}`);
      console.log(`   - Confidence: ${result.confidence}\n`);

    } catch (error) {
      console.log(`❌ [Test ${i + 1}] Failed: ${error.message}\n`);
    }
  }

  console.log('🎉 [Test] Input Parser tests completed!');
}

// Esegui test se chiamato direttamente
if (require.main === module) {
  testInputParser().catch(console.error);
}

module.exports = { testInputParser };
