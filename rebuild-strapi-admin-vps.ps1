# Script pour reconstruire l'admin Strapi sur VPS
# Resout l'erreur: "Cannot read properties of undefined (reading 'filter')"

Write-Host "RECONSTRUCTION ADMIN STRAPI" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$VPS_IP = "173.212.208.181"
$VPS_USER = "root"

Write-Host "Ce script va:" -ForegroundColor Yellow
Write-Host "  1. Arreter Strapi" -ForegroundColor White
Write-Host "  2. Reconstruire l'interface admin" -ForegroundColor White
Write-Host "  3. Redemarrer Strapi" -ForegroundColor White
Write-Host ""

$rebuildScript = @'
#!/bin/bash
set -e

echo "🛑 Arrêt de Strapi..."
pkill -f "strapi start" || true
sleep 3

cd /root/blog_strapi/backend

echo ""
echo "🧹 Nettoyage de l'ancien build admin..."
rm -rf .cache
rm -rf build
rm -rf dist
rm -rf public/uploads/.cache

echo ""
echo "📦 Installation/Mise à jour des dépendances..."
npm install

echo ""
echo "🔨 Reconstruction de l'interface admin..."
NODE_ENV=production npm run build

echo ""
echo "🚀 Redémarrage de Strapi..."

# Variables d'environnement
export NODE_ENV=production
export HOST=0.0.0.0
export PORT=1339

# Démarrage en arrière-plan
nohup npm run start > /root/strapi.log 2>&1 &

sleep 8

echo ""
echo "📊 Vérification..."
ps aux | grep "strapi start" | grep -v grep

echo ""
echo "✅ Reconstruction terminée!"
echo ""
echo "🌐 Accédez à: http://173.212.208.181:1339/admin"
echo ""
echo "📝 Si vous devez créer un nouvel utilisateur admin:"
echo "   cd /root/blog_strapi/backend"
echo "   npm run strapi -- admin:create-user --firstname=Admin --lastname=User --email=admin@example.com --password=SecurePassword123!"
'@

# Sauvegarder le script
$rebuildScript | Out-File -FilePath ".\rebuild-admin.sh" -Encoding UTF8 -NoNewline

Write-Host "📤 Upload du script..." -ForegroundColor Green
scp -o StrictHostKeyChecking=no ".\rebuild-admin.sh" "${VPS_USER}@${VPS_IP}:/root/rebuild-admin.sh"

Write-Host "🔧 Exécution de la reconstruction (cela peut prendre 2-3 minutes)..." -ForegroundColor Green
Write-Host ""

ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_IP}" "chmod +x /root/rebuild-admin.sh && /root/rebuild-admin.sh"

Write-Host ""
Write-Host "✅ RECONSTRUCTION TERMINÉE!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Testez l'accès à: http://173.212.208.181:1339/admin" -ForegroundColor Cyan
Write-Host ""

# Nettoyer
Remove-Item ".\rebuild-admin.sh" -ErrorAction SilentlyContinue
