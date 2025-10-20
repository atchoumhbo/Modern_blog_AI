#!/bin/bash
# Script de déploiement MERN complet - À exécuter sur le VPS
set -e

DOMAIN="blog.bh-systems.be"
PROJECT_DIR="/root/blog_strapi"

echo "=================================================="
echo "   DEPLOIEMENT MERN FULL STACK"
echo "=================================================="
echo ""

# Étape 1: Nettoyage
echo "[1/5] Nettoyage Docker..."
cd $PROJECT_DIR

# Arrêter tous les conteneurs
echo "Arrêt de tous les conteneurs..."
docker stop $(docker ps -aq) 2>/dev/null || true

# Supprimer tous les conteneurs
echo "Suppression de tous les conteneurs..."
docker rm $(docker ps -aq) 2>/dev/null || true

# Nettoyer les services systemd
echo "Nettoyage systemd..."
systemctl stop blog-frontend 2>/dev/null || true
systemctl disable blog-frontend 2>/dev/null || true
rm -f /etc/systemd/system/blog-frontend.service 2>/dev/null || true
systemctl daemon-reload

# Nettoyer les ressources non utilisées
echo "Nettoyage des ressources..."
docker image prune -f
docker volume prune -f
docker network prune -f

echo "✓ Nettoyage terminé"
echo ""

# Étape 2: Build backend
echo "[2/5] Build du backend MERN..."
docker-compose -f docker-compose.mern-full.yml build --no-cache backend
echo "✓ Backend build terminé"
echo ""

# Étape 3: Build frontend
echo "[3/5] Build du frontend SSR..."
docker-compose -f docker-compose.mern-full.yml build --no-cache frontend
echo "✓ Frontend build terminé"
echo ""

# Étape 4: Démarrage des services
echo "[4/5] Démarrage des services..."

# Démarrer PostgreSQL
echo "Démarrage de PostgreSQL..."
docker-compose -f docker-compose.mern-full.yml up -d postgres
echo "Attente de PostgreSQL (15s)..."
sleep 15

# Démarrer backend
echo "Démarrage du backend..."
docker-compose -f docker-compose.mern-full.yml up -d backend
echo "Attente du backend (20s)..."
sleep 20

# Migrations Prisma
echo "Exécution des migrations Prisma..."
docker exec blog-backend npx prisma migrate deploy || echo "Migrations déjà à jour"

# Seed si nécessaire
echo "Vérification du seed..."
docker exec blog-backend node scripts/seed-production.js || echo "Données déjà présentes"

# Démarrer frontend
echo "Démarrage du frontend..."
docker-compose -f docker-compose.mern-full.yml up -d frontend
echo "Attente du frontend (15s)..."
sleep 15

echo "✓ Services démarrés"
echo ""

# Étape 5: Configuration Nginx
echo "[5/5] Configuration Nginx..."

cat > /etc/nginx/sites-available/$DOMAIN.conf << 'EOF'
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name blog.bh-systems.be;

    ssl_certificate /etc/letsencrypt/live/blog.bh-systems.be/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/blog.bh-systems.be/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    access_log /var/log/nginx/blog.bh-systems.be_access.log;
    error_log /var/log/nginx/blog.bh-systems.be_error.log;

    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name blog.bh-systems.be;
    return 301 https://$server_name$request_uri;
}
EOF

# Supprimer les anciennes configs
rm -f /etc/nginx/sites-enabled/blog.bh-systems.be-direct.conf 2>/dev/null || true
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Activer la nouvelle config
ln -sf /etc/nginx/sites-available/$DOMAIN.conf /etc/nginx/sites-enabled/$DOMAIN.conf

# Tester et recharger Nginx
nginx -t && systemctl reload nginx

echo "✓ Nginx configuré"
echo ""

# Résumé
echo "=================================================="
echo "   DEPLOIEMENT TERMINE!"
echo "=================================================="
echo ""
echo "Status des conteneurs:"
docker-compose -f docker-compose.mern-full.yml ps
echo ""
echo "Services disponibles:"
echo "  Frontend:  https://$DOMAIN"
echo "  Backend:   https://$DOMAIN/api"
echo "  Health:    https://$DOMAIN/health"
echo ""
echo "Logs:"
echo "  docker logs blog-backend -f"
echo "  docker logs blog-frontend -f"
echo ""
