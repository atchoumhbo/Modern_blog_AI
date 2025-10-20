# 🚀 DÉPLOIEMENT RAPIDE - Production MERN Stack
# Un seul script pour tout déployer!

$VPS_IP = "173.212.208.181"

Write-Host "`n🚀 DEPLOIEMENT PRODUCTION MERN" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# 1. Transfert des fichiers
Write-Host "[1/4] Transfert vers VPS..." -ForegroundColor Yellow
ssh root@${VPS_IP} "mkdir -p /root/blog_mern_prod/{backend,frontend,nginx}"

Write-Host "  - Backend..." -ForegroundColor Gray
scp -r C:\Devops\blog_strapi\backend\* root@${VPS_IP}:/root/blog_mern_prod/backend/

Write-Host "  - Frontend (sources)..." -ForegroundColor Gray
$frontendFiles = @(
    "package.json",
    "package-lock.json",
    "Dockerfile.prod",
    "vite.config.ts",
    "tsconfig.json",
    "tsconfig.node.json",
    "index.html",
    "postcss.config.js",
    "react-router.config.ts"
)

foreach ($file in $frontendFiles) {
    scp "C:\Devops\blog_strapi\frontend\$file" root@${VPS_IP}:/root/blog_mern_prod/frontend/
}

scp -r C:\Devops\blog_strapi\frontend\src root@${VPS_IP}:/root/blog_mern_prod/frontend/
scp -r C:\Devops\blog_strapi\frontend\public root@${VPS_IP}:/root/blog_mern_prod/frontend/

Write-Host "  - Configuration..." -ForegroundColor Gray
scp C:\Devops\blog_strapi\nginx\nginx.prod.conf root@${VPS_IP}:/root/blog_mern_prod/nginx/
scp C:\Devops\blog_strapi\docker-compose.mern-prod.yml root@${VPS_IP}:/root/blog_mern_prod/docker-compose.yml
scp C:\Devops\blog_strapi\.env.mern.prod root@${VPS_IP}:/root/blog_mern_prod/.env

Write-Host "  [OK] Fichiers transférés`n" -ForegroundColor Green

# 2. Build sur VPS
Write-Host "[2/4] Build des images sur VPS..." -ForegroundColor Yellow
Write-Host "  (Cela peut prendre 3-5 minutes)`n" -ForegroundColor Gray

ssh root@${VPS_IP} @"
cd /root/blog_mern_prod

# Stop les anciens containers si existants
docker-compose down 2>/dev/null || true

# Build backend
echo "Building backend..."
docker-compose build --no-cache backend

# Build frontend
echo "Building frontend..."
docker-compose build --no-cache frontend

echo "Build completed!"
"@

Write-Host "  [OK] Images buildées`n" -ForegroundColor Green

# 3. Démarrage
Write-Host "[3/4] Démarrage des services..." -ForegroundColor Yellow

ssh root@${VPS_IP} @"
cd /root/blog_mern_prod

# Démarrer tous les services
docker-compose up -d

# Attendre que les services démarrent
echo "Waiting for services..."
sleep 15

# Afficher les statuts
echo ""
echo "=== SERVICES STATUS ==="
docker-compose ps

echo ""
echo "=== BACKEND LOGS (last 20 lines) ==="
docker-compose logs --tail=20 backend

echo ""
echo "=== NGINX LOGS (last 10 lines) ==="
docker-compose logs --tail=10 nginx
"@

Write-Host "  [OK] Services démarrés`n" -ForegroundColor Green

# 4. Tests
Write-Host "[4/4] Tests..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "  - Health Check: " -NoNewline
try {
    $health = Invoke-RestMethod "http://${VPS_IP}/health" -TimeoutSec 10
    Write-Host "[OK] $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "[FAILED]" -ForegroundColor Red
}

Write-Host "  - API Categories: " -NoNewline
try {
    $cats = Invoke-RestMethod "http://${VPS_IP}/api/categories" -TimeoutSec 10
    Write-Host "[OK] $($cats.data.Count) items" -ForegroundColor Green
} catch {
    Write-Host "[FAILED]" -ForegroundColor Red
}

Write-Host "  - Frontend: " -NoNewline
try {
    $fe = Invoke-WebRequest "http://${VPS_IP}/" -TimeoutSec 10 -UseBasicParsing
    Write-Host "[OK] Status $($fe.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "[FAILED]" -ForegroundColor Red
}

# Résumé
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOIEMENT REUSSI!" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "🌐 Frontend:  http://${VPS_IP}" -ForegroundColor Green
Write-Host "🔌 API:       http://${VPS_IP}/api" -ForegroundColor Green
Write-Host "❤️  Health:    http://${VPS_IP}/health" -ForegroundColor Green

Write-Host "`n📝 Commandes utiles:" -ForegroundColor Cyan
Write-Host "  Logs:    ssh root@${VPS_IP} 'cd /root/blog_mern_prod && docker-compose logs -f'" -ForegroundColor Gray
Write-Host "  Status:  ssh root@${VPS_IP} 'cd /root/blog_mern_prod && docker-compose ps'" -ForegroundColor Gray
Write-Host "  Restart: ssh root@${VPS_IP} 'cd /root/blog_mern_prod && docker-compose restart'" -ForegroundColor Gray

Write-Host "`n🚀 Ouverture dans le navigateur..." -ForegroundColor Cyan
Start-Process "http://${VPS_IP}"
