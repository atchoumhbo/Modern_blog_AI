# Script pour réinitialiser la base de données Strapi sur le VPS
$VPS_IP = "173.212.208.181"
$VPS_USER = "root"

Write-Host ""
Write-Host "=== REINITIALISATION BASE DE DONNEES STRAPI ===" -ForegroundColor Red
Write-Host ""
Write-Host "ATTENTION: Cela va SUPPRIMER toutes les donnees Strapi !" -ForegroundColor Yellow
Write-Host ""
$confirmation = Read-Host "Tapez 'OUI' pour confirmer"

if ($confirmation -ne "OUI") {
    Write-Host "Operation annulee." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Connexion au VPS et reinitialisation..." -ForegroundColor Yellow

$sshCommand = @"
cd /root/blog_strapi && 
echo '>>> Arret des containers...' && 
docker compose down && 
echo '>>> Suppression du volume strapi_data...' && 
docker volume rm blog_strapi_strapi_data && 
echo '>>> Redemarrage des containers...' && 
docker compose up -d && 
echo '>>> Attente de 15 secondes pour le demarrage...' && 
sleep 15 && 
echo '>>> Etat des containers:' && 
docker compose ps
"@

ssh ${VPS_USER}@${VPS_IP} $sshCommand

Write-Host ""
Write-Host "=== REINITIALISATION TERMINEE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Vous pouvez maintenant creer le super admin:" -ForegroundColor Cyan
Write-Host "  http://${VPS_IP}:1337/admin" -ForegroundColor Yellow
Write-Host ""
