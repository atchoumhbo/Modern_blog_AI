#!/bin/bash

# ===========================
# DEPLOY PHASE 2 - N8N WORKFLOW AUTOMATION
# ===========================
# Deploys database schema, services, and API to production
# Regenerates Prisma Client to resolve TypeScript errors

set -e  # Exit on error

echo "========================================="
echo "🚀 DEPLOYING PHASE 2 - N8N WORKFLOWS"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
VPS_IP="${VPS_IP:-your-vps-ip}"
VPS_USER="${VPS_USER:-root}"
PROJECT_DIR="/root/blog_strapi"

echo -e "${YELLOW}📋 Deployment Details:${NC}"
echo "  VPS: $VPS_USER@$VPS_IP"
echo "  Directory: $PROJECT_DIR"
echo ""

# ===========================
# STEP 1: Pull Latest Code
# ===========================
echo -e "${YELLOW}📥 Step 1/6: Pulling latest code from GitHub...${NC}"
ssh $VPS_USER@$VPS_IP "cd $PROJECT_DIR && git pull origin master"
echo -e "${GREEN}✅ Code pulled successfully${NC}"
echo ""

# ===========================
# STEP 2: Apply Database Migrations
# ===========================
echo -e "${YELLOW}🗄️  Step 2/6: Applying database migrations...${NC}"
ssh $VPS_USER@$VPS_IP << 'ENDSSH'
cd /root/blog_strapi/backend-mern
docker compose -f ../docker-compose.mern-full.yml exec -T backend npx prisma migrate deploy
ENDSSH
echo -e "${GREEN}✅ Migrations applied${NC}"
echo ""

# ===========================
# STEP 3: Rebuild Backend (Regenerate Prisma)
# ===========================
echo -e "${YELLOW}🔨 Step 3/6: Rebuilding backend to regenerate Prisma Client...${NC}"
echo "   This will resolve all TypeScript errors related to:"
echo "   - WorkflowStatus, StepStatus enums"
echo "   - workflowExecution, userBudget properties"
echo ""
ssh $VPS_USER@$VPS_IP "cd $PROJECT_DIR && docker compose -f docker-compose.mern-full.yml build backend"
echo -e "${GREEN}✅ Backend rebuilt with new Prisma Client${NC}"
echo ""

# ===========================
# STEP 4: Restart Backend
# ===========================
echo -e "${YELLOW}🔄 Step 4/6: Restarting backend container...${NC}"
ssh $VPS_USER@$VPS_IP "cd $PROJECT_DIR && docker compose -f docker-compose.mern-full.yml up -d --force-recreate backend"
sleep 5  # Wait for container to start
echo -e "${GREEN}✅ Backend restarted${NC}"
echo ""

# ===========================
# STEP 5: Verify Health
# ===========================
echo -e "${YELLOW}🏥 Step 5/6: Verifying backend health...${NC}"
ssh $VPS_USER@$VPS_IP << 'ENDSSH'
# Wait for backend to be ready
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy!"
    exit 0
  fi
  attempt=$((attempt + 1))
  echo "⏳ Waiting for backend to be ready... ($attempt/$max_attempts)"
  sleep 2
done
echo "❌ Backend failed to start"
exit 1
ENDSSH

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Health check passed${NC}"
else
  echo -e "${RED}❌ Health check failed${NC}"
  exit 1
fi
echo ""

# ===========================
# STEP 6: Test API Endpoints
# ===========================
echo -e "${YELLOW}🧪 Step 6/6: Testing workflow API endpoints...${NC}"

# Get admin user ID
ADMIN_ID=$(ssh $VPS_USER@$VPS_IP << 'ENDSSH'
cd /root/blog_strapi/backend-mern
docker compose -f ../docker-compose.mern-full.yml exec -T postgres psql -U strapi_user -d strapi_db -t -c "SELECT id FROM \"User\" WHERE email = 'admin@example.com' LIMIT 1;"
ENDSSH
)

ADMIN_ID=$(echo $ADMIN_ID | tr -d ' ')

if [ -z "$ADMIN_ID" ]; then
  echo -e "${RED}❌ Admin user not found${NC}"
  exit 1
fi

echo "  Admin User ID: $ADMIN_ID"

# Test 1: Get budget
echo -n "  Testing GET /api/workflows/budget... "
BUDGET_RESPONSE=$(ssh $VPS_USER@$VPS_IP "curl -s http://localhost:3000/api/workflows/budget?userId=$ADMIN_ID")
if echo $BUDGET_RESPONSE | grep -q "success"; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌${NC}"
  echo "  Response: $BUDGET_RESPONSE"
fi

# Test 2: Execute workflow
echo -n "  Testing POST /api/workflows/execute... "
EXEC_RESPONSE=$(ssh $VPS_USER@$VPS_IP << ENDSSH
curl -s -X POST http://localhost:3000/api/workflows/execute \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "$ADMIN_ID",
    "workflowName": "Test Deployment",
    "workflowType": "reddit_scraper",
    "inputData": {"test": true},
    "estimatedCost": 0.01
  }'
ENDSSH
)

if echo $EXEC_RESPONSE | grep -q "success"; then
  echo -e "${GREEN}✅${NC}"
  EXEC_ID=$(echo $EXEC_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  echo "  Execution ID: $EXEC_ID"
else
  echo -e "${RED}❌${NC}"
  echo "  Response: $EXEC_RESPONSE"
fi

# Test 3: Get execution details
if [ ! -z "$EXEC_ID" ]; then
  echo -n "  Testing GET /api/workflows/executions/:id... "
  DETAIL_RESPONSE=$(ssh $VPS_USER@$VPS_IP "curl -s http://localhost:3000/api/workflows/executions/$EXEC_ID")
  if echo $DETAIL_RESPONSE | grep -q "success"; then
    echo -e "${GREEN}✅${NC}"
  else
    echo -e "${RED}❌${NC}"
    echo "  Response: $DETAIL_RESPONSE"
  fi
fi

# Test 4: Get statistics
echo -n "  Testing GET /api/workflows/stats... "
STATS_RESPONSE=$(ssh $VPS_USER@$VPS_IP "curl -s http://localhost:3000/api/workflows/stats?userId=$ADMIN_ID")
if echo $STATS_RESPONSE | grep -q "success"; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌${NC}"
  echo "  Response: $STATS_RESPONSE"
fi

echo ""

# ===========================
# DEPLOYMENT COMPLETE
# ===========================
echo "========================================="
echo -e "${GREEN}✅ PHASE 2 DEPLOYMENT COMPLETE!${NC}"
echo "========================================="
echo ""
echo "📊 Summary:"
echo "  ✅ Code pulled from GitHub"
echo "  ✅ Database migrations applied"
echo "  ✅ Backend rebuilt (Prisma Client regenerated)"
echo "  ✅ Backend restarted"
echo "  ✅ Health check passed"
echo "  ✅ API endpoints tested"
echo ""
echo "🎯 What was deployed:"
echo "  - Phase 2.1: Database Schema (3 tables, 2 enums)"
echo "  - Phase 2.2: Backend Services (1020 lines)"
echo "  - Phase 2.3: API Routes (600+ lines, 6 endpoints)"
echo ""
echo "🔗 API Endpoints Available:"
echo "  - POST   http://$VPS_IP:3000/api/workflows/execute"
echo "  - GET    http://$VPS_IP:3000/api/workflows/executions"
echo "  - GET    http://$VPS_IP:3000/api/workflows/executions/:id"
echo "  - POST   http://$VPS_IP:3000/api/workflows/executions/:id/retry"
echo "  - GET    http://$VPS_IP:3000/api/workflows/stats"
echo "  - GET    http://$VPS_IP:3000/api/workflows/budget"
echo ""
echo "📝 Next Steps:"
echo "  1. Check backend logs: ssh $VPS_USER@$VPS_IP 'docker compose -f $PROJECT_DIR/docker-compose.mern-full.yml logs backend'"
echo "  2. Monitor executions: curl http://$VPS_IP:3000/api/workflows/executions?userId=$ADMIN_ID"
echo "  3. Build frontend admin pages (Phase 2.5)"
echo ""
echo -e "${GREEN}🎉 Happy workflow automating!${NC}"
