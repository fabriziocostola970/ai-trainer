#!/bin/bash
# 🔧 Script per applicare fix constraint su Railway Database

echo "🔧 Applying unique constraint fix to Railway database..."

# Leggi le variabili di ambiente Railway per PostgreSQL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found. Make sure you're running this on Railway."
    exit 1
fi

echo "📋 Executing schema fix..."

# Esegui lo script SQL
psql $DATABASE_URL -f /app/scripts/fix-unique-constraint.sql

if [ $? -eq 0 ]; then
    echo "✅ Constraint fix applied successfully!"
    echo "🎯 Now ai_design_patterns supports multiple competitors per business_type"
else
    echo "❌ Error applying constraint fix"
    exit 1
fi
