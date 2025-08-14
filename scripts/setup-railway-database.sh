#!/bin/bash
# 🚀 Railway PostgreSQL Setup Script
# Configura database PostgreSQL per AI-Trainer

echo "🗄️ Setting up PostgreSQL Database on Railway..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Railway AI-Trainer Database Setup${NC}"
echo "=================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found. Please install it first:${NC}"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Login to Railway (if not already logged in)
echo -e "${YELLOW}🔐 Checking Railway authentication...${NC}"
railway login

# Create PostgreSQL service
echo -e "${YELLOW}🗄️ Adding PostgreSQL database...${NC}"
railway add --database postgresql

# Get database URL
echo -e "${YELLOW}🔗 Getting database connection string...${NC}"
DATABASE_URL=$(railway variables get DATABASE_URL)

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Failed to get DATABASE_URL${NC}"
    echo "Please add PostgreSQL service manually in Railway dashboard"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL database created successfully!${NC}"
echo -e "${BLUE}📝 Database URL: ${DATABASE_URL}${NC}"

# Set environment variables
echo -e "${YELLOW}⚙️ Setting environment variables...${NC}"
railway variables set NODE_ENV=production
railway variables set AI_TRAINER_API_KEY=ai-trainer-1e212623176704eea6dba3b62117d36c0f64d6512419defdd25226294c45a90d

# Deploy current version
echo -e "${YELLOW}🚀 Deploying with database...${NC}"
railway deploy

echo -e "${GREEN}🎉 Database setup completed!${NC}"
echo ""
echo -e "${BLUE}📊 What was created:${NC}"
echo "• PostgreSQL database on Railway"
echo "• Environment variables configured"  
echo "• Database schema will be auto-created on first run"
echo ""
echo -e "${BLUE}🔗 Access your database:${NC}"
echo "• Railway Dashboard: https://railway.app/dashboard"
echo "• Connect with: railway connect postgresql"
echo ""
echo -e "${BLUE}🧪 Test the application:${NC}"
echo "• URL: https://ai-trainer-production-8fd9.up.railway.app/"
echo "• Training data will now persist across deployments!"
