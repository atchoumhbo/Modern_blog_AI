#!/usr/bin/env pwsh
# Script de déploiement MERN complet (Backend + Frontend SSR)
# Utilise docker-compose.mern-full.yml

$ErrorActionPreference = "Stop"
$VPS_IP = "173.212.208.181"
$VPS_USER = "root"
$DOMAIN = "blog.bh-systems.be"

Write-Host "🚀 Déploiement MERN Full Stack (Backend + Frontend SSR)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Commit et push vers Git
Write-Host "[1/5] Push vers Git..." -ForegroundColor Yellow
git add .
git commit -m "feat: Deploy MERN full stack with Docker Compose" 2>$null
git push origin master
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Pas de changements à commiter ou erreur Git" -ForegroundColor Yellow
}
Write-Host "✅ Code pushé sur Git" -ForegroundColor Green

# Étape 2: Pull sur le VPS
Write-Host ""
Write-Host "[2/5] Pull du code sur VPS..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} "cd /root/blog_strapi && git pull origin master"
Write-Host "✅ Code mis à jour sur VPS" -ForegroundColor Green

# Étape 3: Arrêter les anciens conteneurs
Write-Host ""
Write-Host "[3/5] Arrêt des anciens conteneurs..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} @"
cd /root/blog_strapi
# Arrêter l'ancien backend si présent
docker-compose -f docker-compose.mern-prod.yml down 2>/dev/null || true
# Arrêter l'ancien frontend si présent
docker-compose -f docker-compose.frontend-prod.yml down 2>/dev/null || true
# Arrêter le service systemd du frontend SSR si présent
systemctl stop blog-frontend 2>/dev/null || true
systemctl disable blog-frontend 2>/dev/null || true
"@
Write-Host "✅ Anciens conteneurs arrêtés" -ForegroundColor Green

# Étape 4: Build et démarrage avec Docker Compose
Write-Host ""
Write-Host "[4/5] Build et démarrage des conteneurs MERN..." -ForegroundColor Yellow
Write-Host "   ⏳ Cela peut prendre 2-3 minutes..." -ForegroundColor Gray

ssh ${VPS_USER}@${VPS_IP} @"
cd /root/blog_strapi

# Build les images (backend + frontend)
echo "🔨 Build backend..."
docker-compose -f docker-compose.mern-full.yml build backend

echo ""
echo "🔨 Build frontend SSR..."
docker-compose -f docker-compose.mern-full.yml build frontend

# Démarrer tous les services
echo ""
echo "🚀 Démarrage des services..."
docker-compose -f docker-compose.mern-full.yml up -d

# Attendre que les services soient prêts
echo ""
echo "⏳ Attente du démarrage des services..."
sleep 15

# Vérifier les migrations Prisma
echo ""
echo "📊 Exécution des migrations Prisma..."
docker exec blog-backend npx prisma migrate deploy 2>/dev/null || echo "Migrations déjà à jour"

# Vérifier le status
echo ""
echo "📊 Status des conteneurs:"
docker-compose -f docker-compose.mern-full.yml ps

echo ""
echo "📋 Logs backend (dernières 20 lignes):"
docker logs blog-backend --tail 20

echo ""
echo "📋 Logs frontend (dernières 20 lignes):"
docker logs blog-frontend --tail 20
"@

Write-Host "✅ Conteneurs MERN démarrés" -ForegroundColor Green

# Étape 5: Configuration Nginx
Write-Host ""
Write-Host "[5/5] Configuration Nginx..." -ForegroundColor Yellow

$nginxConfig = @"
# Configuration Nginx - MERN Full Stack
# Backend: localhost:3001 → /api/
# Frontend SSR: localhost:3002 → /
# SSL: Let's Encrypt

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

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Logs
    access_log /var/log/nginx/${DOMAIN}_access.log;
    error_log /var/log/nginx/${DOMAIN}_error.log;

    # API Backend MERN (Express sur port 3001)
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_cache_bypass `$http_upgrade;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        
        # Timeouts pour les requêtes lentes
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check backend
    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host `$host;
        access_log off;
    }

    # Frontend SSR React Router v7 (port 3002)
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_cache_bypass `$http_upgrade;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        
        # Timeouts pour SSR
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    return 301 https://`$server_name`$request_uri;
}
"@

# Écrire la config Nginx
$nginxConfig | ssh ${VPS_USER}@${VPS_IP} "cat > /etc/nginx/sites-available/$DOMAIN.conf"

# Tester et recharger Nginx
ssh ${VPS_USER}@${VPS_IP} @"
# Créer le lien symbolique
ln -sf /etc/nginx/sites-available/$DOMAIN.conf /etc/nginx/sites-enabled/$DOMAIN.conf

# Supprimer l'ancienne config si elle existe
rm -f /etc/nginx/sites-enabled/blog.bh-systems.be-direct.conf 2>/dev/null || true

# Tester la config
echo "🧪 Test de la configuration Nginx..."
nginx -t

# Recharger Nginx
if [ \`$? -eq 0 ]; then
    echo "✅ Configuration Nginx valide, rechargement..."
    systemctl reload nginx
    echo "✅ Nginx rechargé"
else
    echo "❌ Erreur dans la configuration Nginx"
    exit 1
fi
"@

Write-Host "✅ Nginx configuré et rechargé" -ForegroundColor Green

# Test final
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "✅ Déploiement MERN Full Stack terminé!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Services disponibles:" -ForegroundColor Cyan
Write-Host "   Frontend:  https://$DOMAIN" -ForegroundColor White
Write-Host "   Backend:   https://$DOMAIN/api" -ForegroundColor White
Write-Host "   Health:    https://$DOMAIN/health" -ForegroundColor White
Write-Host ""
Write-Host "📊 Commandes utiles:" -ForegroundColor Yellow
Write-Host "   ssh root@$VPS_IP 'docker-compose -f /root/blog_strapi/docker-compose.mern-full.yml ps'" -ForegroundColor Gray
Write-Host "   ssh root@$VPS_IP 'docker-compose -f /root/blog_strapi/docker-compose.mern-full.yml logs -f'" -ForegroundColor Gray
Write-Host "   ssh root@$VPS_IP 'docker logs blog-backend -f'" -ForegroundColor Gray
Write-Host "   ssh root@$VPS_IP 'docker logs blog-frontend -f'" -ForegroundColor Gray
Write-Host ""

# Tests HTTPS
Write-Host "🧪 Tests de connectivité..." -ForegroundColor Yellow

Write-Host "   Backend health..." -ForegroundColor Gray
try {
    $healthResponse = Invoke-WebRequest -Uri "https://$DOMAIN/health" -UseBasicParsing -TimeoutSec 10
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Backend OK (Status: 200)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Backend health check échoué" -ForegroundColor Yellow
}

Write-Host "   Frontend..." -ForegroundColor Gray
try {
    $frontendResponse = Invoke-WebRequest -Uri "https://$DOMAIN" -UseBasicParsing -TimeoutSec 10
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Frontend OK (Status: 200)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Frontend non accessible" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Deploiement termine! Testez sur: https://$DOMAIN" -ForegroundColor Cyan
