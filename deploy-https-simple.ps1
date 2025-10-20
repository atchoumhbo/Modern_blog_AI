# ============================================================
# Script de deploiement HTTPS simplifie pour blog.bh-systems.be
# ============================================================

$VPS_IP = "173.212.208.181"
$DOMAIN = "blog.bh-systems.be"

Write-Host "Deploiement HTTPS pour $DOMAIN" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

# Phase 1: Verification DNS
Write-Host "[1/6] Verification DNS..." -ForegroundColor Yellow
try {
    $dnsResult = Resolve-DnsName $DOMAIN -ErrorAction Stop
    Write-Host "  DNS OK: $($dnsResult.IPAddress)" -ForegroundColor Green
} catch {
    Write-Host "  ERREUR DNS: $_" -ForegroundColor Red
    exit 1
}

# Phase 2: Transfert et execution setup SSL
Write-Host "`n[2/6] Configuration SSL sur VPS..." -ForegroundColor Yellow
Write-Host "  Transfert setup-ssl-ovh.sh..." -NoNewline
scp -q setup-ssl-ovh.sh root@${VPS_IP}:/root/
if ($LASTEXITCODE -eq 0) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ERREUR" -ForegroundColor Red
    exit 1
}

Write-Host "  Execution setup SSL (peut prendre 3-5 min)..." -NoNewline
ssh root@${VPS_IP} "chmod +x /root/setup-ssl-ovh.sh && /root/setup-ssl-ovh.sh"
if ($LASTEXITCODE -eq 0) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ERREUR" -ForegroundColor Red
    exit 1
}

# Phase 3: Installation Nginx
Write-Host "`n[3/6] Installation Nginx..." -ForegroundColor Yellow
Write-Host "  Installation nginx..." -NoNewline
ssh root@${VPS_IP} "apt-get update > /dev/null 2>&1 && apt-get install -y nginx > /dev/null 2>&1"
if ($LASTEXITCODE -eq 0) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ERREUR" -ForegroundColor Red
    exit 1
}

Write-Host "  Configuration nginx..." -NoNewline
scp -q nginx/blog.bh-systems.be.conf root@${VPS_IP}:/etc/nginx/sites-available/
ssh root@${VPS_IP} "ln -sf /etc/nginx/sites-available/blog.bh-systems.be.conf /etc/nginx/sites-enabled/ && nginx -t > /dev/null 2>&1 && systemctl reload nginx"
if ($LASTEXITCODE -eq 0) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ERREUR" -ForegroundColor Red
    exit 1
}

# Phase 4: Build et deploiement frontend
Write-Host "`n[4/6] Build et deploiement frontend..." -ForegroundColor Yellow

# Mise a jour .env.production
$envPath = "C:\Devops\blog_strapi\frontend\.env.production"
if (Test-Path $envPath) {
    $envContent = @"
VITE_BACKEND_TYPE=mern
VITE_API_URL=https://$DOMAIN/api
VITE_STRAPI_URL=https://$DOMAIN
VITE_SITE_URL=https://$DOMAIN
NODE_ENV=production
"@
    $envContent | Out-File -FilePath $envPath -Encoding UTF8
    Write-Host "  .env.production mis a jour" -ForegroundColor Green
}

Write-Host "  Build frontend (2-3 min)..." -NoNewline
Set-Location C:\Devops\blog_strapi\frontend
$buildOutput = npm run build 2>&1
if ($LASTEXITCODE -eq 0 -and (Test-Path "build/client")) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ERREUR" -ForegroundColor Red
    Write-Host $buildOutput
    exit 1
}

Write-Host "  Creation dossier web sur VPS..." -NoNewline
ssh root@${VPS_IP} "mkdir -p /var/www/blog-frontend"
Write-Host " OK" -ForegroundColor Green

Write-Host "  Transfert fichiers..." -NoNewline
scp -r -q build/client/* root@${VPS_IP}:/var/www/blog-frontend/
if ($LASTEXITCODE -eq 0) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ERREUR" -ForegroundColor Red
    exit 1
}

Set-Location C:\Devops\blog_strapi

# Phase 5: Configuration backend CORS
Write-Host "`n[5/6] Configuration backend CORS..." -ForegroundColor Yellow
Write-Host "  Mise a jour CORS..." -NoNewline
$corsScript = @'
cd /root/blog_strapi/backend-mern
if ! grep -q 'blog.bh-systems.be' .env.production 2>/dev/null; then
    sed -i 's|CORS_ORIGINS=.*|CORS_ORIGINS=https://blog.bh-systems.be,https://*.blog.bh-systems.be,http://localhost:5173|' .env.production
    sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://blog.bh-systems.be|' .env.production
fi
'@
ssh root@${VPS_IP} $corsScript
Write-Host " OK" -ForegroundColor Green

Write-Host "  Redemarrage backend..." -NoNewline
ssh root@${VPS_IP} "cd /root/blog_strapi && docker-compose -f docker-compose.mern-prod.yml restart backend > /dev/null 2>&1"
Start-Sleep -Seconds 5
Write-Host " OK" -ForegroundColor Green

# Phase 6: Tests finaux
Write-Host "`n[6/6] Tests finaux..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "  Test HTTPS Health..." -NoNewline
try {
    $health = Invoke-RestMethod -Uri "https://$DOMAIN/health" -ErrorAction Stop
    Write-Host " OK: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host " ERREUR" -ForegroundColor Red
    Write-Host "    Detail: $_" -ForegroundColor Red
}

Write-Host "  Test HTTPS API..." -NoNewline
try {
    $categories = Invoke-RestMethod -Uri "https://$DOMAIN/api/categories" -ErrorAction Stop
    $count = $categories.data.Count
    Write-Host " OK: $count categories" -ForegroundColor Green
} catch {
    Write-Host " ERREUR" -ForegroundColor Red
}

Write-Host "  Test Frontend HTTPS..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "https://$DOMAIN" -Method Head -ErrorAction Stop
    $statusCode = $response.StatusCode
    Write-Host " OK: $statusCode" -ForegroundColor Green
} catch {
    Write-Host " ERREUR" -ForegroundColor Red
}

# Resume final
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "           DEPLOIEMENT HTTPS TERMINE !" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

Write-Host "Site web:        https://$DOMAIN" -ForegroundColor Green
Write-Host "API:             https://$DOMAIN/api" -ForegroundColor Green
Write-Host "Health check:    https://$DOMAIN/health" -ForegroundColor Green

Write-Host "`nCertificat SSL:" -ForegroundColor Cyan
Write-Host "   Emetteur: Let's Encrypt (via OVH DNS)" -ForegroundColor Gray
Write-Host "   Wildcard: Oui (*.blog.bh-systems.be)" -ForegroundColor Gray
Write-Host "   Renouvellement: Automatique (cron mensuel)" -ForegroundColor Gray

Write-Host "`nArchitecture:" -ForegroundColor Cyan
Write-Host "   Nginx:     SSL Termination + Reverse Proxy" -ForegroundColor Gray
Write-Host "   Frontend:  React Router v7 (build/client)" -ForegroundColor Gray
Write-Host "   Backend:   MERN (Docker :3001)" -ForegroundColor Gray
Write-Host "   Database:  PostgreSQL 16 (Docker)" -ForegroundColor Gray

Write-Host "`nOuverture du site..." -ForegroundColor Cyan
Start-Process "https://$DOMAIN"

Write-Host "`nTermine !`n" -ForegroundColor Green
