# 🚀 Script de déploiement PRODUCTION COMPLÈTE
# Frontend + Backend MERN + PostgreSQL + Nginx
# Accès: http://173.212.208.181

param(
    [switch]$Build,
    [switch]$Deploy,
    [switch]$Test,
    [switch]$All
)

$VPS_IP = "173.212.208.181"
$PROJECT_ROOT = "C:\Devops\blog_strapi"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEPLOIEMENT PRODUCTION - MERN STACK" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

function Build-Local {
    Write-Host "[1] Build local des images Docker..." -ForegroundColor Yellow
    
    # Build backend
    Write-Host "  - Build backend MERN..." -ForegroundColor Gray
    Set-Location "$PROJECT_ROOT\backend"
    docker build -t blog-backend-mern:latest -f Dockerfile --target production .
    
    # Build frontend
    Write-Host "  - Build frontend React..." -ForegroundColor Gray
    Set-Location "$PROJECT_ROOT\frontend"
    docker build -t blog-frontend-mern:latest -f Dockerfile.prod `
        --build-arg VITE_BACKEND_TYPE=mern `
        --build-arg VITE_API_URL=http://$VPS_IP/api `
        --build-arg VITE_SITE_URL=http://$VPS_IP `
        .
    
    Write-Host "  [OK] Images buildées localement" -ForegroundColor Green
}

function Deploy-ToVPS {
    Write-Host "`n[2] Déploiement sur VPS $VPS_IP..." -ForegroundColor Yellow
    
    Set-Location $PROJECT_ROOT
    
    # Créer dossier sur VPS
    Write-Host "  - Création structure sur VPS..." -ForegroundColor Gray
    ssh root@${VPS_IP} "mkdir -p /root/blog_mern_prod/{backend,frontend,nginx}"
    
    # Copier fichiers backend
    Write-Host "  - Transfert backend..." -ForegroundColor Gray
    scp -r backend/* root@${VPS_IP}:/root/blog_mern_prod/backend/
    
    # Copier fichiers frontend (seulement nécessaires)
    Write-Host "  - Transfert frontend..." -ForegroundColor Gray
    ssh root@${VPS_IP} "mkdir -p /root/blog_mern_prod/frontend"
    scp frontend/package*.json root@${VPS_IP}:/root/blog_mern_prod/frontend/
    scp frontend/Dockerfile.prod root@${VPS_IP}:/root/blog_mern_prod/frontend/
    scp frontend/vite.config.ts root@${VPS_IP}:/root/blog_mern_prod/frontend/
    scp frontend/tsconfig*.json root@${VPS_IP}:/root/blog_mern_prod/frontend/
    scp frontend/index.html root@${VPS_IP}:/root/blog_mern_prod/frontend/
    scp frontend/postcss.config.js root@${VPS_IP}:/root/blog_mern_prod/frontend/
    scp frontend/react-router.config.ts root@${VPS_IP}:/root/blog_mern_prod/frontend/
    scp -r frontend/src root@${VPS_IP}:/root/blog_mern_prod/frontend/
    scp -r frontend/public root@${VPS_IP}:/root/blog_mern_prod/frontend/
    
    # Copier config Nginx
    Write-Host "  - Transfert Nginx config..." -ForegroundColor Gray
    scp nginx/nginx.prod.conf root@${VPS_IP}:/root/blog_mern_prod/nginx/
    
    # Copier docker-compose et .env
    Write-Host "  - Transfert docker-compose..." -ForegroundColor Gray
    scp docker-compose.mern-prod.yml root@${VPS_IP}:/root/blog_mern_prod/docker-compose.yml
    scp .env.mern.prod root@${VPS_IP}:/root/blog_mern_prod/.env
    
    Write-Host "  [OK] Fichiers transférés" -ForegroundColor Green
    
    # Build sur VPS
    Write-Host "`n  - Build images sur VPS..." -ForegroundColor Yellow
    ssh root@${VPS_IP} @"
cd /root/blog_mern_prod
echo "Building backend..."
docker-compose build backend
echo "Building frontend..."
docker-compose build frontend
echo "Build completed!"
"@
    
    Write-Host "  [OK] Images buildées sur VPS" -ForegroundColor Green
    
    # Démarrer les services
    Write-Host "`n  - Démarrage des services..." -ForegroundColor Yellow
    ssh root@${VPS_IP} @"
cd /root/blog_mern_prod
docker-compose down
docker-compose up -d
echo "Waiting for services to start..."
sleep 10
docker-compose ps
"@
    
    Write-Host "  [OK] Services démarrés" -ForegroundColor Green
}

function Test-Deployment {
    Write-Host "`n[3] Tests de déploiement..." -ForegroundColor Yellow
    
    Start-Sleep -Seconds 5
    
    # Test Health Check
    Write-Host "  - Test Health Check..." -NoNewline
    try {
        $health = Invoke-RestMethod -Uri "http://${VPS_IP}/health" -TimeoutSec 10
        Write-Host " [OK]" -ForegroundColor Green
        Write-Host "    Status: $($health.status), Uptime: $([math]::Round($health.uptime, 2))s" -ForegroundColor Gray
    } catch {
        Write-Host " [FAILED]" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test API Categories
    Write-Host "  - Test API Categories..." -NoNewline
    try {
        $categories = Invoke-RestMethod -Uri "http://${VPS_IP}/api/categories" -TimeoutSec 10
        Write-Host " [OK]" -ForegroundColor Green
        Write-Host "    Count: $($categories.data.Count) catégories" -ForegroundColor Gray
    } catch {
        Write-Host " [FAILED]" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test Frontend
    Write-Host "  - Test Frontend..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "http://${VPS_IP}/" -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host " [OK]" -ForegroundColor Green
            Write-Host "    Status: $($response.StatusCode)" -ForegroundColor Gray
        }
    } catch {
        Write-Host " [FAILED]" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "DEPLOIEMENT TERMINE!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "Frontend:  http://${VPS_IP}" -ForegroundColor Green
    Write-Host "API:       http://${VPS_IP}/api" -ForegroundColor Green
    Write-Host "Health:    http://${VPS_IP}/health" -ForegroundColor Green
    
    Write-Host "`nCommandes utiles:" -ForegroundColor Cyan
    Write-Host "  Logs:      ssh root@${VPS_IP} 'cd /root/blog_mern_prod && docker-compose logs -f'" -ForegroundColor Gray
    Write-Host "  Restart:   ssh root@${VPS_IP} 'cd /root/blog_mern_prod && docker-compose restart'" -ForegroundColor Gray
    Write-Host "  Stop:      ssh root@${VPS_IP} 'cd /root/blog_mern_prod && docker-compose down'" -ForegroundColor Gray
    
    # Ouvrir dans le navigateur
    Write-Host "`nOuvrir le site dans le navigateur..." -ForegroundColor Cyan
    Start-Process "http://${VPS_IP}"
}

# Exécution selon les paramètres
if ($All) {
    Build-Local
    Deploy-ToVPS
    Test-Deployment
} elseif ($Build) {
    Build-Local
} elseif ($Deploy) {
    Deploy-ToVPS
} elseif ($Test) {
    Test-Deployment
} else {
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\deploy-mern-prod.ps1 -All      # Build + Deploy + Test" -ForegroundColor Gray
    Write-Host "  .\deploy-mern-prod.ps1 -Build    # Build local uniquement" -ForegroundColor Gray
    Write-Host "  .\deploy-mern-prod.ps1 -Deploy   # Deploy sur VPS uniquement" -ForegroundColor Gray
    Write-Host "  .\deploy-mern-prod.ps1 -Test     # Test uniquement" -ForegroundColor Gray
}
