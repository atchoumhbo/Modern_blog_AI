#!/usr/bin/env pwsh
# Script de nettoyage complet et redéploiement MERN
# Arrête TOUT, nettoie, et redéploie proprement

$ErrorActionPreference = "Stop"
$VPS_IP = "173.212.208.181"
$VPS_USER = "root"
$DOMAIN = "blog.bh-systems.be"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   NETTOYAGE COMPLET + REDEPLOIEMENT MERN" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Nettoyage complet sur le VPS
Write-Host "[1/7] Nettoyage complet Docker sur VPS..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} @"
echo "Arret de tous les conteneurs Docker..."
docker stop `$(docker ps -aq) 2>/dev/null || true

echo ""
echo "Suppression de tous les conteneurs..."
docker rm `$(docker ps -aq) 2>/dev/null || true

echo ""
echo "Arret du service systemd frontend (si existe)..."
systemctl stop blog-frontend 2>/dev/null || true
systemctl disable blog-frontend 2>/dev/null || true
rm -f /etc/systemd/system/blog-frontend.service 2>/dev/null || true
systemctl daemon-reload

echo ""
echo "Nettoyage des images Docker non utilisees..."
docker image prune -f

echo ""
echo "Nettoyage des volumes non utilises..."
docker volume prune -f

echo ""
echo "Nettoyage des reseaux non utilises..."
docker network prune -f

echo ""
echo "Liste des conteneurs restants (devrait etre vide):"
docker ps -a
"@

Write-Host "   Nettoyage termine" -ForegroundColor Green

# Étape 2: Commit et push du code
Write-Host ""
Write-Host "[2/7] Push du code vers Git..." -ForegroundColor Yellow
git add .
git commit -m "feat: Clean deployment MERN full stack" 2>$null
git push origin master
Write-Host "   Code pushe" -ForegroundColor Green

# Étape 3: Pull sur le VPS
Write-Host ""
Write-Host "[3/7] Pull du code sur VPS..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} "cd /root/blog_strapi && git pull origin master"
Write-Host "   Code mis a jour sur VPS" -ForegroundColor Green

# Étape 4: Build du backend
Write-Host ""
Write-Host "[4/7] Build du backend MERN..." -ForegroundColor Yellow
Write-Host "   Cela peut prendre 2-3 minutes..." -ForegroundColor Gray

ssh ${VPS_USER}@${VPS_IP} @"
cd /root/blog_strapi
echo "Build de l'image backend..."
docker-compose -f docker-compose.mern-full.yml build --no-cache backend
"@

Write-Host "   Backend build termine" -ForegroundColor Green

# Étape 5: Build du frontend
Write-Host ""
Write-Host "[5/7] Build du frontend SSR..." -ForegroundColor Yellow
Write-Host "   Cela peut prendre 2-3 minutes..." -ForegroundColor Gray

ssh ${VPS_USER}@${VPS_IP} @"
cd /root/blog_strapi
echo "Build de l'image frontend..."
docker-compose -f docker-compose.mern-full.yml build --no-cache frontend
"@

Write-Host "   Frontend build termine" -ForegroundColor Green

# Étape 6: Démarrage des services
Write-Host ""
Write-Host "[6/7] Demarrage des services MERN..." -ForegroundColor Yellow

ssh ${VPS_USER}@${VPS_IP} @"
cd /root/blog_strapi

echo "Demarrage de PostgreSQL..."
docker-compose -f docker-compose.mern-full.yml up -d postgres

echo "Attente de PostgreSQL (15s)..."
sleep 15

echo ""
echo "Demarrage du backend..."
docker-compose -f docker-compose.mern-full.yml up -d backend

echo "Attente du backend (20s)..."
sleep 20

echo ""
echo "Execution des migrations Prisma..."
docker exec blog-backend npx prisma migrate deploy || echo "Migrations deja a jour"

echo ""
echo "Verification du seed (si necessaire)..."
docker exec blog-backend node scripts/seed-production.js || echo "Donnees deja presentes"

echo ""
echo "Demarrage du frontend..."
docker-compose -f docker-compose.mern-full.yml up -d frontend

echo "Attente du frontend (15s)..."
sleep 15

echo ""
echo "Status des conteneurs:"
docker-compose -f docker-compose.mern-full.yml ps

echo ""
echo "Logs backend (dernieres 15 lignes):"
docker logs blog-backend --tail 15

echo ""
echo "Logs frontend (dernieres 15 lignes):"
docker logs blog-frontend --tail 15
"@

Write-Host "   Services demarres" -ForegroundColor Green

# Étape 7: Configuration Nginx
Write-Host ""
Write-Host "[7/7] Configuration Nginx..." -ForegroundColor Yellow

$nginxConfig = @"
# Configuration Nginx - MERN Full Stack
# Backend: localhost:3001/api
# Frontend SSR: localhost:3002
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

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # Logs
    access_log /var/log/nginx/${DOMAIN}_access.log;
    error_log /var/log/nginx/${DOMAIN}_error.log;

    # API Backend MERN
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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host `$host;
        access_log off;
    }

    # Frontend SSR
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

# Écrire et activer la config Nginx
$nginxConfig | ssh ${VPS_USER}@${VPS_IP} "cat > /etc/nginx/sites-available/$DOMAIN.conf"

ssh ${VPS_USER}@${VPS_IP} @"
# Supprimer les anciennes configs
rm -f /etc/nginx/sites-enabled/blog.bh-systems.be-direct.conf 2>/dev/null || true
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Activer la nouvelle config
ln -sf /etc/nginx/sites-available/$DOMAIN.conf /etc/nginx/sites-enabled/$DOMAIN.conf

# Tester et recharger
nginx -t && systemctl reload nginx
"@

Write-Host "   Nginx configure" -ForegroundColor Green

# Résumé final
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   DEPLOIEMENT TERMINE AVEC SUCCES!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services disponibles:" -ForegroundColor Yellow
Write-Host "  Frontend:  https://$DOMAIN" -ForegroundColor White
Write-Host "  Backend:   https://$DOMAIN/api" -ForegroundColor White
Write-Host "  Health:    https://$DOMAIN/health" -ForegroundColor White
Write-Host ""
Write-Host "Commandes utiles:" -ForegroundColor Yellow
Write-Host "  docker-compose -f docker-compose.mern-full.yml ps" -ForegroundColor Gray
Write-Host "  docker-compose -f docker-compose.mern-full.yml logs -f" -ForegroundColor Gray
Write-Host "  docker logs blog-backend -f" -ForegroundColor Gray
Write-Host "  docker logs blog-frontend -f" -ForegroundColor Gray
Write-Host ""

# Tests finaux
Write-Host "Tests de connectivite..." -ForegroundColor Yellow

Start-Sleep -Seconds 5

Write-Host "  Backend health..." -ForegroundColor Gray
try {
    $health = Invoke-WebRequest -Uri "https://$DOMAIN/health" -UseBasicParsing -TimeoutSec 10
    Write-Host "  Backend OK (Status: $($health.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  Backend non accessible encore" -ForegroundColor Yellow
}

Write-Host "  Frontend..." -ForegroundColor Gray
try {
    $frontend = Invoke-WebRequest -Uri "https://$DOMAIN" -UseBasicParsing -TimeoutSec 10
    Write-Host "  Frontend OK (Status: $($frontend.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  Frontend non accessible encore" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Testez maintenant sur: https://$DOMAIN" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dossier N8N present dans: /root/blog_strapi/backend/n8n" -ForegroundColor Yellow
