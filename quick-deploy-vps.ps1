# Script de déploiement rapide VPS
$VPS_IP = "173.212.208.181"
$VPS_USER = "root"
$PROJECT_PATH = "/root/blog_strapi"

Write-Host "=== Deploiement rapide VPS ===" -ForegroundColor Cyan
Write-Host ""

# Commande SSH unique
$sshCommand = @"
cd $PROJECT_PATH && 
git pull origin master && 
docker compose down && 
docker compose up -d && 
echo '---' && 
docker compose ps
"@

Write-Host "Connexion au VPS et deploiement..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} $sshCommand

Write-Host ""
Write-Host "=== Deploiement termine ===" -ForegroundColor Green
Write-Host ""
Write-Host "URLs disponibles:" -ForegroundColor Cyan
Write-Host "- Admin Strapi (temp): http://${VPS_IP}:1337/admin" -ForegroundColor Yellow
Write-Host "- Site public: https://blog.bh-systems.be/" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Red
Write-Host "1. Configurer les permissions Strapi (voir DEPLOY-FINAL.md)" -ForegroundColor Yellow
Write-Host "2. Settings -> Users & Permissions -> Roles -> Public" -ForegroundColor Yellow
Write-Host "3. Cocher 'find' et 'findOne' pour Article, Project, Category, Tag" -ForegroundColor Yellow
Write-Host "4. Cliquer 'Save'" -ForegroundColor Yellow

