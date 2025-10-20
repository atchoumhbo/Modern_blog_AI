#!/usr/bin/env pwsh
# Script de déploiement Frontend SSR avec Docker Compose
# Utilise docker-compose.frontend-prod.yml

$ErrorActionPreference = "Stop"
$VPS_IP = "173.212.208.181"
$VPS_USER = "root"
$DOMAIN = "blog.bh-systems.be"

Write-Host "🚀 Déploiement Frontend SSR React Router v7" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Build du frontend localement
Write-Host "[1/5] Build du frontend React Router v7..." -ForegroundColor Yellow
Set-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du build du frontend" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build frontend réussi" -ForegroundColor Green
Set-Location ..

# Étape 2: Commit et push vers Git
Write-Host ""
Write-Host "[2/5] Push vers Git..." -ForegroundColor Yellow
git add docker-compose.frontend-prod.yml frontend/Dockerfile.ssr
git commit -m "feat: Deploy frontend SSR with Docker Compose" 2>$null
git push origin master
Write-Host "✅ Code pushé sur Git" -ForegroundColor Green

# Étape 3: Pull sur le VPS
Write-Host ""
Write-Host "[3/5] Pull du code sur VPS..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} @"
cd /root/blog_strapi
git pull origin master
"@
Write-Host "✅ Code mis à jour sur VPS" -ForegroundColor Green

# Étape 4: Build et démarrage avec Docker Compose
Write-Host ""
Write-Host "[4/5] Build et démarrage du conteneur frontend..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} @"
cd /root/blog_strapi
# Arrêter l'ancien conteneur s'il existe
docker-compose -f docker-compose.frontend-prod.yml down 2>/dev/null || true
# Build et démarrer le nouveau
docker-compose -f docker-compose.frontend-prod.yml build --no-cache
docker-compose -f docker-compose.frontend-prod.yml up -d
# Attendre que le conteneur soit prêt
sleep 10
# Vérifier le status
docker-compose -f docker-compose.frontend-prod.yml ps
docker logs blog-frontend-prod --tail 50
"@
Write-Host "✅ Conteneur frontend démarré" -ForegroundColor Green

# Étape 5: Mise à jour Nginx
Write-Host ""
Write-Host "[5/5] Mise à jour configuration Nginx..." -ForegroundColor Yellow

$nginxConfig = @"
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Logs
    access_log /var/log/nginx/${DOMAIN}_access.log;
    error_log /var/log/nginx/${DOMAIN}_error.log;

    # API Backend (Express)
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \`$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \`$host;
        proxy_cache_bypass \`$http_upgrade;
        proxy_set_header X-Real-IP \`$remote_addr;
        proxy_set_header X-Forwarded-For \`$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \`$scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host \`$host;
    }

    # Frontend SSR (React Router v7)
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \`$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \`$host;
        proxy_cache_bypass \`$http_upgrade;
        proxy_set_header X-Real-IP \`$remote_addr;
        proxy_set_header X-Forwarded-For \`$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \`$scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    return 301 https://\`$server_name\`$request_uri;
}
"@

# Écrire la config Nginx sur le VPS
$nginxConfig | ssh ${VPS_USER}@${VPS_IP} "cat > /etc/nginx/sites-available/$DOMAIN.conf"

# Activer le site et recharger Nginx
ssh ${VPS_USER}@${VPS_IP} @"
ln -sf /etc/nginx/sites-available/$DOMAIN.conf /etc/nginx/sites-enabled/$DOMAIN.conf
nginx -t && systemctl reload nginx
"@

Write-Host "✅ Nginx configuré et rechargé" -ForegroundColor Green

# Test final
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "✅ Déploiement terminé avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend SSR disponible sur:" -ForegroundColor Cyan
Write-Host "   https://$DOMAIN" -ForegroundColor White
Write-Host ""
Write-Host "📊 Vérifications:" -ForegroundColor Yellow
Write-Host "   docker-compose -f docker-compose.frontend-prod.yml logs -f" -ForegroundColor Gray
Write-Host "   curl https://$DOMAIN" -ForegroundColor Gray
Write-Host ""

# Test HTTPS
Write-Host "🧪 Test HTTPS..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "https://$DOMAIN" -UseBasicParsing -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) {
    Write-Host "✅ Frontend accessible (Status: $($response.StatusCode))" -ForegroundColor Green
} else {
    Write-Host "⚠️  Status: $($response.StatusCode)" -ForegroundColor Yellow
}
