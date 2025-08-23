# 🤖 Claude Sonnet Website Generator

Sistema parallelo per generazione intelligente di siti web utilizzando Claude Sonnet e pattern learning dal database esistente.

## 🎯 **CARATTERISTICHE PRINCIPALI**

### ✅ **Pattern Learning Intelligence**
- Analizza pattern esistenti da database `ai_design_patterns`
- Calcola numero sezioni ottimale basato su successi reali
- Rileva sezioni più comuni per ogni business type
- Usa quality score per determinare best practices

### ✅ **Business Complexity Detection**
- Rileva automaticamente complessità business dal nome
- Enterprise/Corporation → 8-10 complessità → 6-8 sezioni
- Chain/Franchise → 6-7 complessità → 5-6 sezioni  
- Local/Family → 3-4 complessità → 3-4 sezioni

### ✅ **Intelligent Prompting**
- Genera prompt dinamici basati sui pattern appresi
- Adatta numero sezioni alla complessità rilevata
- Include best practices specifiche per business type
- Evita duplicazione contatti (solo 1 sezione)

### ✅ **Sistema Parallelo**
- NON modifica sistema AI-Trainer esistente
- Compatibile con VendiOnline.EU
- Usa stesso database e autenticazione
- Fallback automatico al sistema classico

## 🚀 **ENDPOINT DISPONIBILI**

### `POST /api/claude/generate`
Genera sito web utilizzando Claude Sonnet con intelligence.

**Request:**
```json
{
  "businessName": "Fioraio delle Rose",
  "businessType": "florist"
}
```

**Response:**
```json
{
  "success": true,
  "website": {
    "businessName": "Fioraio delle Rose",
    "businessType": "florist", 
    "complexity": 4,
    "totalSections": 4,
    "sections": [
      {
        "id": "seasonal-arrangements-1",
        "type": "SeasonalArrangements-ai-dynamic",
        "title": "Composizioni Stagionali",
        "description": "...",
        "items": [...],
        "hasContacts": false
      },
      {
        "id": "contact-4", 
        "type": "Contact-ai-dynamic",
        "title": "Contatti",
        "description": "...",
        "items": [...],
        "hasContacts": true
      }
    ],
    "design": {
      "primaryColor": "#E91E63",
      "secondaryColor": "#4CAF50",
      "accentColor": "#FF9800",
      "style": "modern",
      "businessPersonality": "..."
    }
  },
  "metadata": {
    "generatedBy": "claude-sonnet",
    "basedOnPatterns": 12,
    "complexity": 4,
    "processingTime": "1.2s"
  }
}
```

### `GET /api/claude/patterns/:businessType`
Analizza pattern esistenti per un business type.

**Response:**
```json
{
  "businessType": "florist",
  "patterns": {
    "totalPatterns": 12,
    "avgSections": 4.2,
    "minSections": 3,
    "maxSections": 6,
    "commonSections": [
      {"name": "seasonal-arrangements", "frequency": "83.3"},
      {"name": "custom-bouquets", "frequency": "75.0"},
      {"name": "wedding-services", "frequency": "66.7"}
    ],
    "qualityRange": {
      "min": 7.2,
      "max": 9.1, 
      "avg": "8.4"
    }
  }
}
```

## 🧠 **LOGICA DI FUNZIONAMENTO**

### 1. **Pattern Analysis**
```
Input: businessType = "florist"
↓
Query database ai_design_patterns 
↓
Analisi pattern di successo (quality > 7.0)
↓
Calcolo statistiche: avg sections, common sections, etc.
```

### 2. **Complexity Detection**
```
Input: businessName = "McDonald's Enterprise"
↓
Analisi keywords: enterprise, corporation, chain, local, etc.
↓
Assegnazione complexity score: 1-10
↓
Adattamento basato su pattern storici business type
```

### 3. **Intelligent Prompt Generation**
```
Pattern data + Complexity score
↓
Genera prompt ottimizzato per Claude
↓
Include: numero sezioni, business guidance, contact rules
↓
Prompt personalizzato per massimo successo
```

### 4. **Website Generation**
```
Claude riceve prompt intelligente
↓
Genera struttura ottimizzata
↓
Solo 1 sezione con contatti
↓
Sezioni specifiche per business type e complexity
```

## 🎯 **ESEMPI DI UTILIZZO**

### Business Locale Semplice
```javascript
const result = await fetch('/api/claude/generate', {
  method: 'POST',
  body: JSON.stringify({
    businessName: 'Pizzeria Mario',  // Complexity: 3
    businessType: 'restaurant'
  })
});
// Risultato: 3-4 sezioni, design semplice
```

### Business Enterprise Complesso  
```javascript
const result = await fetch('/api/claude/generate', {
  method: 'POST',
  body: JSON.stringify({
    businessName: 'McDonald\'s Corporation',  // Complexity: 8
    businessType: 'restaurant' 
  })
});
// Risultato: 6-8 sezioni, design sofisticato
```

### Analisi Pattern
```javascript
const patterns = await fetch('/api/claude/patterns/technology');
// Mostra: sezioni comuni tech, numero medio sezioni, best practices
```

## 🔧 **INTEGRAZIONE CON VENDIONLINE.EU**

### Opzione 1: Sistema Parallelo
```javascript
// Nel frontend VendiOnline.EU
const generateWebsite = async (businessName, businessType) => {
  try {
    // Prova prima Claude (intelligente)
    const claudeResult = await generateWithClaude(businessName, businessType);
    
    if (claudeResult.success) {
      return claudeResult;
    }
  } catch (error) {
    console.log('Claude fallback to AI-Trainer');
  }
  
  // Fallback al sistema esistente
  return await generateWithAITrainer(businessName, businessType);
};
```

### Opzione 2: Scelta Utente
```javascript
// Aggiungi toggle nel UI
<button onClick={() => setGenerator('claude')}>🤖 Claude Sonnet</button>
<button onClick={() => setGenerator('ai-trainer')}>🎯 AI-Trainer</button>
```

## 📊 **VANTAGGI RISPETTO AL SISTEMA ESISTENTE**

| Caratteristica | AI-Trainer Esistente | Claude Sonnet |
|---|---|---|
| Numero sezioni | Fisso 3-4 | Dinamico 3-8 |
| Business complexity | Non rilevata | Auto-detection |
| Pattern learning | Limitato | Database completo |
| Duplicazione contatti | Presente | Risolto |
| Prompting | Statico | Intelligente |
| Fallback | Manual | Automatico |

## 🚨 **COMPATIBILITÀ**

### ✅ **Cosa NON cambia:**
- Sistema AI-Trainer esistente rimane intatto
- Database `ai_design_patterns` rimane uguale
- Autenticazione API rimane uguale
- VendiOnline.EU funziona come prima

### 🆕 **Cosa si aggiunge:**
- Nuovi endpoint `/api/claude/*`
- Pattern learning intelligence
- Business complexity detection
- Intelligent prompt generation

## 🔮 **ROADMAP FUTURA**

### V1.0 (Attuale)
- [x] Pattern analysis dal database esistente
- [x] Business complexity detection
- [x] Intelligent prompt generation  
- [x] Simulazione Claude response

### V1.1 (Prossimo)
- [ ] Vera integrazione Claude API
- [ ] Machine learning per complexity detection
- [ ] A/B testing con sistema esistente
- [ ] Feedback loop per migliorare pattern

### V2.0 (Futuro)
- [ ] Multi-language prompt generation
- [ ] Advanced pattern recognition
- [ ] Custom business type creation
- [ ] Real-time learning da feedback utenti

## 📋 **TESTING**

Usa il file `examples/claude-generator-test.js` per testare tutte le funzionalità:

```bash
node examples/claude-generator-test.js
```

## 🔐 **AUTENTICAZIONE**

Stesso sistema del AI-Trainer esistente:
```
Authorization: Bearer your-api-key-here
```

## 🏗️ **ARCHITETTURA**

```
VendiOnline.EU Frontend
         ↓
    Choose Generator
    ↙              ↘
Claude Generator    AI-Trainer Classic
    ↓                    ↓
Pattern Analysis    Fixed Templates  
    ↓                    ↓
Intelligent Prompt   Static Prompt
    ↓                    ↓
Claude API          OpenAI API
    ↓                    ↓
Smart Website       Standard Website
         ↘              ↙
      Website Preview
```

Il sistema Claude è **completamente parallelo** e non interferisce con quello esistente! 🎯
