# 🤖 AI-Trainer - Template Intelligence Engine

> **Sistema AI autonomo e creativo per VendiOnline.EU** che genera template originali, ottimizza layout semantici e crea nuovi tipi di blocchi basati su intelligenza artificiale.

![Version](https://img.shields.io/badge/version-1.0.0--alpha-blue)
![Node.js](https://img.shields.io/badge/node.js-18+-green)
![Status](https://img.shields.io/badge/status-🚀%20OPERATIVO-brightgreen)

## 🎯 **Obiettivo Principale**

Sviluppare un **sistema AI autonomo e creativo** che, basandosi sui template mostrati durante il training, sia in grado di:

- 🆕 **Generare nuovi template originali** partendo da dataset di esempi
- 🎨 **Creare nuovi design grafici** e combinazioni di stili  
- 🧩 **Inventare nuovi tipi di blocchi** non presenti nel sistema base
- 🎯 **Adattare creativamente** i template alle esigenze specifiche del business

## ✨ **Features**

### 🎨 **Creative Template Generation**
- Generazione automatica di template originali
- Palette colori intelligenti
- Tipografia adattiva per settore
- Micro-interazioni e animazioni

### 🧠 **Intelligent Layout System**  
- Posizionamento semantico automatico
- Ottimizzazione ordine blocchi
- Navigation block positioning fix
- Responsive design automatico

### 🚀 **Autonomous Design Engine**
- Comprensione contestuale del business
- A/B testing automatico di varianti
- Predizione performance design
- Accessibilità WCAG integrata

## 🚀 **Quick Start**

### Prerequisiti
- Node.js 18+
- npm o yarn

### Installazione
```bash
# Clone repository
git clone https://github.com/TUO_USERNAME/ai-trainer.git
cd ai-trainer

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Configura le API keys in .env

# Start server
npm start
```

### Test API
```bash
# Health check
curl http://localhost:4000/health

# Test layout generation
curl -X POST http://localhost:4000/api/generate/layout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ai-trainer-secret-key-123" \
  -d '{"businessType":"restaurant","currentBlocks":[]}'
```

## 📡 **API Endpoints**

| Endpoint | Method | Descrizione |
|----------|--------|-------------|
| `/health` | GET | Health check del server |
| `/api/generate/layout` | POST | Generazione layout semantici |
| `/api/generate/template` | POST | Generazione template creativi |
| `/api/optimize/blocks` | POST | Ottimizzazione ordine blocchi |
| `/api/validate/template` | POST | Validazione template |

### Esempio Risposta Layout
```json
{
  "success": true,
  "layout": [
    {"type": "navigation", "title": "Menu"},
    {"type": "hero", "title": "Welcome"}
  ],
  "semanticScore": 85,
  "designScore": 78,
  "recommendations": [
    "Consider moving navigation to top",
    "Hero section could benefit from stronger CTA"
  ]
}
```

## 🏗️ **Architettura**

```
ai-trainer/
├── 📄 server.js                   # API server principale
├── 📁 src/
│   ├── 📁 api/                    # REST API endpoints
│   │   ├── generate-layout.js     # Generazione layout
│   │   ├── optimize-blocks.js     # Ottimizzazione blocchi
│   │   └── validate-template.js   # Validazione template
│   ├── 📁 ai/                     # Core AI logic
│   └── 📁 templates/              # Template library
├── 📁 data/                       # Training datasets
└── 📁 tests/                      # Testing suite
```

## 🔗 **Integrazione con VendiOnline.EU**

```javascript
// Hook personalizzato in VendiOnline.EU
const useAITemplates = () => {
  const generateIntelligentLayout = async (businessData) => {
    const response = await fetch(`${AI_TRAINER_API}/api/generate/layout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_TRAINER_API_KEY}`
      },
      body: JSON.stringify(businessData)
    });
    return await response.json();
  };
  
  return { generateIntelligentLayout };
};
```

## 🧪 **Testing**

```bash
# Run test suite
npm test

# Test API endpoints
node test-api.js

# Full test suite
node test-full.js
```

### Test Results ✅
- **Health Check**: OK
- **Layout Generation**: 85/100 semantic score
- **Creative Templates**: 89/100 creativity score  
- **API Authentication**: Working
- **Error Handling**: Robust

## 🛠️ **Configuration**

### Environment Variables
```bash
# Server
NODE_ENV=development
PORT=4000
AI_TRAINER_API_KEY=your-secret-key

# AI Services (optional)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Database (shared with VendiOnline.EU)
DATABASE_URL=postgresql://localhost:5432/vendionline_db
```

## 📅 **Roadmap**

### ✅ Settimana 1 (11-17 Agosto) - COMPLETATA
- [x] Setup progetto e struttura directory
- [x] Implementazione API base (server.js + endpoints)
- [x] Core TemplateIntelligence class (mock)
- [x] NavigationSolver per fix positioning
- [x] Testing integrazione con VendiOnline.EU

### 📅 Settimana 2 (18-24 Agosto)
- [ ] Training dataset completo (100+ esempi)
- [ ] Fine-tuning AI model per template generation
- [ ] Business-specific templates implementation
- [ ] Advanced semantic rules engine
- [ ] Performance optimization

### 📅 Settimana 3 (25-31 Agosto)
- [ ] Production deployment (Railway/Vercel)
- [ ] Advanced features (A/B testing layouts)
- [ ] Analytics e metrics collection
- [ ] Documentation completa
- [ ] Beta testing con utenti reali

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 **License**

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 **Support**

- 📧 Email: support@vendionline.eu
- 🐛 Issues: [GitHub Issues](https://github.com/TUO_USERNAME/ai-trainer/issues)
- 📖 Documentation: [PROJECT-GUIDE-AI.MD](./PROJECT-GUIDE-AI.MD)

---

**Ready to build the future of intelligent web design!** 🚀✨
