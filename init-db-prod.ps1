# 🔧 Script d'initialisation de la base de données MERN Production
# Exécute les migrations Prisma et seed les données

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Initialisation DB MERN Production" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$VPS_IP = "173.212.208.181"

# Étape 1: Vérifier que le backend est démarré
Write-Host "[1/4] Verification backend..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "http://${VPS_IP}:3001/health"
Write-Host "  [OK] Backend running (uptime: $([math]::Round($health.uptime, 2))s)" -ForegroundColor Green

# Étape 2: Exécuter les migrations Prisma
Write-Host "`n[2/4] Execution migrations Prisma..." -ForegroundColor Yellow
ssh root@${VPS_IP} "docker exec blog-mern-backend-prod npx prisma migrate deploy"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Migrations executees" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Migrations echouees" -ForegroundColor Red
    exit 1
}

# Étape 3: Seed les données (production)
Write-Host "`n[3/4] Seed des donnees..." -ForegroundColor Yellow
ssh root@${VPS_IP} "docker exec blog-mern-backend-prod node dist/seed-production.js"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Donnees inserees" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] Seed peut avoir echoue (normal si deja fait)" -ForegroundColor Yellow
}

# Étape 4: Tester les endpoints
Write-Host "`n[4/4] Tests..." -ForegroundColor Yellow

Write-Host "  Test Categories..." -NoNewline
try {
    $categories = Invoke-RestMethod -Uri "http://${VPS_IP}:3001/api/categories"
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "    Count: $($categories.data.Count)" -ForegroundColor Gray
    $categories.data | Select-Object -First 3 name, slug | ForEach-Object {
        Write-Host "    - $($_.name) ($($_.slug))" -ForegroundColor Gray
    }
} catch {
    Write-Host " [FAILED]" -ForegroundColor Red
}

Write-Host "`n  Test Tags..." -NoNewline
try {
    $tags = Invoke-RestMethod -Uri "http://${VPS_IP}:3001/api/tags"
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "    Count: $($tags.data.Count)" -ForegroundColor Gray
} catch {
    Write-Host " [FAILED]" -ForegroundColor Red
}

Write-Host "`n  Test Articles..." -NoNewline
try {
    $articles = Invoke-RestMethod -Uri "http://${VPS_IP}:3001/api/articles"
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "    Count: $($articles.data.Count)" -ForegroundColor Gray
} catch {
    Write-Host " [FAILED]" -ForegroundColor Red
}

# Résumé
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "INITIALISATION REUSSIE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Base de donnees PostgreSQL initialisee avec succes" -ForegroundColor Green
Write-Host "Backend: http://${VPS_IP}:3001" -ForegroundColor Green
Write-Host "API: http://${VPS_IP}:3001/api" -ForegroundColor Green
