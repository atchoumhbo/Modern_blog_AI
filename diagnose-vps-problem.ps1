# Script de diagnostic complet pour comprendre le problème VPS
# Ce script va collecter toutes les informations nécessaires

Write-Host "🔍 DIAGNOSTIC COMPLET DU VPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$VPS_IP = "173.212.208.181"
$VPS_USER = "root"

Write-Host "📊 Collecte des informations..." -ForegroundColor Green
Write-Host ""

# Script de diagnostic
$diagScript = @"
#!/bin/bash

echo "=========================================="
echo "🔍 DIAGNOSTIC VPS - Blog Strapi"
echo "=========================================="
echo ""

echo "1️⃣ SYSTÈME"
echo "----------"
echo "OS: \$(cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2)"
echo "Kernel: \$(uname -r)"
echo "RAM totale: \$(free -h | grep Mem | awk '{print \$2}')"
echo "RAM utilisée: \$(free -h | grep Mem | awk '{print \$3}')"
echo "Disque utilisé: \$(df -h / | tail -1 | awk '{print \$5}')"
echo ""

echo "2️⃣ NODE.JS & NPM"
echo "----------------"
if command -v node &> /dev/null; then
    echo "Node.js: \$(node --version)"
    echo "NPM: \$(npm --version)"
else
    echo "❌ Node.js NOT INSTALLED!"
fi
echo ""

echo "3️⃣ DOCKER"
echo "---------"
if command -v docker &> /dev/null; then
    echo "Docker: \$(docker --version)"
    echo "Docker Compose: \$(docker compose version)"
    echo ""
    echo "Conteneurs en cours:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "Images Docker:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
else
    echo "❌ Docker NOT INSTALLED!"
fi
echo ""

echo "4️⃣ PROCESSUS STRAPI"
echo "-------------------"
echo "Processus Node.js en cours:"
ps aux | grep node | grep -v grep || echo "Aucun processus Node.js trouvé"
echo ""

echo "5️⃣ PORTS OUVERTS"
echo "----------------"
echo "Ports en écoute (80, 443, 1337, 3000):"
netstat -tlnp 2>/dev/null | grep -E ':(80|443|1337|3000) ' || echo "Aucun port trouvé"
echo ""

echo "6️⃣ DOCKER COMPOSE ACTUEL"
echo "------------------------"
if [ -f /root/blog_strapi/docker-compose.yml ]; then
    echo "✅ docker-compose.yml existe"
    cd /root/blog_strapi
    docker compose ps 2>/dev/null || echo "Aucun conteneur en cours"
else
    echo "❌ docker-compose.yml NOT FOUND"
fi
echo ""

echo "7️⃣ LOGS DOCKER (Dernières 50 lignes)"
echo "-------------------------------------"
if [ -f /root/blog_strapi/docker-compose.yml ]; then
    cd /root/blog_strapi
    echo "--- STRAPI LOGS ---"
    docker compose logs --tail=50 strapi 2>/dev/null || echo "Pas de logs Strapi"
    echo ""
    echo "--- FRONTEND LOGS ---"
    docker compose logs --tail=30 frontend 2>/dev/null || echo "Pas de logs Frontend"
    echo ""
    echo "--- NGINX LOGS ---"
    docker compose logs --tail=30 nginx 2>/dev/null || echo "Pas de logs Nginx"
fi
echo ""

echo "8️⃣ FICHIERS BACKEND"
echo "-------------------"
if [ -d /root/blog_strapi/backend ]; then
    echo "Taille du dossier backend: \`du -sh /root/blog_strapi/backend | cut -f1\`"
    echo "node_modules existe: \`[ -d /root/blog_strapi/backend/node_modules ] && echo 'OUI' || echo 'NON'\`"
    echo "package.json existe: \`[ -f /root/blog_strapi/backend/package.json ] && echo 'OUI' || echo 'NON'\`"
    echo "dist existe: \`[ -d /root/blog_strapi/backend/dist ] && echo 'OUI' || echo 'NON'\`"
    echo ""
    echo "Versions dans package.json:"
    if [ -f /root/blog_strapi/backend/package.json ]; then
        cat /root/blog_strapi/backend/package.json | grep -A 5 '"dependencies"' | head -10
    fi
else
    echo "❌ Dossier backend NOT FOUND"
fi
echo ""

echo "9️⃣ CERTIFICATS SSL"
echo "------------------"
if [ -d /etc/letsencrypt/live/blog.bh-systems.be ]; then
    echo "✅ Certificats Let's Encrypt trouvés"
    echo "Fichiers:"
    ls -lh /etc/letsencrypt/live/blog.bh-systems.be/
    echo ""
    echo "Expiration:"
    openssl x509 -enddate -noout -in /etc/letsencrypt/live/blog.bh-systems.be/cert.pem 2>/dev/null || echo "Impossible de lire le certificat"
else
    echo "❌ Certificats SSL NOT FOUND"
fi
echo ""

echo "🔟 TEST CONNECTIVITÉ"
echo "-------------------"
echo "Test localhost:1337 (Strapi):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:1337/_health 2>/dev/null || echo "❌ Strapi non accessible"

echo "Test localhost:3000 (Frontend):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000 2>/dev/null || echo "❌ Frontend non accessible"

echo "Test externe HTTPS:"
curl -s -o /dev/null -w "Status: %{http_code}\n" https://blog.bh-systems.be 2>/dev/null || echo "❌ Site non accessible"
echo ""

echo "=========================================="
echo "✅ Diagnostic terminé!"
echo "=========================================="
"@

Write-Host "📤 Exécution du diagnostic sur le VPS..." -ForegroundColor Green
Write-Host ""

# Exécuter directement le diagnostic
$output = ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_IP}" "$diagScript"
Write-Host $output

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📋 RÉSUMÉ DU DIAGNOSTIC" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Analyser les résultats
if ($output -match "Docker:.*version") {
    Write-Host "✅ Docker est installé" -ForegroundColor Green
} else {
    Write-Host "❌ Docker n'est PAS installé" -ForegroundColor Red
}

if ($output -match "Node.js:.*v\d+") {
    Write-Host "✅ Node.js est installé" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js n'est PAS installé" -ForegroundColor Red
}

if ($output -match "blog-strapi.*Up") {
    Write-Host "✅ Conteneur Strapi est en cours" -ForegroundColor Green
} else {
    Write-Host "⚠️ Conteneur Strapi n'est PAS en cours" -ForegroundColor Yellow
}

if ($output -match "blog-frontend.*Up") {
    Write-Host "✅ Conteneur Frontend est en cours" -ForegroundColor Green
} else {
    Write-Host "⚠️ Conteneur Frontend n'est PAS en cours" -ForegroundColor Yellow
}

if ($output -match "blog-nginx.*Up") {
    Write-Host "✅ Conteneur Nginx est en cours" -ForegroundColor Green
} else {
    Write-Host "⚠️ Conteneur Nginx n'est PAS en cours" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 RECOMMANDATIONS:" -ForegroundColor Yellow
Write-Host ""

if ($output -match "Error|error|ERROR|failed|Failed|FAILED") {
    Write-Host "❌ Des erreurs ont été détectées dans les logs!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solutions recommandées:" -ForegroundColor Yellow
    Write-Host "  1. TEST SIMPLE:    .\test-strapi-vps-manual.ps1" -ForegroundColor Cyan
    Write-Host "     → Teste Strapi sans Docker pour isoler le problème" -ForegroundColor White
    Write-Host ""
    Write-Host "  2. SOLUTION HYBRIDE: .\deploy-hybrid-solution.ps1" -ForegroundColor Cyan
    Write-Host "     → Strapi manuel + Frontend Docker" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "✅ Pas d'erreur critique détectée" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vérifiez manuellement:" -ForegroundColor Yellow
    Write-Host "  - Logs Strapi: ssh root@173.212.208.181 'docker compose logs strapi'" -ForegroundColor Cyan
    Write-Host "  - Accès admin: https://blog.bh-systems.be/admin" -ForegroundColor Cyan
}

Write-Host ""
