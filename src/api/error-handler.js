const OpenAI = require('openai');

/**
 * 🚨 ERROR HANDLER - Gestione fallimenti generazione siti
 * Chiede chiarimenti utente o sospende/avvisa admin
 */
class GenerationErrorHandler {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Gestisce un fallimento di generazione
   * @param {Object} context - { userId, businessType, input, error, attemptCount }
   * @returns {Object} - { action: 'ask_clarification'|'suspend'|'retry', message, clarificationQuestions }
   */
  async handleGenerationFailure(context) {
    try {
      console.log(`🚨 [Error Handler] Processing failure for user ${context.userId}: ${context.error}`);

      const { userId, businessType, input, error, attemptCount = 1 } = context;

      // Dopo 3 tentativi, sospendi e avvisa admin
      if (attemptCount >= 3) {
        await this.notifyAdmin(context);
        return {
          action: 'suspend',
          message: 'La generazione del sito è stata temporaneamente sospesa. Il nostro team è stato avvisato e ti contatterà presto.',
          clarificationQuestions: []
        };
      }

      // Genera domande di chiarimento basate sull'errore
      const clarification = await this.generateClarificationQuestions(businessType, input, error);

      return {
        action: 'ask_clarification',
        message: 'Ho bisogno di qualche chiarimento per creare il tuo sito perfetto. Puoi rispondere a queste domande?',
        clarificationQuestions: clarification.questions
      };

    } catch (error) {
      console.error(`❌ [Error Handler] Handler failed:`, error);
      return {
        action: 'suspend',
        message: 'Si è verificato un errore imprevisto. Il nostro team è stato avvisato.',
        clarificationQuestions: []
      };
    }
  }

  /**
   * Genera domande di chiarimento specifiche
   */
  async generateClarificationQuestions(businessType, userInput, error) {
    try {
      const prompt = `Un utente ha descritto il suo business così: "${userInput}"
Tipo di business: ${businessType}
Errore durante la generazione: ${error}

Genera 3-5 domande specifiche per ottenere chiarimenti che aiutino a creare un sito web migliore.
Le domande devono essere:
- Specifiche per il tipo di business
- Actionable (risposte utili per il design del sito)
- In italiano se l'input originale è in italiano

Rispondi con JSON:
{
  "questions": ["Domanda 1?", "Domanda 2?", ...]
}`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.3
      });

      const result = JSON.parse(completion.choices[0].message.content.trim());
      return result;

    } catch (error) {
      console.error(`❌ [Clarification] Generation failed:`, error);
      // Fallback domande generiche
      return {
        questions: [
          `Puoi descrivere meglio i tuoi prodotti/servizi principali?`,
          `Qual è la tua ubicazione principale?`,
          `Hai preferenze specifiche per i colori o lo stile del sito?`,
          `Quali informazioni di contatto vuoi mostrare?`
        ]
      };
    }
  }

  /**
   * Notifica l'amministratore di un problema critico
   */
  async notifyAdmin(context) {
    try {
      console.log(`📧 [Admin Notification] Notifying admin about critical failure`);

      // Qui puoi integrare email service, Slack, etc.
      // Per ora, log dettagliato
      const notification = {
        type: 'GENERATION_FAILURE',
        userId: context.userId,
        businessType: context.businessType,
        input: context.input,
        error: context.error,
        attemptCount: context.attemptCount,
        timestamp: new Date().toISOString()
      };

      console.error(`🚨 CRITICAL FAILURE NOTIFICATION:`, JSON.stringify(notification, null, 2));

      // TODO: Integrazione con servizio email/admin dashboard

    } catch (error) {
      console.error(`❌ [Admin Notification] Failed:`, error);
    }
  }

  /**
   * Salva stato di errore nel database per recovery
   */
  async saveErrorState(context) {
    // TODO: Implementare salvataggio in DB per recovery automatica
    console.log(`💾 [Error State] Saving error state for user ${context.userId}`);
  }
}

module.exports = GenerationErrorHandler;
