#!/bin/bash
# 🚀 Apply database migration for business_images column
# Run this script to add business_images column to Railway PostgreSQL

echo "🗄️ Applying migration: add-business-images-column.sql"

# Read DATABASE_URL from Railway
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable not set"
    echo "   Please set DATABASE_URL to your Railway PostgreSQL connection string"
    exit 1
fi

echo "✅ Found DATABASE_URL"
echo "🔄 Applying migration to database..."

# Apply migration
psql "$DATABASE_URL" -f database/migrations/add-business-images-column.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    echo "🎯 business_images column is now available in ai_design_patterns table"
else
    echo "❌ Migration failed!"
    exit 1
fi
