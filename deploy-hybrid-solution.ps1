# Solution 2: Installation manuelle de Strapi + Frontend en Docker
# Cette approche évite complètement le Dockerfile backend problématique

Write-Host "🔧 SOLUTION 2: Installation Hybride (Strapi manuel + Frontend Docker)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$VPS_IP = "173.212.208.181"
$VPS_USER = "root"

Write-Host "📋 Cette solution va:" -ForegroundColor Yellow
Write-Host "  1. Installer Strapi MANUELLEMENT dans /root/blog_strapi/backend" -ForegroundColor White
Write-Host "  2. Créer un docker-compose SANS service Strapi" -ForegroundColor White
Write-Host "  3. Lancer Strapi avec PM2 (process manager)" -ForegroundColor White
Write-Host "  4. Frontend + Nginx restent en Docker" -ForegroundColor White
Write-Host "  5. Nginx proxy vers Strapi en localhost:1337" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Voulez-vous continuer? (o/n)"
if ($confirm -ne "o" -and $confirm -ne "O") {
    Write-Host "❌ Annulé" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📤 Déploiement de la solution hybride..." -ForegroundColor Green

# Script d'installation hybride
$hybridScript = @"
#!/bin/bash
set -e

echo "🎯 SOLUTION HYBRIDE: Strapi Manuel + Frontend Docker"
echo "===================================================="

# Aller dans le dossier du projet
cd /root/blog_strapi

echo ""
echo "📦 Étape 1: Installation des dépendances backend (SANS Docker)"
cd backend

# S'assurer que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé!"
    exit 1
fi

echo "   Node version: \$(node --version)"
echo "   NPM version: \$(npm --version)"

# Nettoyer et installer
echo "   Nettoyage..."
rm -rf node_modules package-lock.json

echo "   Installation des dépendances..."
npm install

echo "   Installation de ts-node (requis pour Strapi v5)..."
npm install ts-node @types/node typescript

echo ""
echo "🏗️ Étape 2: Build du backend Strapi"
npm run build

echo ""
echo "📝 Étape 3: Vérification de la configuration .env"
if [ ! -f .env.production ]; then
    echo "❌ Fichier .env.production manquant!"
    exit 1
fi

# Créer le dossier data pour SQLite
mkdir -p data

echo ""
echo "🐳 Étape 4: Préparation du docker-compose SANS Strapi"
cd /root/blog_strapi

# Créer une version modifiée du docker-compose
cat > docker-compose.hybrid.yml << 'DOCKERCOMPOSE'
version: '3.8'

services:
  # Redis pour le cache
  redis:
    image: redis:7-alpine
    container_name: blog-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass changeme
    volumes:
      - redis_data:/data
    networks:
      - blog-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Frontend React (en Docker)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_STRAPI_URL: https://blog.bh-systems.be
        VITE_STRAPI_URL_SERVER: http://host.docker.internal:1337
        VITE_SITE_URL: https://blog.bh-systems.be
    container_name: blog-frontend
    restart: unless-stopped
    environment:
      NODE_ENV: production
    networks:
      - blog-network
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    container_name: blog-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - strapi_uploads:/var/www/uploads:ro
    networks:
      - blog-network
    depends_on:
      - frontend
    extra_hosts:
      - "host.docker.internal:host-gateway"
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  blog-network:
    driver: bridge

volumes:
  redis_data:
  strapi_uploads:
DOCKERCOMPOSE

echo ""
echo "🔧 Étape 5: Modification de nginx.conf pour Strapi host.docker.internal"
# Le nginx.conf doit pointer vers host.docker.internal:1337 au lieu de strapi:1337
# On va créer une version modifiée

cat > nginx/nginx.hybrid.conf << 'NGINXCONF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    # HTTP Redirect to HTTPS
    server {
        listen 80;
        server_name blog.bh-systems.be;
        return 301 https://\$server_name\$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl;
        http2 on;
        server_name blog.bh-systems.be;

        # SSL Configuration
        ssl_certificate /etc/letsencrypt/live/blog.bh-systems.be/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/blog.bh-systems.be/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';

        # Security Headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;

        # Frontend (React Router)
        location / {
            proxy_pass http://frontend:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_cache_bypass \$http_upgrade;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Backend Strapi API (MANUEL sur host)
        location /api/ {
            proxy_pass http://host.docker.internal:1337/api/;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Strapi Admin
        location /admin/ {
            proxy_pass http://host.docker.internal:1337/admin/;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Strapi Uploads
        location /uploads/ {
            proxy_pass http://host.docker.internal:1337/uploads/;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
        }
    }
}
NGINXCONF

# Utiliser cette nouvelle config
cp nginx/nginx.hybrid.conf nginx/nginx.conf

echo ""
echo "📦 Étape 6: Installation de PM2 pour gérer Strapi"
npm install -g pm2

echo ""
echo "📝 Étape 7: Création du fichier de configuration PM2"
cat > backend/ecosystem.config.js << 'PM2CONFIG'
module.exports = {
  apps: [{
    name: 'strapi-backend',
    script: 'npm',
    args: 'start',
    cwd: '/root/blog_strapi/backend',
    env: {
      NODE_ENV: 'production',
      PORT: 1337,
      HOST: '0.0.0.0'
    },
    error_file: '/root/blog_strapi/backend/logs/pm2-error.log',
    out_file: '/root/blog_strapi/backend/logs/pm2-out.log',
    time: true,
    instances: 1,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
};
PM2CONFIG

mkdir -p backend/logs

echo ""
echo "🚀 Étape 8: Démarrage de Strapi avec PM2"
cd backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo ""
echo "🐳 Étape 9: Arrêt de l'ancien Docker et démarrage du nouveau"
cd /root/blog_strapi
docker-compose down
docker-compose -f docker-compose.hybrid.yml up -d --build

echo ""
echo "✅ INSTALLATION HYBRIDE TERMINÉE!"
echo ""
echo "📊 VÉRIFICATIONS:"
echo "  1. Strapi (PM2):    pm2 status"
echo "  2. Strapi logs:     pm2 logs strapi-backend"
echo "  3. Docker:          docker-compose -f docker-compose.hybrid.yml ps"
echo "  4. Test Strapi:     curl http://localhost:1337/_health"
echo "  5. Test Frontend:   curl https://blog.bh-systems.be"
echo ""
echo "🌐 URLs:"
echo "  - Frontend: https://blog.bh-systems.be"
echo "  - Admin:    https://blog.bh-systems.be/admin"
echo "  - API:      https://blog.bh-systems.be/api"
echo ""
"@

# Sauvegarder et exécuter
$hybridScript | Out-File -FilePath ".\deploy-hybrid-vps.sh" -Encoding UTF8 -NoNewline

Write-Host "📤 Upload du script hybride..." -ForegroundColor Green
scp -o StrictHostKeyChecking=no ".\deploy-hybrid-vps.sh" "${VPS_USER}@${VPS_IP}:/root/deploy-hybrid-vps.sh"

Write-Host "🔧 Exécution du déploiement hybride..." -ForegroundColor Green
ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_IP}" "chmod +x /root/deploy-hybrid-vps.sh && /root/deploy-hybrid-vps.sh"

Write-Host ""
Write-Host "✅ Déploiement hybride terminé!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 COMMANDES UTILES:" -ForegroundColor Yellow
Write-Host "  Voir l'état de Strapi:  ssh root@173.212.208.181 'pm2 status'" -ForegroundColor Cyan
Write-Host "  Logs Strapi:            ssh root@173.212.208.181 'pm2 logs strapi-backend'" -ForegroundColor Cyan
Write-Host "  Redémarrer Strapi:      ssh root@173.212.208.181 'pm2 restart strapi-backend'" -ForegroundColor Cyan
Write-Host "  État Docker:            ssh root@173.212.208.181 'docker-compose -f docker-compose.hybrid.yml ps'" -ForegroundColor Cyan
Write-Host ""

# Nettoyage
Remove-Item ".\deploy-hybrid-vps.sh" -ErrorAction SilentlyContinue
