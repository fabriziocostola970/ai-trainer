#!/bin/bash
# 🗄️ Apply Visual Extension Schema to Railway AI-Trainer Database

echo "🎨 Applying AI-Trainer Visual Extension Schema to Railway..."

# Database URL from Railway AI-Trainer service
# You need to get this from Railway dashboard: ai-trainer-production > Database > Connect
DATABASE_URL="YOUR_RAILWAY_AI_TRAINER_DATABASE_URL_HERE"

# Check if DATABASE_URL is set
if [[ "$DATABASE_URL" == "YOUR_RAILWAY_AI_TRAINER_DATABASE_URL_HERE" ]]; then
    echo "❌ Please set the correct DATABASE_URL from Railway AI-Trainer dashboard"
    echo "📍 Go to: Railway > ai-trainer-production > Database > Connect"
    echo "📋 Copy the PostgreSQL connection string and paste it above"
    exit 1
fi

echo "📡 Connecting to Railway PostgreSQL..."
echo "🔗 Database: ${DATABASE_URL:0:50}..."

# Apply the visual extension schema
echo "🎨 Creating design pattern tables..."
psql "$DATABASE_URL" -f database/schema-visual-extension.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema applied successfully!"
    
    # Verify tables were created
    echo "📊 Verifying created tables..."
    psql "$DATABASE_URL" -c "
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name IN ('design_patterns', 'color_harmonies', 'visual_analytics', 'design_recommendations')
    ORDER BY table_name, ordinal_position;
    "
    
    echo "🎯 AI-Trainer Design System ready!"
else
    echo "❌ Schema application failed!"
    exit 1
fi
