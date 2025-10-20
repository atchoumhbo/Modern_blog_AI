# 🚀 Déploiement Frontend MERN Production
# Build et déploie le frontend React sur le VPS

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deploiement Frontend MERN Production" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$VPS_IP = "173.212.208.181"
$PROJECT_DIR = "/root/blog_strapi"

# Étape 1: Git pull
Write-Host "[1/5] Git pull sur le VPS..." -ForegroundColor Yellow
ssh root@${VPS_IP} "cd $PROJECT_DIR && git fetch origin && git reset --hard origin/master && git pull origin master"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Code mis a jour" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Git pull echoue" -ForegroundColor Red
    exit 1
}

# Étape 2: Build frontend
Write-Host "`n[2/5] Build frontend..." -ForegroundColor Yellow
Write-Host "  (Cette etape peut prendre 2-3 minutes)" -ForegroundColor Gray
ssh root@${VPS_IP} "cd $PROJECT_DIR && docker-compose -f docker-compose.mern-prod.yml build frontend"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Frontend builde" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Build echoue" -ForegroundColor Red
    exit 1
}

# Étape 3: Démarrer le frontend
Write-Host "`n[3/5] Demarrage frontend..." -ForegroundColor Yellow
ssh root@${VPS_IP} "cd $PROJECT_DIR && docker-compose -f docker-compose.mern-prod.yml up -d frontend"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Frontend demarre" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Demarrage echoue" -ForegroundColor Red
    exit 1
}

# Étape 4: Attendre
Write-Host "`n[4/5] Attente demarrage (10s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Étape 5: Tests
Write-Host "`n[5/5] Tests..." -ForegroundColor Yellow

Write-Host "  [1] Test Backend Health..." -NoNewline
try {
    $health = Invoke-RestMethod -Uri "http://${VPS_IP}:3001/health"
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "      Uptime: $([math]::Round($health.uptime, 2))s" -ForegroundColor Gray
} catch {
    Write-Host " [FAILED]" -ForegroundColor Red
}

Write-Host "  [2] Test Backend API..." -NoNewline
try {
    $categories = Invoke-RestMethod -Uri "http://${VPS_IP}:3001/api/categories"
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "      Categories: $($categories.data.Count)" -ForegroundColor Gray
} catch {
    Write-Host " [FAILED]" -ForegroundColor Red
}

Write-Host "  [3] Test Frontend..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://${VPS_IP}:8080" -Method Head -TimeoutSec 5
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "      Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host " [FAILED]" -ForegroundColor Red
    Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Vérifier les containers
Write-Host "`n  Status containers:" -ForegroundColor Cyan
ssh root@${VPS_IP} "cd $PROJECT_DIR && docker-compose -f docker-compose.mern-prod.yml ps"

# Résumé
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEPLOIEMENT FRONTEND REUSSI!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Services disponibles:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://${VPS_IP}:8080" -ForegroundColor Green
Write-Host "  Backend:   http://${VPS_IP}:3001" -ForegroundColor Green
Write-Host "  API:       http://${VPS_IP}:3001/api" -ForegroundColor Green
Write-Host "  Health:    http://${VPS_IP}:3001/health" -ForegroundColor Green

Write-Host "`nCredentials:" -ForegroundColor Cyan
Write-Host "  Email:     boujraf.hicham@gmail.com" -ForegroundColor Gray
Write-Host "  Password:  Admin123!" -ForegroundColor Gray

Write-Host "`nCommandes utiles:" -ForegroundColor Cyan
Write-Host "  Logs frontend:  ssh root@${VPS_IP} 'cd $PROJECT_DIR && docker-compose -f docker-compose.mern-prod.yml logs -f frontend'" -ForegroundColor Gray
Write-Host "  Logs backend:   ssh root@${VPS_IP} 'cd $PROJECT_DIR && docker-compose -f docker-compose.mern-prod.yml logs -f backend'" -ForegroundColor Gray
Write-Host "  Restart front:  ssh root@${VPS_IP} 'cd $PROJECT_DIR && docker-compose -f docker-compose.mern-prod.yml restart frontend'" -ForegroundColor Gray
Write-Host "  Restart all:    ssh root@${VPS_IP} 'cd $PROJECT_DIR && docker-compose -f docker-compose.mern-prod.yml restart'" -ForegroundColor Gray

Write-Host "`nOuvrir le frontend dans le navigateur..." -ForegroundColor Cyan
Start-Process "http://${VPS_IP}:8080"
