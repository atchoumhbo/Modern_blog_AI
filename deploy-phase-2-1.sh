#!/bin/bash

echo "🔄 Déploiement Phase 2.1: Database Schema N8N Workflows"
echo "========================================================"
echo ""

# 1. Pull latest code
echo "📥 1/5 - Pulling latest code from GitHub..."
cd /root/blog_strapi
git pull origin master

# 2. Apply Prisma migration
echo ""
echo "🗄️  2/5 - Applying Prisma migration..."
cd backend-mern
docker exec blog-backend npx prisma migrate deploy

# 3. Generate Prisma Client
echo ""
echo "⚙️  3/5 - Generating Prisma Client..."
docker exec blog-backend npx prisma generate

# 4. Initialize user budgets
echo ""
echo "💰 4/5 - Initializing user budgets..."
docker exec blog-backend npm run build
docker exec blog-backend node dist/init-user-budgets.js

# 5. Restart backend
echo ""
echo "🔄 5/5 - Restarting backend..."
cd /root/blog_strapi
docker compose -f docker-compose.mern-full.yml restart backend

echo ""
echo "✅ Phase 2.1 deployed successfully!"
echo ""
echo "📊 New tables created:"
echo "  - workflow_executions (tracking N8N runs)"
echo "  - workflow_steps (granular step tracking)"
echo "  - user_budgets (monthly budget per user)"
echo ""
echo "🎯 Next: Phase 2.2 - Backend API Services"
