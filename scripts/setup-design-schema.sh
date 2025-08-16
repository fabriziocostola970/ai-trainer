#!/bin/bash
# 🗄️ Setup Railway AI-Trainer Database Schema Extension
# Aggiunge le tabelle per il design pattern system

echo "🗄️ Setting up AI-Trainer Design Schema on Railway..."

# Railway PostgreSQL connection from environment
DATABASE_URL=${DATABASE_URL:-"postgresql://postgres:password@localhost:5432/ai_trainer"}

echo "📡 Connecting to Railway PostgreSQL..."
echo "🔗 Database URL: ${DATABASE_URL}"

# Execute visual extension schema
echo "🎨 Creating design pattern tables..."
psql "$DATABASE_URL" -f database/schema-visual-extension.sql

echo "📊 Checking created tables..."
psql "$DATABASE_URL" -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%design%' 
  OR table_name LIKE '%color%' 
  OR table_name LIKE '%visual%';
"

echo "✅ AI-Trainer Design Schema Setup Complete!"
echo "🎯 Ready for design pattern generation!"
