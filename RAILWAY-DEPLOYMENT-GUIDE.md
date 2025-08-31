# 🚀 RAILWAY DEPLOYMENT CONFIGURATION
# Guida per configurare correttamente le variabili d'ambiente su Railway

## 📋 VARIABILI RICHIESTE PER IL BACKEND (ai-trainer)

### 🔑 API Keys (Configura nel Railway Dashboard)
```
OPENAI_API_KEY=sk-proj-...          # Tua chiave OpenAI
ANTHROPIC_API_KEY=sk-ant-api03-...  # Tua chiave Claude (opzionale)
UNSPLASH_ACCESS_KEY=...             # Tua chiave Unsplash
AI_TRAINER_API_KEY=ai-trainer-...   # Genera con: node -e "console.log('ai-trainer-' + require('crypto').randomBytes(32).toString('hex'))"
```

### 🗄️ Database (Fornito automaticamente da Railway PostgreSQL)
```
DATABASE_URL=postgresql://...       # Fornito dal servizio PostgreSQL
```

### ⚙️ Configurazione Sistema
```
NODE_ENV=production
PORT=4000
CORS_ORIGIN=https://ai-trainer-production.up.railway.app
COMPETITOR_ANALYSIS_ENABLED=true
MAX_COMPETITOR_SCRAPING=30
```

## 🌐 VARIABILI RICHIESTE PER IL FRONTEND (vendionline-eu)

### 🔗 Backend Connection
```
AI_TRAINER_URL=https://ai-trainer-production.up.railway.app
AI_TRAINER_API_KEY=ai-trainer-...   # Stessa chiave del backend
```

### 🗄️ Database (Stesso del backend)
```
DATABASE_URL=postgresql://...       # Stessa connessione del backend
DIRECT_URL=postgresql://...         # Per Prisma
```

### 🔑 API Keys (Stesse del backend)
```
OPENAI_API_KEY=sk-proj-...
CLAUDE_API_KEY=sk-ant-api03-...
```

### ⚙️ Configurazione Next.js
```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
COMPETITOR_ANALYSIS_ENABLED=true
```

## 🔧 SETUP RAILWAY

### 1. Backend (ai-trainer)
1. Crea nuovo progetto Railway
2. Aggiungi servizio PostgreSQL
3. Aggiungi servizio per il backend (ai-trainer)
4. Nel backend service → Variables:
   - Aggiungi tutte le variabili sopra
   - `AI_TRAINER_API_KEY` deve essere la stessa in entrambi i servizi

### 2. Frontend (vendionline-eu)
1. Nel progetto Railway esistente
2. Aggiungi servizio per il frontend
3. Nel frontend service → Variables:
   - Aggiungi tutte le variabili frontend
   - `AI_TRAINER_URL` deve puntare al backend service
   - `AI_TRAINER_API_KEY` deve essere la stessa del backend

### 3. Connessioni
- Frontend chiama Backend via `AI_TRAINER_URL`
- Entrambi usano lo stesso database PostgreSQL
- Backend espone API su porta 4000
- Frontend espone web app su porta 3000

## ✅ VERIFICA CONFIGURAZIONE

Dopo il deploy, testa:
1. Frontend: `https://your-frontend.railway.app`
2. Backend health: `https://your-backend.railway.app/health`
3. Competitor API: `POST https://your-frontend.railway.app/api/ai/analyze-competitors`

## 🔍 TROUBLESHOOTING

- **Errore connessione backend**: Verifica `AI_TRAINER_URL` e `AI_TRAINER_API_KEY`
- **Errore database**: Verifica che entrambi i servizi usino lo stesso PostgreSQL
- **Errore API keys**: Verifica che le chiavi OpenAI siano valide
- **Errore CORS**: Verifica `CORS_ORIGIN` nel backend

## 📝 NOTE IMPORTANTI

- Le API keys sono sensibili - non committarle mai su Git
- `AI_TRAINER_API_KEY` deve essere identica in frontend e backend
- Il database PostgreSQL deve essere condiviso tra i due servizi
- Dopo modifiche alle variabili, fai redeploy dei servizi
