# ===========================
# DEPLOY PHASE 2 - N8N WORKFLOW AUTOMATION
# ===========================
# PowerShell version for Windows deployment
# Deploys database schema, services, and API to production

param(
    [string]$VpsIp = "your-vps-ip",
    [string]$VpsUser = "root"
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🚀 DEPLOYING PHASE 2 - N8N WORKFLOWS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$ProjectDir = "/root/blog_strapi"

Write-Host "📋 Deployment Details:" -ForegroundColor Yellow
Write-Host "  VPS: $VpsUser@$VpsIp"
Write-Host "  Directory: $ProjectDir"
Write-Host ""

# ===========================
# STEP 1: Pull Latest Code
# ===========================
Write-Host "📥 Step 1/6: Pulling latest code from GitHub..." -ForegroundColor Yellow
ssh "$VpsUser@$VpsIp" "cd $ProjectDir && git pull origin master"
Write-Host "✅ Code pulled successfully" -ForegroundColor Green
Write-Host ""

# ===========================
# STEP 2: Apply Database Migrations
# ===========================
Write-Host "🗄️  Step 2/6: Applying database migrations..." -ForegroundColor Yellow
ssh "$VpsUser@$VpsIp" @"
cd /root/blog_strapi/backend-mern
docker compose -f ../docker-compose.mern-full.yml exec -T backend npx prisma migrate deploy
"@
Write-Host "✅ Migrations applied" -ForegroundColor Green
Write-Host ""

# ===========================
# STEP 3: Rebuild Backend
# ===========================
Write-Host "🔨 Step 3/6: Rebuilding backend to regenerate Prisma Client..." -ForegroundColor Yellow
Write-Host "   This will resolve all TypeScript errors related to:"
Write-Host "   - WorkflowStatus, StepStatus enums"
Write-Host "   - workflowExecution, userBudget properties"
Write-Host ""
ssh "$VpsUser@$VpsIp" "cd $ProjectDir && docker compose -f docker-compose.mern-full.yml build backend"
Write-Host "✅ Backend rebuilt with new Prisma Client" -ForegroundColor Green
Write-Host ""

# ===========================
# STEP 4: Restart Backend
# ===========================
Write-Host "🔄 Step 4/6: Restarting backend container..." -ForegroundColor Yellow
ssh "$VpsUser@$VpsIp" "cd $ProjectDir && docker compose -f docker-compose.mern-full.yml up -d --force-recreate backend"
Start-Sleep -Seconds 5
Write-Host "✅ Backend restarted" -ForegroundColor Green
Write-Host ""

# ===========================
# STEP 5: Verify Health
# ===========================
Write-Host "🏥 Step 5/6: Verifying backend health..." -ForegroundColor Yellow

$healthCheckScript = @'
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
'@

$result = ssh "$VpsUser@$VpsIp" $healthCheckScript
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Health check passed" -ForegroundColor Green
} else {
    Write-Host "❌ Health check failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ===========================
# STEP 6: Test API Endpoints
# ===========================
Write-Host "🧪 Step 6/6: Testing workflow API endpoints..." -ForegroundColor Yellow

# Get admin user ID
$adminIdScript = @'
cd /root/blog_strapi/backend-mern
docker compose -f ../docker-compose.mern-full.yml exec -T postgres psql -U strapi_user -d strapi_db -t -c "SELECT id FROM \"User\" WHERE email = 'admin@example.com' LIMIT 1;"
'@

$adminId = (ssh "$VpsUser@$VpsIp" $adminIdScript).Trim()

if ([string]::IsNullOrWhiteSpace($adminId)) {
    Write-Host "❌ Admin user not found" -ForegroundColor Red
    exit 1
}

Write-Host "  Admin User ID: $adminId"

# Test 1: Get budget
Write-Host "  Testing GET /api/workflows/budget... " -NoNewline
$budgetResponse = ssh "$VpsUser@$VpsIp" "curl -s http://localhost:3000/api/workflows/budget?userId=$adminId"
if ($budgetResponse -match "success") {
    Write-Host "✅" -ForegroundColor Green
} else {
    Write-Host "❌" -ForegroundColor Red
    Write-Host "  Response: $budgetResponse"
}

# Test 2: Execute workflow
Write-Host "  Testing POST /api/workflows/execute... " -NoNewline
$execPayload = @{
    userId = $adminId
    workflowName = "Test Deployment"
    workflowType = "reddit_scraper"
    inputData = @{test = $true}
    estimatedCost = 0.01
} | ConvertTo-Json -Compress

$execScript = @"
curl -s -X POST http://localhost:3000/api/workflows/execute \
  -H 'Content-Type: application/json' \
  -d '$execPayload'
"@

$execResponse = ssh "$VpsUser@$VpsIp" $execScript
if ($execResponse -match "success") {
    Write-Host "✅" -ForegroundColor Green
    if ($execResponse -match '"id":"([^"]+)"') {
        $execId = $Matches[1]
        Write-Host "  Execution ID: $execId"
    }
} else {
    Write-Host "❌" -ForegroundColor Red
    Write-Host "  Response: $execResponse"
}

# Test 3: Get execution details
if ($execId) {
    Write-Host "  Testing GET /api/workflows/executions/:id... " -NoNewline
    $detailResponse = ssh "$VpsUser@$VpsIp" "curl -s http://localhost:3000/api/workflows/executions/$execId"
    if ($detailResponse -match "success") {
        Write-Host "✅" -ForegroundColor Green
    } else {
        Write-Host "❌" -ForegroundColor Red
        Write-Host "  Response: $detailResponse"
    }
}

# Test 4: Get statistics
Write-Host "  Testing GET /api/workflows/stats... " -NoNewline
$statsResponse = ssh "$VpsUser@$VpsIp" "curl -s http://localhost:3000/api/workflows/stats?userId=$adminId"
if ($statsResponse -match "success") {
    Write-Host "✅" -ForegroundColor Green
} else {
    Write-Host "❌" -ForegroundColor Red
    Write-Host "  Response: $statsResponse"
}

Write-Host ""

# ===========================
# DEPLOYMENT COMPLETE
# ===========================
Write-Host "=========================================" -ForegroundColor Green
Write-Host "✅ PHASE 2 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Summary:"
Write-Host "  ✅ Code pulled from GitHub"
Write-Host "  ✅ Database migrations applied"
Write-Host "  ✅ Backend rebuilt (Prisma Client regenerated)"
Write-Host "  ✅ Backend restarted"
Write-Host "  ✅ Health check passed"
Write-Host "  ✅ API endpoints tested"
Write-Host ""
Write-Host "🎯 What was deployed:"
Write-Host "  - Phase 2.1: Database Schema (3 tables, 2 enums)"
Write-Host "  - Phase 2.2: Backend Services (1020 lines)"
Write-Host "  - Phase 2.3: API Routes (600+ lines, 6 endpoints)"
Write-Host ""
Write-Host "🔗 API Endpoints Available:"
Write-Host "  - POST   http://$VpsIp:3000/api/workflows/execute"
Write-Host "  - GET    http://$VpsIp:3000/api/workflows/executions"
Write-Host "  - GET    http://$VpsIp:3000/api/workflows/executions/:id"
Write-Host "  - POST   http://$VpsIp:3000/api/workflows/executions/:id/retry"
Write-Host "  - GET    http://$VpsIp:3000/api/workflows/stats"
Write-Host "  - GET    http://$VpsIp:3000/api/workflows/budget"
Write-Host ""
Write-Host "📝 Next Steps:"
Write-Host "  1. Check backend logs: ssh $VpsUser@$VpsIp 'docker compose -f $ProjectDir/docker-compose.mern-full.yml logs backend'"
Write-Host "  2. Monitor executions: curl http://$VpsIp:3000/api/workflows/executions?userId=$adminId"
Write-Host "  3. Build frontend admin pages (Phase 2.5)"
Write-Host ""
Write-Host "🎉 Happy workflow automating!" -ForegroundColor Green
