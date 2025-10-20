# Deploy React Router v7 SSR server to VPS
# Deploie le frontend comme serveur Node.js SSR au lieu de fichiers statiques

$VPS_IP = "173.212.208.181"
$DEPLOY_DIR = "/opt/blog-frontend-ssr"

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "Deploiement Frontend SSR - blog.bh-systems.be" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# 1. Build frontend
Write-Host "[1/7] Build du frontend..." -NoNewline
Set-Location frontend
npm run build 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ERREUR" -ForegroundColor Red
    exit 1
}
Set-Location ..

# 2. Create deployment directory
Write-Host "[2/7] Creation repertoire sur VPS..." -NoNewline
ssh root@${VPS_IP} "mkdir -p $DEPLOY_DIR"
Write-Host " OK" -ForegroundColor Green

# 3. Transfer build files
Write-Host "[3/7] Transfert fichiers build..." -NoNewline
scp -r -q frontend/build/* root@${VPS_IP}:${DEPLOY_DIR}/
scp -q frontend/package*.json root@${VPS_IP}:${DEPLOY_DIR}/
Write-Host " OK" -ForegroundColor Green

# 4. Transfer public directory if exists
Write-Host "[4/7] Transfert fichiers publics..." -NoNewline
if (Test-Path "frontend/public") {
    scp -r -q frontend/public root@${VPS_IP}:${DEPLOY_DIR}/
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " Pas de dossier public" -ForegroundColor Gray
}

# 5. Install dependencies
Write-Host "[5/7] Installation dependances..." -NoNewline
ssh root@${VPS_IP} "cd $DEPLOY_DIR && npm ci --only=production > /dev/null 2>&1"
Write-Host " OK" -ForegroundColor Green

# 6. Create systemd service
Write-Host "[6/7] Creation service systemd..." -NoNewline
$systemdService = @'
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
'@

ssh root@${VPS_IP} @"
cat > /etc/systemd/system/blog-frontend.service << 'EOF'
$systemdService
EOF
systemctl daemon-reload
systemctl enable blog-frontend > /dev/null 2>&1
systemctl restart blog-frontend
"@
Write-Host " OK" -ForegroundColor Green

# 7. Update Nginx configuration
Write-Host "[7/7] Mise a jour Nginx..." -NoNewline
$nginxConfig = @'
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
'@

ssh root@${VPS_IP} @"
cat > /etc/nginx/sites-available/blog.bh-systems.be.conf << 'EOF'
$nginxConfig
EOF
nginx -t && systemctl reload nginx
"@
Write-Host " OK" -ForegroundColor Green

# Wait for service to start
Write-Host "`nAttente demarrage service..." -NoNewline
Start-Sleep -Seconds 5
Write-Host " OK" -ForegroundColor Green

# Test
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "Verification du deploiement" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

Write-Host "Status service frontend:" -ForegroundColor Yellow
ssh root@${VPS_IP} "systemctl status blog-frontend --no-pager | head -10"

Write-Host "`nTest HTTPS:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://blog.bh-systems.be" -Method Head -ErrorAction Stop
    Write-Host "OK: Status $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "ERREUR: $_" -ForegroundColor Red
}

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "DEPLOIEMENT TERMINE !" -ForegroundColor Green  
Write-Host "================================================`n" -ForegroundColor Green

Write-Host "Site: https://blog.bh-systems.be" -ForegroundColor Cyan
Write-Host "`nCommandes utiles:" -ForegroundColor Yellow
Write-Host "  - Logs:    ssh root@$VPS_IP 'journalctl -u blog-frontend -f'" -ForegroundColor Gray
Write-Host "  - Restart: ssh root@$VPS_IP 'systemctl restart blog-frontend'" -ForegroundColor Gray
Write-Host "  - Status:  ssh root@$VPS_IP 'systemctl status blog-frontend'" -ForegroundColor Gray
Write-Host ""

# Open browser
Start-Process "https://blog.bh-systems.be"
