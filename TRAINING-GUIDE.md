# 🤖 AI-TRAINER: Training Configuration Guide

## 🔑 API KEYS NEEDED FOR TRAINING

### 1. OpenAI API Key (GPT-4V per visual analysis)
- Account: https://platform.openai.com/
- Modello: gpt-4-vision-preview
- Costo stimato: $0.01-0.03 per immagine
- Budget consigliato: $20-50 per training completo

### 2. Anthropic API Key (Claude per HTML analysis) 
- Account: https://console.anthropic.com/
- Modello: claude-3.5-sonnet
- Costo stimato: $0.003 per 1K tokens
- Budget consigliato: $10-30 per training completo

## 🔧 SETUP CONFIGURATION

### Aggiungi al file .env:
```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-actual-openai-key-here
OPENAI_MODEL=gpt-4-vision-preview
OPENAI_DAILY_LIMIT=100

# Anthropic Configuration  
ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_DAILY_LIMIT=50

# Training Configuration
TRAINING_ENABLED=true
TRAINING_SAMPLES_PER_BATCH=5
TRAINING_DELAY_SECONDS=10
```

## 🚀 TRAINING COMMANDS

### Avvia training completo:
```bash
node training-start.js
```

### Solo raccolta dati (no AI analysis):
```bash
node training-start.js --collect-only
```

### Solo training su dati esistenti:
```bash
node training-start.js --train-only
```

## 📊 MONITORING TRAINING

Durante il training potrai monitorare:
- 📈 Progress nella dashboard: http://localhost:4000/training
- 💰 Costs in tempo reale
- 📄 Samples raccolti in `/data/training-samples/`
- 🤖 AI analysis results in `/data/processed/`

## ⚠️ IMPORTANT NOTES

1. **Cost Control**: Il training può costare $30-80 totali
2. **Rate Limits**: Rispettiamo i limits delle API (5-10 req/min)
3. **Quality Control**: Ogni sample viene validato automaticamente
4. **Backup**: Tutti i dati vengono salvati localmente

## 🎯 EXPECTED RESULTS

Dopo training completo avrai:
- ✅ 15-20 samples di alta qualità
- ✅ AI model addestrato per template generation
- ✅ Visual pattern recognition
- ✅ Business type classification
- ✅ Automated design scoring
