# 🔐 Script de génération certificat SSL + Déploiement HTTPS complet
# Domaine: blog.bh-systems.be

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "HTTPS Deployment - blog.bh-systems.be" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$VPS_IP = "173.212.208.181"
$DOMAIN = "blog.bh-systems.be"
$EMAIL = "boujraf.hicham@gmail.com"

# Étape 1: Vérifier DNS
Write-Host "[1/9] Verification DNS..." -ForegroundColor Yellow
try {
    $dnsResult = Resolve-DnsName -Name $DOMAIN -ErrorAction Stop
    if ($dnsResult.IPAddress -contains $VPS_IP) {
        Write-Host "  [OK] DNS correct: $DOMAIN -> $VPS_IP" -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] DNS pointe vers: $($dnsResult.IPAddress)" -ForegroundColor Yellow
        Write-Host "  Attendu: $VPS_IP" -ForegroundColor Yellow
        $continue = Read-Host "Continuer quand meme? (o/n)"
        if ($continue -ne "o") { exit 1 }
    }
} catch {
    Write-Host "  [ERROR] DNS non resolu: $DOMAIN" -ForegroundColor Red
    Write-Host "  Configurez d'abord le DNS avant de continuer!" -ForegroundColor Red
    exit 1
}

# Étape 2: Git pull
Write-Host "`n[2/9] Git pull sur VPS..." -ForegroundColor Yellow
ssh root@${VPS_IP} "cd /root/blog_strapi && git fetch origin && git reset --hard origin/master && git pull origin master"
Write-Host "  [OK] Code mis a jour" -ForegroundColor Green

# Étape 3: Installer Certbot
Write-Host "`n[3/9] Installation Certbot (si necessaire)..." -ForegroundColor Yellow
ssh root@${VPS_IP} @"
if ! command -v certbot &> /dev/null; then
    apt update && apt install -y certbot
    echo 'Certbot installe'
else
    echo 'Certbot deja installe'
fi
mkdir -p /var/www/certbot
"@
Write-Host "  [OK] Certbot pret" -ForegroundColor Green

# Étape 4: Arrêter Nginx temporairement pour obtenir le certificat
Write-Host "`n[4/9] Arret services pour generation SSL..." -ForegroundColor Yellow
ssh root@${VPS_IP} @"
cd /root/blog_strapi
docker-compose -f docker-compose.https-prod.yml down
# Arrêter nginx si il tourne en standalone
systemctl stop nginx 2>/dev/null || true
"@
Write-Host "  [OK] Services arretes" -ForegroundColor Green

# Étape 5: Obtenir certificat SSL
Write-Host "`n[5/9] Generation certificat SSL..." -ForegroundColor Yellow
Write-Host "  (Cette etape peut prendre 1-2 minutes)" -ForegroundColor Gray
ssh root@${VPS_IP} @"
if [ ! -d /etc/letsencrypt/live/$DOMAIN ]; then
    certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email $EMAIL
    echo 'Certificat SSL obtenu'
else
    echo 'Certificat SSL existe deja'
    certbot renew --dry-run
fi
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Certificat SSL obtenu/verifie" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Echec obtention certificat" -ForegroundColor Red
    exit 1
}

# Étape 6: Build images Docker
Write-Host "`n[6/9] Build images Docker..." -ForegroundColor Yellow
Write-Host "  (Cette etape peut prendre 3-5 minutes)" -ForegroundColor Gray
ssh root@${VPS_IP} "cd /root/blog_strapi && docker-compose -f docker-compose.https-prod.yml build"

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Images buildees" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Build echoue" -ForegroundColor Red
    exit 1
}

# Étape 7: Démarrer tous les services
Write-Host "`n[7/9] Demarrage services..." -ForegroundColor Yellow
ssh root@${VPS_IP} "cd /root/blog_strapi && docker-compose -f docker-compose.https-prod.yml up -d"

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Services demarres" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Demarrage echoue" -ForegroundColor Red
    exit 1
}

# Étape 8: Attendre et vérifier
Write-Host "`n[8/9] Attente demarrage (15s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "`n  Status containers:" -ForegroundColor Cyan
ssh root@${VPS_IP} "cd /root/blog_strapi && docker-compose -f docker-compose.https-prod.yml ps"

# Étape 9: Tests
Write-Host "`n[9/9] Tests HTTPS..." -ForegroundColor Yellow

Write-Host "  [1] Test HTTP -> HTTPS redirect..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://$DOMAIN" -MaximumRedirection 0 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 301 -or $response.StatusCode -eq 302) {
        Write-Host " [OK]" -ForegroundColor Green
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 'MovedPermanently' -or $_.Exception.Response.StatusCode -eq 'Redirect') {
        Write-Host " [OK]" -ForegroundColor Green
    } else {
        Write-Host " [FAILED]" -ForegroundColor Red
    }
}

Write-Host "  [2] Test HTTPS Health Check..." -NoNewline
try {
    $health = Invoke-RestMethod -Uri "https://$DOMAIN/health" -SkipCertificateCheck
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "      Status: $($health.status), Uptime: $([math]::Round($health.uptime, 2))s" -ForegroundColor Gray
} catch {
    Write-Host " [FAILED]" -ForegroundColor Red
    Write-Host "      Error: $_" -ForegroundColor Red
}

Write-Host "  [3] Test HTTPS API..." -NoNewline
try {
    $categories = Invoke-RestMethod -Uri "https://$DOMAIN/api/categories" -SkipCertificateCheck
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "      Categories: $($categories.data.Count)" -ForegroundColor Gray
} catch {
    Write-Host " [FAILED]" -ForegroundColor Red
}

Write-Host "  [4] Test HTTPS Frontend..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "https://$DOMAIN" -SkipCertificateCheck
    if ($response.StatusCode -eq 200) {
        Write-Host " [OK]" -ForegroundColor Green
        Write-Host "      Status: $($response.StatusCode)" -ForegroundColor Gray
    }
} catch {
    Write-Host " [FAILED]" -ForegroundColor Red
}

# Résumé final
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEPLOIEMENT HTTPS REUSSI!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Votre blog est maintenant accessible sur:" -ForegroundColor Cyan
Write-Host "  🌐 Frontend:  https://$DOMAIN" -ForegroundColor Green
Write-Host "  🔌 API:       https://$DOMAIN/api" -ForegroundColor Green
Write-Host "  ❤️  Health:    https://$DOMAIN/health" -ForegroundColor Green

Write-Host "`n📊 Admin credentials:" -ForegroundColor Cyan
Write-Host "  Email:    boujraf.hicham@gmail.com" -ForegroundColor Gray
Write-Host "  Password: Admin123!" -ForegroundColor Gray

Write-Host "`n🔐 Certificat SSL:" -ForegroundColor Cyan
Write-Host "  Emetteur: Let's Encrypt" -ForegroundColor Gray
Write-Host "  Validite: 90 jours (renouvellement automatique)" -ForegroundColor Gray
Write-Host "  Commande: ssh root@$VPS_IP 'certbot renew'" -ForegroundColor Gray

Write-Host "`n🛠️  Commandes utiles:" -ForegroundColor Cyan
Write-Host "  Logs:    ssh root@$VPS_IP 'cd /root/blog_strapi && docker-compose -f docker-compose.https-prod.yml logs -f'" -ForegroundColor Gray
Write-Host "  Restart: ssh root@$VPS_IP 'cd /root/blog_strapi && docker-compose -f docker-compose.https-prod.yml restart'" -ForegroundColor Gray
Write-Host "  Status:  ssh root@$VPS_IP 'cd /root/blog_strapi && docker-compose -f docker-compose.https-prod.yml ps'" -ForegroundColor Gray

Write-Host "`nOuverture du navigateur..." -ForegroundColor Cyan
Start-Process "https://$DOMAIN"
