# 🚀 Déploiement MERN Production via Git
# Tire le code depuis GitHub et redémarre les containers

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deploiement MERN Production via Git" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$VPS_IP = "173.212.208.181"
$PROJECT_DIR = "/root/blog_strapi"

# Étape 1: Git pull sur le VPS
Write-Host "[1/4] Git pull sur le VPS..." -ForegroundColor Yellow
ssh root@${VPS_IP} "cd /root/blog_strapi && git fetch origin && git reset --hard origin/master && git pull origin master"

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Code mis a jour depuis GitHub" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Git pull echoue" -ForegroundColor Red
    exit 1
}

# Étape 2: Rebuild et redémarrer backend
Write-Host "`n[2/4] Rebuild backend..." -ForegroundColor Yellow
ssh root@${VPS_IP} "cd /root/blog_strapi && docker-compose -f docker-compose.mern-prod.yml build backend && docker-compose -f docker-compose.mern-prod.yml up -d backend"

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Backend redémarre" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Backend build echoue" -ForegroundColor Red
    exit 1
}

# Étape 3: Attendre que le backend démarre
Write-Host "`n[3/4] Attente demarrage backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Étape 4: Tests
Write-Host "`n[4/4] Tests..." -ForegroundColor Yellow

Write-Host "  Test Health Check..." -NoNewline
try {
    $health = Invoke-RestMethod -Uri "http://${VPS_IP}:3000/health"
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "    Status: $($health.status)" -ForegroundColor Gray
    Write-Host "    Uptime: $([math]::Round($health.uptime, 2))s" -ForegroundColor Gray
} catch {
    Write-Host " [FAILED]" -ForegroundColor Red
}

Write-Host "  Test API Categories..." -NoNewline
try {
    $categories = Invoke-RestMethod -Uri "http://${VPS_IP}:3000/api/categories"
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "    Count: $($categories.data.Count)" -ForegroundColor Gray
} catch {
    Write-Host " [FAILED]" -ForegroundColor Red
}

# Résumé
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEPLOIEMENT REUSSI!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Backend:   http://${VPS_IP}:3000" -ForegroundColor Green
Write-Host "API:       http://${VPS_IP}:3000/api" -ForegroundColor Green
Write-Host "Health:    http://${VPS_IP}:3000/health" -ForegroundColor Green

Write-Host "`nCommandes utiles:" -ForegroundColor Cyan
Write-Host "  Logs backend:  ssh root@${VPS_IP} 'docker logs -f blog-mern-backend'" -ForegroundColor Gray
Write-Host "  Restart:       ssh root@${VPS_IP} 'cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml restart backend'" -ForegroundColor Gray
Write-Host "  Status:        ssh root@${VPS_IP} 'docker ps'" -ForegroundColor Gray
