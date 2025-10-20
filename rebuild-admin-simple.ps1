# Script pour reconstruire l'admin Strapi sur VPS - SANS EMOJIS
# Resout l'erreur: "Cannot read properties of undefined (reading 'filter')"

Write-Host "====================================" -ForegroundColor Cyan
Write-Host " RECONSTRUCTION ADMIN STRAPI" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

$VPS_IP = "173.212.208.181"
$VPS_USER = "root"

Write-Host "Ce script va:" -ForegroundColor Yellow
Write-Host "  1. Arreter Strapi" -ForegroundColor White
Write-Host "  2. Reconstruire l'interface admin" -ForegroundColor White
Write-Host "  3. Redemarrer Strapi" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Continuer? (o/n)"
if ($confirm -ne "o" -and $confirm -ne "O") {
    Write-Host "Annule" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Upload du script..." -ForegroundColor Green

$rebuildScript = @'
#!/bin/bash
set -e

echo "Arret de Strapi..."
pkill -f "strapi start" || true
sleep 3

cd /root/blog_strapi/backend

echo ""
echo "Nettoyage de l'ancien build admin..."
rm -rf .cache
rm -rf build
rm -rf dist
rm -rf public/uploads/.cache

echo ""
echo "Installation/Mise a jour des dependances..."
npm install

echo ""
echo "Reconstruction de l'interface admin..."
NODE_ENV=production npm run build

echo ""
echo "Redemarrage de Strapi..."

# Variables d'environnement
export NODE_ENV=production
export HOST=0.0.0.0
export PORT=1339

# Demarrage en arriere-plan
nohup npm run start > /root/strapi.log 2>&1 &

sleep 8

echo ""
echo "Verification..."
ps aux | grep "strapi start" | grep -v grep

echo ""
echo "Reconstruction terminee!"
echo ""
echo "Accedez a: http://173.212.208.181:1339/admin"
echo ""
echo "Si vous devez creer un nouvel utilisateur admin:"
echo "   cd /root/blog_strapi/backend"
echo "   npm run strapi -- admin:create-user --firstname=Admin --lastname=User --email=admin@example.com --password=SecurePassword123!"
'@

# Sauvegarder le script avec encodage Unix (LF)
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllLines(".\rebuild-admin.sh", $rebuildScript.Split("`n"), $utf8NoBom)

Write-Host "Upload vers le VPS..." -ForegroundColor Green
scp -o StrictHostKeyChecking=no ".\rebuild-admin.sh" "${VPS_USER}@${VPS_IP}:/root/rebuild-admin.sh"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de l'upload" -ForegroundColor Red
    Remove-Item ".\rebuild-admin.sh" -ErrorAction SilentlyContinue
    exit 1
}

Write-Host ""
Write-Host "Execution de la reconstruction (2-3 minutes)..." -ForegroundColor Green
Write-Host ""

ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_IP}" "chmod +x /root/rebuild-admin.sh && /root/rebuild-admin.sh"

Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host " RECONSTRUCTION TERMINEE!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Testez l'acces a:" -ForegroundColor Yellow
Write-Host "  http://173.212.208.181:1339/admin" -ForegroundColor Cyan
Write-Host "  https://blog.bh-systems.be/admin" -ForegroundColor Cyan
Write-Host ""

# Nettoyer
Remove-Item ".\rebuild-admin.sh" -ErrorAction SilentlyContinue
