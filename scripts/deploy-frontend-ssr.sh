#!/bin/bash
# Deploy React Router v7 SSR server to VPS
# This script deploys the frontend as a Node.js SSR server instead of static files

set -e

VPS_IP="173.212.208.181"
DEPLOY_DIR="/opt/blog-frontend-ssr"
SERVICE_NAME="blog-frontend"

echo "================================================"
echo "Deploiement Frontend SSR - blog.bh-systems.be"
echo "================================================"
echo ""

# 1. Create deployment directory on VPS
echo "[1/6] Creation du repertoire de deploiement..."
ssh root@$VPS_IP "mkdir -p $DEPLOY_DIR"
echo "✓ OK"

# 2. Transfer build files
echo ""
echo "[2/6] Transfert des fichiers de build..."
scp -r ../frontend/build/* root@$VPS_IP:$DEPLOY_DIR/
scp ../frontend/package*.json root@$VPS_IP:$DEPLOY_DIR/
echo "✓ OK"

# 3. Transfer public directory if exists
echo ""
echo "[3/6] Transfert des fichiers publics..."
if [ -d "../frontend/public" ]; then
    scp -r ../frontend/public root@$VPS_IP:$DEPLOY_DIR/
    echo "✓ OK"
else
    echo "✓ Pas de dossier public"
fi

# 4. Install dependencies on VPS
echo ""
echo "[4/6] Installation des dependances..."
ssh root@$VPS_IP "cd $DEPLOY_DIR && npm ci --only=production"
echo "✓ OK"

# 5. Create systemd service
echo ""
echo "[5/6] Creation du service systemd..."
ssh root@$VPS_IP << 'EOF'
cat > /etc/systemd/system/blog-frontend.service << 'SERVICE'
[Unit]
Description=Blog Frontend SSR Server (React Router v7)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/blog-frontend-ssr
Environment=NODE_ENV=production
Environment=PORT=3002
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable blog-frontend
systemctl restart blog-frontend
EOF
echo "✓ OK"

# 6. Update Nginx configuration
echo ""
echo "[6/6] Mise a jour de la configuration Nginx..."
ssh root@$VPS_IP << 'EOF'
cat > /etc/nginx/sites-available/blog.bh-systems.be.conf << 'NGINX'
# Nginx configuration for blog.bh-systems.be
# HTTPS with Let's Encrypt SSL + SSR Frontend

server {
    listen 80;
    listen [::]:80;
    server_name blog.bh-systems.be;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name blog.bh-systems.be;
    
    ssl_certificate /etc/letsencrypt/live/blog.bh-systems.be/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/blog.bh-systems.be/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    client_max_body_size 50M;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
    
    # Frontend SSR (proxy to Node.js server on port 3002)
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # API Backend (Docker container on port 3001)
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    access_log /var/log/nginx/blog-access.log;
    error_log /var/log/nginx/blog-error.log;
}
NGINX

nginx -t && systemctl reload nginx
EOF
echo "✓ OK"

# Test
echo ""
echo "================================================"
echo "Verification du deploiement"
echo "================================================"
echo ""

sleep 3

echo "Status service frontend:"
ssh root@$VPS_IP "systemctl status blog-frontend --no-pager | head -10"

echo ""
echo "Test HTTPS:"
curl -I https://blog.bh-systems.be 2>/dev/null | head -5

echo ""
echo "================================================"
echo "✓ DEPLOIEMENT TERMINE !"
echo "================================================"
echo ""
echo "Site: https://blog.bh-systems.be"
echo ""
echo "Commandes utiles:"
echo "  - Logs frontend: ssh root@$VPS_IP 'journalctl -u blog-frontend -f'"
echo "  - Restart: ssh root@$VPS_IP 'systemctl restart blog-frontend'"
echo "  - Status: ssh root@$VPS_IP 'systemctl status blog-frontend'"
echo ""
