# 🚀 Déploiement COMPLET MERN Production via Git
# Frontend + Backend + Nginx + PostgreSQL

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deploiement COMPLET MERN Production" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$VPS_IP = "173.212.208.181"
$PROJECT_DIR = "/root/blog_strapi"

# Étape 1: Git pull sur le VPS
Write-Host "[1/6] Git pull sur le VPS..." -ForegroundColor Yellow
ssh root@${VPS_IP} @"
cd $PROJECT_DIR
git fetch origin
git reset --hard origin/master
git pull origin master
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Code mis a jour depuis GitHub" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Git pull echoue" -ForegroundColor Red
    exit 1
}

# Étape 2: Créer les fichiers .env si nécessaire
Write-Host "`n[2/6] Configuration .env..." -ForegroundColor Yellow
ssh root@${VPS_IP} @"
cd $PROJECT_DIR

# Backend .env.production
if [ ! -f backend-mern/.env.production ]; then
    cat > backend-mern/.env.production <<'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://blog_user:BlogSecure2024!@postgres:5432/blog_mern
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-too
CORS_ORIGINS=http://${VPS_IP}:3000,http://${VPS_IP},http://localhost:5173
FRONTEND_URL=http://${VPS_IP}
EOF
    echo '.env.production cree pour backend'
else
    echo '.env.production existe deja'
fi

# Frontend .env.production
if [ ! -f frontend/.env.production ]; then
    cat > frontend/.env.production <<'EOF'
VITE_BACKEND_TYPE=mern
VITE_API_URL=http://${VPS_IP}:3000/api
VITE_STRAPI_URL=http://${VPS_IP}:3000
VITE_SITE_URL=http://${VPS_IP}
NODE_ENV=production
EOF
    echo '.env.production cree pour frontend'
else
    echo '.env.production existe deja'
fi
"@
Write-Host "  [OK] Configuration .env" -ForegroundColor Green

# Étape 3: Arrêter les anciens containers
Write-Host "`n[3/6] Arret des anciens containers..." -ForegroundColor Yellow
ssh root@${VPS_IP} @"
cd $PROJECT_DIR
docker-compose -f docker-compose.prod.yml down
"@
Write-Host "  [OK] Containers arretes" -ForegroundColor Green

# Étape 4: Build des images
Write-Host "`n[4/6] Build des images Docker..." -ForegroundColor Yellow
Write-Host "  (Cette etape peut prendre 2-3 minutes)" -ForegroundColor Gray
ssh root@${VPS_IP} @"
cd $PROJECT_DIR
docker-compose -f docker-compose.prod.yml build --no-cache
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Images buildees" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Build echoue" -ForegroundColor Red
    exit 1
}

# Étape 5: Démarrer tous les services
Write-Host "`n[5/6] Demarrage des services..." -ForegroundColor Yellow
ssh root@${VPS_IP} @"
cd $PROJECT_DIR
docker-compose -f docker-compose.prod.yml up -d
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Services demarres" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Demarrage echoue" -ForegroundColor Red
    exit 1
}

# Étape 6: Attendre et tester
Write-Host "`n[6/6] Attente et tests..." -ForegroundColor Yellow
Write-Host "  Attente 10 secondes pour le demarrage..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# Vérifier les containers
Write-Host "`n  Status des containers:" -ForegroundColor Cyan
ssh root@${VPS_IP} "cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml ps"

# Tests endpoints
Write-Host "`n  Tests endpoints:" -ForegroundColor Cyan

Write-Host "  [1] Health Check..." -NoNewline
try {
    $health = Invoke-RestMethod -Uri "http://${VPS_IP}:3000/health"
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "      Status: $($health.status), Uptime: $([math]::Round($health.uptime, 2))s" -ForegroundColor Gray
} catch {
    Write-Host " [FAILED]" -ForegroundColor Red
    Write-Host "      Error: $_" -ForegroundColor Red
}

Write-Host "  [2] API Categories..." -NoNewline
try {
    $categories = Invoke-RestMethod -Uri "http://${VPS_IP}:3000/api/categories"
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "      Count: $($categories.data.Count)" -ForegroundColor Gray
} catch {
    Write-Host " [FAILED]" -ForegroundColor Red
}

Write-Host "  [3] Frontend (via Nginx)..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://${VPS_IP}" -Method Head
    if ($response.StatusCode -eq 200) {
        Write-Host " [OK]" -ForegroundColor Green
        Write-Host "      Status: $($response.StatusCode)" -ForegroundColor Gray
    }
} catch {
    Write-Host " [FAILED]" -ForegroundColor Red
}

# Résumé final
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEPLOIEMENT COMPLET REUSSI!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Services disponibles:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://${VPS_IP}" -ForegroundColor Green
Write-Host "  Backend:   http://${VPS_IP}:3000" -ForegroundColor Green
Write-Host "  API:       http://${VPS_IP}:3000/api" -ForegroundColor Green
Write-Host "  Health:    http://${VPS_IP}:3000/health" -ForegroundColor Green

Write-Host "`nCommandes utiles:" -ForegroundColor Cyan
Write-Host "  Logs backend:   ssh root@${VPS_IP} 'cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml logs -f backend'" -ForegroundColor Gray
Write-Host "  Logs frontend:  ssh root@${VPS_IP} 'cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml logs -f frontend'" -ForegroundColor Gray
Write-Host "  Logs nginx:     ssh root@${VPS_IP} 'cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml logs -f nginx'" -ForegroundColor Gray
Write-Host "  Status:         ssh root@${VPS_IP} 'cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml ps'" -ForegroundColor Gray
Write-Host "  Restart all:    ssh root@${VPS_IP} 'cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml restart'" -ForegroundColor Gray

Write-Host "`nOuvrir le frontend dans le navigateur..." -ForegroundColor Cyan
Start-Process "http://${VPS_IP}"
