# Script de diagnostic VPS simplifie
Write-Host '[DIAGNOSTIC] VPS - Blog Strapi' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''

$VPS_IP = '173.212.208.181'
$VPS_USER = 'root'

Write-Host '[INFO] Connexion au VPS et collecte des informations...' -ForegroundColor Green
Write-Host ''

# Executer le diagnostic directement via SSH
$output = ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_IP}" @"
echo '=========================================='
echo '[DIAGNOSTIC] VPS - Blog Strapi'
echo '=========================================='
echo ''
echo '[1] SYSTEME'
echo '----------'
cat /etc/os-release | grep PRETTY_NAME
uname -r
free -h | grep Mem
df -h / | tail -1
echo ''
echo '[2] NODE.JS & NPM'
echo '----------------'
node --version 2>/dev/null && npm --version 2>/dev/null || echo 'Node.js NOT INSTALLED'
echo ''
echo '[3] DOCKER'
echo '---------'
docker --version 2>/dev/null || echo 'Docker NOT INSTALLED'
docker compose version 2>/dev/null || echo 'Docker Compose NOT INSTALLED'
echo ''
echo 'Conteneurs en cours:'
docker ps 2>/dev/null || echo 'Aucun conteneur'
echo ''
echo '[4] DOCKER COMPOSE BLOG'
echo '----------------------'
cd /root/blog_strapi 2>/dev/null && docker compose ps 2>/dev/null || echo 'Projet non trouve'
echo ''
echo '[5] PORTS OUVERTS'
echo '----------------'
netstat -tlnp 2>/dev/null | grep -E ':(80|443|1337|3000) ' || echo 'Aucun port'
echo ''
echo '[6] LOGS STRAPI (Dernieres 20 lignes)'
echo '------------------------------------'
cd /root/blog_strapi 2>/dev/null && docker compose logs --tail=20 strapi 2>/dev/null || echo 'Pas de logs'
echo ''
echo '[7] TEST CONNECTIVITE'
echo '--------------------'
curl -s -o /dev/null -w 'Strapi localhost:1337 -> Status: %{http_code}\n' http://localhost:1337/_health 2>/dev/null || echo 'Strapi non accessible'
curl -s -o /dev/null -w 'Site HTTPS -> Status: %{http_code}\n' https://blog.bh-systems.be 2>/dev/null || echo 'Site non accessible'
echo ''
echo '=========================================='
echo '[OK] Diagnostic termine!'
echo '=========================================='
"@

Write-Host $output
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[ANALYSIS]" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Analyser les resultats
if ($output -match "Node.js NOT INSTALLED") {
    Write-Host "[ERROR] Node.js n'est PAS installe sur le VPS" -ForegroundColor Red
} elseif ($output -match "v\d+\.\d+\.\d+") {
    Write-Host "[OK] Node.js est installe" -ForegroundColor Green
}

if ($output -match "Docker NOT INSTALLED") {
    Write-Host "[ERROR] Docker n'est PAS installe sur le VPS" -ForegroundColor Red
} elseif ($output -match "Docker version") {
    Write-Host "[OK] Docker est installe" -ForegroundColor Green
}

if ($output -match "blog-strapi.*Up") {
    Write-Host "[OK] Conteneur Strapi fonctionne" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Conteneur Strapi ne fonctionne PAS" -ForegroundColor Yellow
}

if ($output -match "Strapi localhost:1337 -> Status: 200") {
    Write-Host "[OK] Strapi repond sur localhost:1337" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Strapi ne repond PAS sur localhost:1337" -ForegroundColor Yellow
}

if ($output -match "Site HTTPS -> Status: 200") {
    Write-Host "[OK] Site accessible via HTTPS" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Site NON accessible via HTTPS" -ForegroundColor Yellow
}

Write-Host ''
Write-Host '[NEXT STEPS]:' -ForegroundColor Yellow
Write-Host ''

if ($output -match 'Strapi ne fonctionne PAS' -or $output -match 'non accessible') {
    Write-Host 'Probleme detecte! Solutions:' -ForegroundColor Red
    Write-Host '  1. Test simple:          .\test-strapi-vps-manual.ps1' -ForegroundColor Cyan
    Write-Host '  2. Solution hybride:     .\deploy-hybrid-solution.ps1' -ForegroundColor Cyan
} else {
    Write-Host 'Tout semble fonctionner! Verifiez manuellement:' -ForegroundColor Green
    Write-Host '  Site: https://blog.bh-systems.be/admin' -ForegroundColor Cyan
}

Write-Host ''
