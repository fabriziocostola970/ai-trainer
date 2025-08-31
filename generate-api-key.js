#!/usr/bin/env node

/**
 * 🚀 AI-TRAINER API KEY GENERATOR
 *
 * Genera una chiave API sicura per l'autenticazione tra frontend e backend.
 * Uso: node generate-api-key.js
 */

const crypto = require('crypto');

// Genera una chiave API sicura
const apiKey = 'ai-trainer-' + crypto.randomBytes(32).toString('hex');

console.log('🔑 AI-TRAINER API KEY GENERATED');
console.log('================================');
console.log(`API Key: ${apiKey}`);
console.log('');
console.log('📋 ISTRUZIONI:');
console.log('1. Copia questa chiave');
console.log('2. Aggiungila come variabile AI_TRAINER_API_KEY in entrambi i servizi Railway:');
console.log('   - Backend (ai-trainer)');
console.log('   - Frontend (vendionline-eu)');
console.log('');
console.log('⚠️  IMPORTANTE:');
console.log('- Usa la stessa chiave in entrambi i servizi');
console.log('- Non condividere questa chiave pubblicamente');
console.log('- Conservala in un posto sicuro');
console.log('');
console.log('✅ CONFIGURAZIONE COMPLETA:');
console.log('- Backend: AI_TRAINER_API_KEY="' + apiKey + '"');
console.log('- Frontend: AI_TRAINER_API_KEY="' + apiKey + '"');
