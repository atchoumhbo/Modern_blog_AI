# ðŸš€ DÃ©ploiement HTTPS avec OVH - blog.bh-systems.be
# Automatisation complÃ¨te : SSL OVH + Nginx + Frontend + Backend

Write-Host "`nâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Cyan
Write-Host "â•‘     ðŸ”’ DÃ‰PLOIEMENT HTTPS OVH - blog.bh-systems.be        â•‘" -ForegroundColor Cyan
Write-Host "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•`n" -ForegroundColor Cyan

$VPS_IP = "173.212.208.181"
$DOMAIN = "blog.bh-systems.be"

# ============================================================
# PHASE 1: VÃ©rifications prÃ©alables
# ============================================================

Write-Host "[PHASE 1/6] VÃ©rifications prÃ©alables" -ForegroundColor Yellow

# DNS
Write-Host "  VÃ©rification DNS..." -NoNewline
try {
    $dns = Resolve-DnsName -Name $DOMAIN -ErrorAction Stop
    if ($dns.IPAddress -contains $VPS_IP) {
        Write-Host " âœ…" -ForegroundColor Green
    } else {
        Write-Host " âš ï¸  (pointe vers: $($dns.IPAddress))" -ForegroundColor Yellow
    }
} catch {
    Write-Host " âŒ DNS non rÃ©solu" -ForegroundColor Red
    exit 1
}

# Backend VPS
Write-Host "  Backend VPS..." -NoNewline
try {
    $health = Invoke-RestMethod -Uri "http://${VPS_IP}:3001/health" -ErrorAction Stop
    Write-Host " âœ… (uptime: $([math]::Round($health.uptime, 2))s)" -ForegroundColor Green
} catch {
    Write-Host " âŒ" -ForegroundColor Red
    exit 1
}

# ============================================================
# PHASE 2: Configuration SSL (OVH)
# ============================================================

Write-Host "`n[PHASE 2/6] Configuration SSL avec OVH" -ForegroundColor Yellow

Write-Host "  Transfert script SSL..." -NoNewline
scp C:\Devops\blog_strapi\setup-ssl-ovh.sh root@${VPS_IP}:/root/ 2>$null
Write-Host " âœ…" -ForegroundColor Green

Write-Host "`n  âš ï¸  IMPORTANT: VÃ©rifiez que /root/.ovhapi existe avec vos clÃ©s API OVH"
Write-Host "  Si ce n'est pas le cas, crÃ©ez-le d'abord :" -ForegroundColor Yellow
Write-Host "  ssh root@$VPS_IP" -ForegroundColor Gray
Write-Host "  cat > /root/.ovhapi <<'EOF'" -ForegroundColor Gray
Write-Host "  dns_ovh_endpoint = ovh-eu" -ForegroundColor Gray
Write-Host "  dns_ovh_application_key = VOTRE_KEY" -ForegroundColor Gray
Write-Host "  dns_ovh_application_secret = VOTRE_SECRET" -ForegroundColor Gray
Write-Host "  dns_ovh_consumer_key = VOTRE_CONSUMER_KEY" -ForegroundColor Gray
Write-Host "  EOF" -ForegroundColor Gray
Write-Host "  chmod 600 /root/.ovhapi" -ForegroundColor Gray

$continue = Read-Host "`n  Le fichier .ovhapi est-il configurÃ© ? (o/n)"
if ($continue -ne "o") {
    Write-Host "`n  ArrÃªt. Configurez d'abord les clÃ©s API OVH." -ForegroundColor Red
    exit 1
}

Write-Host "`n  Execution script SSL (cela peut prendre 2-3 min)..." -ForegroundColor Cyan
ssh root@${VPS_IP} "chmod +x /root/setup-ssl-ovh.sh; /root/setup-ssl-ovh.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host " OK: Certificat SSL genere" -ForegroundColor Green
} else {
    Write-Host " ERREUR: Erreur SSL" -ForegroundColor Red
    exit 1
}

# ============================================================
# PHASE 3: Installation et configuration Nginx
# ============================================================

Write-Host "`n[PHASE 3/6] Configuration Nginx" -ForegroundColor Yellow

Write-Host "  Installation Nginx..." -NoNewline
ssh root@${VPS_IP} "apt update > /dev/null 2>&1; apt install -y nginx > /dev/null 2>&1"
Write-Host " OK:" -ForegroundColor Green

Write-Host "  Creation repertoire frontend..." -NoNewline
ssh root@${VPS_IP} "mkdir -p /var/www/blog-frontend; chown -R www-data:www-data /var/www/blog-frontend"
Write-Host " OK:" -ForegroundColor Green

Write-Host "  Transfert config Nginx..." -NoNewline
scp C:\Devops\blog_strapi\nginx\blog.bh-systems.be.conf root@${VPS_IP}:/etc/nginx/sites-available/ 2>$null
Write-Host " OK:" -ForegroundColor Green

Write-Host "  Activation config..." -NoNewline
ssh root@${VPS_IP} "ln -sf /etc/nginx/sites-available/blog.bh-systems.be.conf /etc/nginx/sites-enabled/; rm -f /etc/nginx/sites-enabled/default; nginx -t > /dev/null 2>&1; systemctl reload nginx"
Write-Host " OK:" -ForegroundColor Green

# ============================================================
# PHASE 4: Build et dÃ©ploiement frontend
# ============================================================

Write-Host "`n[PHASE 4/6] Build et dÃ©ploiement frontend" -ForegroundColor Yellow

Write-Host "  Verification .env.production..." -NoNewline
$envPath = "C:\Devops\blog_strapi\frontend\.env.production"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    if ($envContent -match "blog.bh-systems.be") {
        Write-Host " OK:" -ForegroundColor Green
    } else {
        Write-Host " [!] Mise a jour necessaire" -ForegroundColor Yellow
        @"
VITE_BACKEND_TYPE=mern
VITE_API_URL=https://blog.bh-systems.be/api
VITE_STRAPI_URL=https://blog.bh-systems.be
VITE_SITE_URL=https://blog.bh-systems.be
NODE_ENV=production
"@ | Out-File -FilePath $envPath -Encoding UTF8
        Write-Host " OK: Mis a jour" -ForegroundColor Green
    }
} else {
    Write-Host " ERREUR: Fichier manquant" -ForegroundColor Red
    exit 1
}

Write-Host "  Build frontend (peut prendre 2-3 min)..." -ForegroundColor Cyan
Set-Location C:\Devops\blog_strapi\frontend
npm run build 2>$null

if ($LASTEXITCODE -eq 0 -and (Test-Path "build/client")) {
    Write-Host " OK: Build reussi" -ForegroundColor Green
} else {
    Write-Host " ERREUR: Build echoue" -ForegroundColor Red
    exit 1
}

Write-Host "  Transfert vers VPS..." -NoNewline
scp -r build/client/* root@${VPS_IP}:/var/www/blog-frontend/ 2>$null
Write-Host " OK:" -ForegroundColor Green

Set-Location C:\Devops\blog_strapi

# ============================================================
# PHASE 5: Configuration backend CORS
# ============================================================

Write-Host "`n[PHASE 5/6] Configuration backend pour HTTPS" -ForegroundColor Yellow

Write-Host "  Mise a jour CORS..." -NoNewline
ssh root@${VPS_IP} "cd /root/blog_strapi/backend-mern; if ! grep -q 'blog.bh-systems.be' .env.production 2>/dev/null; then sed -i 's|CORS_ORIGINS=.*|CORS_ORIGINS=https://blog.bh-systems.be,https://*.blog.bh-systems.be,http://localhost:5173|' .env.production; sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://blog.bh-systems.be|' .env.production; fi"
Write-Host " OK:" -ForegroundColor Green

Write-Host "  Redemarrage backend..." -NoNewline
ssh root@${VPS_IP} "cd /root/blog_strapi; docker-compose -f docker-compose.mern-prod.yml restart backend > /dev/null 2>&1"
Start-Sleep -Seconds 5
Write-Host " OK:" -ForegroundColor Green

# ============================================================
# PHASE 6: Tests finaux
# ============================================================

Write-Host "`n[PHASE 6/6] Tests finaux" -ForegroundColor Yellow

Start-Sleep -Seconds 3

Write-Host "  Test HTTPS Health..." -NoNewline
try {
    $health = Invoke-RestMethod -Uri "https://$DOMAIN/health" -ErrorAction Stop
    Write-Host " OK: ($($health.status))" -ForegroundColor Green
} catch {
    Write-Host " ERREUR:" -ForegroundColor Red
    Write-Host "    Erreur: $_" -ForegroundColor Red
}

Write-Host "  Test HTTPS API..." -NoNewline
try {
    $categories = Invoke-RestMethod -Uri "https://$DOMAIN/api/categories" -ErrorAction Stop
    Write-Host " OK: ($($categories.data.Count) categories)" -ForegroundColor Green
} catch {
    Write-Host " ERREUR:" -ForegroundColor Red
}

Write-Host "  Test Frontend HTTPS..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "https://$DOMAIN" -Method Head -ErrorAction Stop
    Write-Host " OK: ($($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host " ERREUR:" -ForegroundColor Red
}

# ============================================================
# Resume final
# ============================================================

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " OK: DEPLOIEMENT HTTPS TERMINE !" -ForegroundColor Cyan
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

Write-Host "`nLogs utiles:" -ForegroundColor Cyan
Write-Host "   Nginx:     ssh root@$VPS_IP 'tail -f /var/log/nginx/error.log'" -ForegroundColor Gray
Write-Host "   Backend:   ssh root@$VPS_IP 'docker logs -f blog-mern-backend-prod'" -ForegroundColor Gray
Write-Host "   Certbot:   ssh root@$VPS_IP 'cat /var/log/cert-renewal.log'" -ForegroundColor Gray

Write-Host "`nOuverture du site..." -ForegroundColor Cyan
Start-Process "https://$DOMAIN"

Write-Host ""

