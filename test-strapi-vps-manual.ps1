# Script pour tester une installation manuelle de Strapi sur le VPS
# Ce script va créer une installation Strapi HORS Docker pour diagnostiquer

Write-Host "🧪 TEST - Installation manuelle de Strapi sur VPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$VPS_IP = "173.212.208.181"
$VPS_USER = "root"

Write-Host "📋 Ce script va:" -ForegroundColor Yellow
Write-Host "  1. Se connecter au VPS" -ForegroundColor White
Write-Host "  2. Créer un dossier de test /root/strapi-test" -ForegroundColor White
Write-Host "  3. Installer Strapi v5 manuellement (sans Docker)" -ForegroundColor White
Write-Host "  4. Démarrer Strapi en mode develop" -ForegroundColor White
Write-Host "  5. Tester l'accès sur le port 1337" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Voulez-vous continuer? (o/n)"
if ($confirm -ne "o" -and $confirm -ne "O") {
    Write-Host "❌ Annulé" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔌 Connexion au VPS..." -ForegroundColor Green

# Créer le script de test à exécuter sur le VPS
$testScript = @"
#!/bin/bash
set -e

echo "📦 Étape 1: Vérification de Node.js"
node --version
npm --version

echo ""
echo "📁 Étape 2: Création du dossier de test"
cd /root
rm -rf strapi-test
mkdir -p strapi-test
cd strapi-test

echo ""
echo "🚀 Étape 3: Installation de Strapi v5 (cela peut prendre 2-3 minutes)"
npx create-strapi-app@latest test-blog \
  --quickstart \
  --no-run \
  --typescript \
  --skip-cloud

echo ""
echo "📝 Étape 4: Configuration pour SQLite"
cd test-blog

# Créer un fichier .env simple
cat > .env << 'ENVFILE'
HOST=0.0.0.0
PORT=1337
APP_KEYS=test-key-1,test-key-2,test-key-3,test-key-4
API_TOKEN_SALT=test-api-token-salt-min-32-chars-here
ADMIN_JWT_SECRET=test-admin-jwt-secret-min-32-chars
TRANSFER_TOKEN_SALT=test-transfer-token-salt-min-32-chars
JWT_SECRET=test-jwt-secret-min-32-chars-here
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=./data/data.db
ENVFILE

# Créer le dossier data
mkdir -p data

echo ""
echo "✅ Strapi installé avec succès!"
echo ""
echo "📊 Structure créée:"
ls -la

echo ""
echo "🎯 Pour démarrer Strapi manuellement:"
echo "   cd /root/strapi-test/test-blog"
echo "   npm run develop"
echo ""
echo "🌐 Puis accéder à: http://173.212.208.181:1337/admin"
"@

# Sauvegarder le script localement
$testScript | Out-File -FilePath ".\test-install-strapi.sh" -Encoding UTF8 -NoNewline

Write-Host "📤 Upload du script de test..." -ForegroundColor Green
scp -o StrictHostKeyChecking=no ".\test-install-strapi.sh" "${VPS_USER}@${VPS_IP}:/root/test-install-strapi.sh"

Write-Host "🔧 Exécution du script de test..." -ForegroundColor Green
ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_IP}" "chmod +x /root/test-install-strapi.sh && /root/test-install-strapi.sh"

Write-Host ""
Write-Host "✅ Installation de test terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PROCHAINES ÉTAPES:" -ForegroundColor Yellow
Write-Host "  1. Connectez-vous au VPS:" -ForegroundColor White
Write-Host "     ssh root@173.212.208.181" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Allez dans le dossier:" -ForegroundColor White
Write-Host "     cd /root/strapi-test/test-blog" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. Démarrez Strapi:" -ForegroundColor White
Write-Host "     npm run develop" -ForegroundColor Cyan
Write-Host ""
Write-Host "  4. Testez l'accès dans votre navigateur:" -ForegroundColor White
Write-Host "     http://173.212.208.181:1337/admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔍 Si ça fonctionne: Le problème vient du Docker/Dockerfile" -ForegroundColor Yellow
Write-Host "🔍 Si ça ne fonctionne pas: Le problème vient du VPS/Node.js/Strapi" -ForegroundColor Yellow
Write-Host ""

# Nettoyage
Remove-Item ".\test-install-strapi.sh" -ErrorAction SilentlyContinue
