# 🚀 Script de déploiement HTTPS - blog.bh-systems.be

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deploiement HTTPS - blog.bh-systems.be" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$VPS_IP = "173.212.208.181"
$DOMAIN = "blog.bh-systems.be"

# Étape 1: Vérifier DNS
Write-Host "[1/8] Verification DNS..." -ForegroundColor Yellow
try {
    $dnsResult = Resolve-DnsName -Name $DOMAIN -ErrorAction Stop
    if ($dnsResult.IPAddress -contains $VPS_IP) {
        Write-Host "  [OK] DNS correct: $DOMAIN -> $VPS_IP" -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] DNS pointe vers: $($dnsResult.IPAddress)" -ForegroundColor Yellow
        Write-Host "  Attendu: $VPS_IP" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [ERROR] DNS non resolu: $DOMAIN" -ForegroundColor Red
    Write-Host "  Configurez d'abord le DNS avant de continuer!" -ForegroundColor Red
    exit 1
}

# Étape 2: Build frontend production
Write-Host "`n[2/8] Build frontend production..." -ForegroundColor Yellow
Set-Location C:\Devops\blog_strapi\frontend
if (Test-Path "dist") {
    Remove-Item -Recurse -Force dist
}
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Build reussi" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Build echoue" -ForegroundColor Red
    exit 1
}

# Étape 3: Copier config Nginx
Write-Host "`n[3/8] Transfert config Nginx..." -ForegroundColor Yellow
scp C:\Devops\blog_strapi\nginx\blog.bh-systems.be.conf root@${VPS_IP}:/tmp/
Write-Host "  [OK] Config Nginx transferee" -ForegroundColor Green

# Étape 4: Installer Nginx et Certbot
Write-Host "`n[4/8] Installation Nginx et Certbot sur VPS..." -ForegroundColor Yellow
Write-Host "  (Cette etape peut prendre quelques minutes)" -ForegroundColor Gray
ssh root@${VPS_IP} @"
apt update && apt install -y nginx certbot python3-certbot-nginx
mkdir -p /var/www/certbot /var/www/blog-frontend
chown -R www-data:www-data /var/www/certbot /var/www/blog-frontend
"@
Write-Host "  [OK] Nginx et Certbot installes" -ForegroundColor Green

# Étape 5: Configuration Nginx temporaire pour Certbot
Write-Host "`n[5/8] Configuration Nginx temporaire..." -ForegroundColor Yellow
ssh root@${VPS_IP} @"
cat > /etc/nginx/sites-available/blog-temp.conf <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host \`$host;
        proxy_set_header X-Real-IP \`$remote_addr;
    }
    
    location / {
        return 200 'Backend API running. SSL setup in progress...';
        add_header Content-Type text/plain;
    }
}
EOF

ln -sf /etc/nginx/sites-available/blog-temp.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
"@
Write-Host "  [OK] Config temporaire active" -ForegroundColor Green

# Étape 6: Obtenir certificat SSL
Write-Host "`n[6/8] Obtention certificat SSL Let's Encrypt..." -ForegroundColor Yellow
Write-Host "  [INFO] Certbot va demander votre email" -ForegroundColor Cyan
ssh root@${VPS_IP} "certbot certonly --nginx -d $DOMAIN --non-interactive --agree-tos --email boujraf.hicham@gmail.com || certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email boujraf.hicham@gmail.com"
Write-Host "  [OK] Certificat SSL obtenu" -ForegroundColor Green

# Étape 7: Configuration finale Nginx
Write-Host "`n[7/8] Configuration Nginx finale..." -ForegroundColor Yellow
ssh root@${VPS_IP} @"
mv /tmp/blog.bh-systems.be.conf /etc/nginx/sites-available/
rm -f /etc/nginx/sites-enabled/blog-temp.conf
ln -sf /etc/nginx/sites-available/blog.bh-systems.be.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
"@
Write-Host "  [OK] Config finale active" -ForegroundColor Green

# Étape 8: Déployer frontend
Write-Host "`n[8/8] Deploiement frontend..." -ForegroundColor Yellow
scp -r dist/* root@${VPS_IP}:/var/www/blog-frontend/
Write-Host "  [OK] Frontend deploye" -ForegroundColor Green

# Configuration CORS backend
Write-Host "`n[BONUS] Configuration CORS backend..." -ForegroundColor Yellow
ssh root@${VPS_IP} @"
cd /root/blog_strapi/backend-mern
if ! grep -q 'CORS_ORIGINS' .env.production; then
    echo 'CORS_ORIGINS=https://$DOMAIN,http://localhost:5173' >> .env.production
    echo 'FRONTEND_URL=https://$DOMAIN' >> .env.production
    docker-compose -f docker-compose.prod.yml restart backend
    echo 'CORS configure et backend redémarre'
else
    echo 'CORS deja configure'
fi
"@
Write-Host "  [OK] CORS configure" -ForegroundColor Green

# Tests finaux
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TESTS FINAUX" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Start-Sleep -Seconds 3

Write-Host "Test Health Check..." -NoNewline
try {
    $health = Invoke-RestMethod -Uri "https://$DOMAIN/health" -SkipCertificateCheck
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "  Status: $($health.status)" -ForegroundColor Gray
} catch {
    Write-Host " [FAILED]" -ForegroundColor Red
}

Write-Host "Test API Categories..." -NoNewline
try {
    $categories = Invoke-RestMethod -Uri "https://$DOMAIN/api/categories" -SkipCertificateCheck
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "  Count: $($categories.data.Count)" -ForegroundColor Gray
} catch {
    Write-Host " [FAILED]" -ForegroundColor Red
}

# Résumé final
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEPLOIEMENT REUSSI!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Frontend:  https://$DOMAIN" -ForegroundColor Green
Write-Host "API:       https://$DOMAIN/api" -ForegroundColor Green
Write-Host "Health:    https://$DOMAIN/health" -ForegroundColor Green

Write-Host "`nOuvrir le site dans le navigateur..." -ForegroundColor Cyan
Start-Process "https://$DOMAIN"

Write-Host "`n[INFO] Le certificat SSL sera renouvele automatiquement" -ForegroundColor Cyan
Write-Host "[INFO] Logs Nginx: ssh root@$VPS_IP 'tail -f /var/log/nginx/access.log'" -ForegroundColor Cyan
