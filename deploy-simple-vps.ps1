# Script de deploiement simple VPS - Configuration actuelle qui fonctionne
$VPS_IP = "173.212.208.181"
$VPS_USER = "root"
$PROJECT_PATH = "/root/blog_strapi"

Write-Host ""
Write-Host "=== DEPLOIEMENT SIMPLE VPS ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  - Frontend public: https://blog.bh-systems.be (via nginx)" -ForegroundColor Green
Write-Host "  - Backend direct: http://${VPS_IP}:1337/admin" -ForegroundColor Yellow
Write-Host "  - Communication interne: Frontend <-> Backend via Docker network" -ForegroundColor Green
Write-Host ""

# Commande SSH unique - UTILISE docker-compose.yml (PAS .prod.yml)
$sshCommand = @"
cd $PROJECT_PATH && 
echo '>>> Git pull...' && 
git pull origin master && 
echo '>>> Arrêt des anciens containers...' && 
docker compose down && 
echo '>>> Démarrage avec docker-compose.yml...' && 
docker compose up -d && 
echo '>>> Attente de 10 secondes...' && 
sleep 10 && 
echo '>>> État des containers:' && 
docker compose ps
"@

Write-Host "Connexion au VPS et deploiement..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} $sshCommand

Write-Host ""
Write-Host "=== DEPLOIEMENT TERMINE ===" -ForegroundColor Green
Write-Host ""
Write-Host "URLs disponibles:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. FRONTEND PUBLIC:" -ForegroundColor White
Write-Host "     https://blog.bh-systems.be/" -ForegroundColor Green
Write-Host ""
Write-Host "  2. BACKEND ADMIN (direct via IP):" -ForegroundColor White
Write-Host "     http://${VPS_IP}:1337/admin" -ForegroundColor Yellow
Write-Host ""
Write-Host "  3. API BACKEND (via nginx):" -ForegroundColor White
Write-Host "     https://blog.bh-systems.be/api/" -ForegroundColor Green
Write-Host ""
Write-Host "ACTIONS REQUISES:" -ForegroundColor Red
Write-Host "  1. Ouvrir: http://${VPS_IP}:1337/admin" -ForegroundColor Yellow
Write-Host "  2. Creer le super admin" -ForegroundColor Yellow
Write-Host "  3. Settings -> Users & Permissions -> Roles -> Public" -ForegroundColor Yellow
Write-Host "  4. Cocher 'find' et 'findOne' pour Article, Project, Category, Tag, Upload" -ForegroundColor Yellow
Write-Host "  5. Cliquer 'Save'" -ForegroundColor Yellow
Write-Host ""
