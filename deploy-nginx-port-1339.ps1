# Script pour déployer la configuration Nginx corrigée pour port 1339
# Configure Nginx pour pointer vers Strapi local sur port 1339

Write-Host "🔧 DÉPLOIEMENT NGINX POUR PORT 1339" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$VPS_IP = "173.212.208.181"
$VPS_USER = "root"

Write-Host "📋 Ce script va:" -ForegroundColor Yellow
Write-Host "  1. Copier la configuration Nginx corrigée" -ForegroundColor White
Write-Host "  2. Redémarrer le container Nginx" -ForegroundColor White
Write-Host "  3. Vérifier que tout fonctionne" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Voulez-vous continuer? (o/n)"
if ($confirm -ne "o" -and $confirm -ne "O") {
    Write-Host "❌ Annulé" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📤 Upload de la configuration Nginx..." -ForegroundColor Green
scp -o StrictHostKeyChecking=no ".\nginx\nginx.vps-hybrid.conf" "${VPS_USER}@${VPS_IP}:/root/blog_strapi/nginx/nginx.conf"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de l'upload" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔄 Redémarrage du container Nginx..." -ForegroundColor Green

$deployScript = @'
#!/bin/bash
set -e

cd /root/blog_strapi

echo "🛑 Arrêt du container Nginx..."
docker-compose stop nginx || true

echo ""
echo "🗑️  Suppression du container Nginx..."
docker-compose rm -f nginx || true

echo ""
echo "🚀 Redémarrage de Nginx avec la nouvelle config..."
docker-compose up -d nginx

sleep 5

echo ""
echo "📊 Statut des containers:"
docker-compose ps

echo ""
echo "📝 Logs Nginx (dernières 20 lignes):"
docker-compose logs --tail=20 nginx

echo ""
echo "✅ Configuration déployée!"
'@

# Sauvegarder et exécuter
$deployScript | Out-File -FilePath ".\deploy-nginx.sh" -Encoding UTF8 -NoNewline
scp -o StrictHostKeyChecking=no ".\deploy-nginx.sh" "${VPS_USER}@${VPS_IP}:/root/deploy-nginx.sh"
ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_IP}" "chmod +x /root/deploy-nginx.sh && /root/deploy-nginx.sh"

Write-Host ""
Write-Host "✅ DÉPLOIEMENT TERMINÉ!" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 Testez maintenant:" -ForegroundColor Yellow
Write-Host "  • Admin: https://blog.bh-systems.be/admin" -ForegroundColor Cyan
Write-Host "  • API:   https://blog.bh-systems.be/api" -ForegroundColor Cyan
Write-Host "  • Site:  https://blog.bh-systems.be" -ForegroundColor Cyan
Write-Host ""

# Nettoyer
Remove-Item ".\deploy-nginx.sh" -ErrorAction SilentlyContinue
