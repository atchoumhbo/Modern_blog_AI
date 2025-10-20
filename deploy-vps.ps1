# Script de dploiement automatique sur VPS
# Usage: .\deploy-vps.ps1

$VPS_IP = "173.212.208.181"
$VPS_USER = "root"
$PROJECT_PATH = "/root/blog_strapi"  # Chemin sur le VPS

Write-Host " Dploiement sur VPS $VPS_IP" -ForegroundColor Cyan
Write-Host ""

# Vrifier la connexion SSH
Write-Host " Test de connexion SSH..." -ForegroundColor Yellow
ssh -o ConnectTimeout=5 $VPS_USER@$VPS_IP "echo 'Connexion OK'" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host " Impossible de se connecter au VPS" -ForegroundColor Red
    Write-Host "Vrifiez que vous pouvez faire: ssh $VPS_USER@$VPS_IP" -ForegroundColor Yellow
    exit 1
}
Write-Host " Connexion SSH OK" -ForegroundColor Green
Write-Host ""

# Commandes  excuter sur le VPS
$commands = @"
echo ' Navigation vers le projet...'
cd $PROJECT_PATH || { echo ' Dossier projet introuvable'; exit 1; }

echo ' Git pull...'
git pull origin master || { echo ' Git pull chou'; exit 1; }

echo ' Configuration .env production...'
cp frontend/.env.production frontend/.env || { echo ' Copie .env choue'; exit 1; }

echo ' Arrt des containers...'
docker-compose down

echo '  Build et dmarrage des containers...'
docker-compose up -d --build

echo ''
echo ' Dploiement termin!'
echo ''
echo ' tat des containers:'
docker-compose ps

echo ''
echo ' Votre site devrait tre accessible sur:'
echo '   https://blog.thedevelopers.fr'
echo '   (ou http://$VPS_IP si domaine non configur)'
"@

Write-Host " Excution des commandes sur le VPS..." -ForegroundColor Yellow
Write-Host ""

# Excuter les commandes via SSH
ssh -t $VPS_USER@$VPS_IP $commands

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host " Dploiement russi!" -ForegroundColor Green
    Write-Host ""
    Write-Host " Prochaines tapes:" -ForegroundColor Cyan
    Write-Host "  1. Vrifier les logs: ssh $VPS_USER@$VPS_IP 'cd $PROJECT_PATH && docker-compose logs -f'" -ForegroundColor White
    Write-Host "  2. Tester le site: http://$VPS_IP" -ForegroundColor White
    Write-Host "  3. Configurer nginx/SSL si ncessaire" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host " Erreur pendant le dploiement" -ForegroundColor Red
    Write-Host "Vrifiez les logs avec: ssh $VPS_USER@$VPS_IP 'cd $PROJECT_PATH && docker-compose logs'" -ForegroundColor Yellow
}
