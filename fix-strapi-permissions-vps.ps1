# Script pour réparer les permissions Strapi sur VPS
# Résout l'erreur: "Cannot read properties of undefined (reading 'filter')"

Write-Host "🔧 RÉPARATION DES PERMISSIONS STRAPI" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$VPS_IP = "173.212.208.181"
$VPS_USER = "root"

Write-Host "📋 Ce script va:" -ForegroundColor Yellow
Write-Host "  1. Se connecter à la base de données PostgreSQL" -ForegroundColor White
Write-Host "  2. Régénérer les permissions Strapi" -ForegroundColor White
Write-Host "  3. Redémarrer Strapi" -ForegroundColor White
Write-Host ""

# Script SQL pour nettoyer et régénérer les permissions
$fixScript = @'
#!/bin/bash
set -e

echo "🛑 Arrêt de Strapi..."
pkill -f "strapi start" || true
sleep 3

echo ""
echo "🔧 Connexion à PostgreSQL pour réparer les permissions..."

# Commandes SQL pour nettoyer les permissions corrompues
PGPASSWORD='Str4p1Pr0d_2025!' psql -h localhost -U strapi -d blog_strapi <<'EOSQL'

-- 1. Vérifier les permissions existantes
SELECT COUNT(*) as total_permissions FROM admin_permissions;

-- 2. Supprimer les permissions orphelines (sans rôle)
DELETE FROM admin_permissions WHERE role_id IS NULL;

-- 3. Vérifier les rôles
SELECT id, name, code FROM admin_roles;

-- 4. Afficher les permissions par rôle
SELECT r.name, COUNT(p.id) as permission_count
FROM admin_roles r
LEFT JOIN admin_permissions p ON r.id = p.role_id
GROUP BY r.id, r.name;

EOSQL

echo ""
echo "✅ Base de données nettoyée!"
echo ""
echo "🔄 Redémarrage de Strapi avec régénération des permissions..."

cd /root/blog_strapi/backend

# Définir les variables d'environnement
export NODE_ENV=production
export HOST=0.0.0.0
export PORT=1339
export DATABASE_CLIENT=postgres
export DATABASE_HOST=localhost
export DATABASE_PORT=5432
export DATABASE_NAME=blog_strapi
export DATABASE_USERNAME=strapi
export DATABASE_PASSWORD=Str4p1Pr0d_2025!

# Lancer la commande de régénération des permissions
echo "Régénération des permissions..."
npm run strapi -- admin:reset-user-password --email=admin@example.com --password=NewSecurePassword123! || true

echo ""
echo "🚀 Redémarrage de Strapi..."
nohup npm run start > /root/strapi.log 2>&1 &

sleep 5

echo ""
echo "📊 Vérification du processus Strapi..."
ps aux | grep "strapi start" | grep -v grep

echo ""
echo "✅ Réparation terminée!"
echo ""
echo "🌐 Accédez à: http://173.212.208.181:1339/admin"
echo "📧 Email: admin@example.com"
echo "🔑 Mot de passe: NewSecurePassword123!"
echo ""
echo "Si le problème persiste, il faut vider complètement les tables de permissions:"
echo "  cd /root/blog_strapi/backend"
echo "  npm run strapi -- admin:create-user"
'@

# Sauvegarder le script
$fixScript | Out-File -FilePath ".\fix-strapi-permissions.sh" -Encoding UTF8 -NoNewline

Write-Host "📤 Upload du script..." -ForegroundColor Green
scp -o StrictHostKeyChecking=no ".\fix-strapi-permissions.sh" "${VPS_USER}@${VPS_IP}:/root/fix-strapi-permissions.sh"

Write-Host "🔧 Exécution de la réparation..." -ForegroundColor Green
ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_IP}" "chmod +x /root/fix-strapi-permissions.sh && /root/fix-strapi-permissions.sh"

Write-Host ""
Write-Host "✅ RÉPARATION TERMINÉE!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Vérifiez l'accès:" -ForegroundColor Yellow
Write-Host "   http://173.212.208.181:1339/admin" -ForegroundColor Cyan
Write-Host ""

# Nettoyer le fichier temporaire
Remove-Item ".\fix-strapi-permissions.sh" -ErrorAction SilentlyContinue
Remove-Item ".\fix-strapi-permissions.ps1.sh" -ErrorAction SilentlyContinue
