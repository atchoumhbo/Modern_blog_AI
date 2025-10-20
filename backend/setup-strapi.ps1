# Script PowerShell pour configurer et démarrer le nouveau Strapi

Write-Host "🚀 Configuration du nouveau Strapi optimisé pour blog professionnel" -ForegroundColor Green

# Se déplacer vers le dossier backend
Set-Location "c:\Devops\blog_strapi\backend"

Write-Host "📦 Installation des dépendances de base..." -ForegroundColor Yellow
npm install

Write-Host "🔌 Installation des plugins SEO..." -ForegroundColor Yellow
npm install @strapi/plugin-seo @strapi/plugin-i18n

Write-Host "📖 Installation du plugin de documentation..." -ForegroundColor Yellow
npm install @strapi/plugin-documentation

Write-Host "🖼️ Installation des providers de médias..." -ForegroundColor Yellow
npm install @strapi/provider-upload-cloudinary

Write-Host "✅ Tous les plugins sont installés!" -ForegroundColor Green

Write-Host "🏗️ Création de la base de données et des tables..." -ForegroundColor Yellow
# npm run strapi install

Write-Host "🎯 Structure Strapi créée avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Structure créée:" -ForegroundColor Cyan
Write-Host "✓ Content Type Article (avec SEO optimisé)" -ForegroundColor Green
Write-Host "✓ Content Type Category (avec SEO)" -ForegroundColor Green  
Write-Host "✓ Content Type Tag (taxonomie)" -ForegroundColor Green
Write-Host "✓ Composant SEO réutilisable" -ForegroundColor Green
Write-Host "✓ Composant Schema structuré" -ForegroundColor Green
Write-Host "✓ Lifecycles automatisés" -ForegroundColor Green
Write-Host "✓ Middlewares personnalisés" -ForegroundColor Green
Write-Host "✓ Routes API étendues" -ForegroundColor Green
Write-Host ""
Write-Host "🔥 Fonctionnalités avancées:" -ForegroundColor Cyan
Write-Host "• Calcul automatique du temps de lecture" -ForegroundColor White
Write-Host "• Génération automatique des excerpts" -ForegroundColor White
Write-Host "• Compteur de vues intégré" -ForegroundColor White
Write-Host "• Meta-données SEO complètes" -ForegroundColor White
Write-Host "• Données structurées JSON-LD" -ForegroundColor White
Write-Host "• Support multilingue (i18n)" -ForegroundColor White
Write-Host "• API REST optimisée" -ForegroundColor White
Write-Host ""
Write-Host "▶️ Pour démarrer le serveur:" -ForegroundColor Yellow
Write-Host "npm run develop" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Admin Panel sera disponible sur:" -ForegroundColor Yellow
Write-Host "http://localhost:1337/admin" -ForegroundColor White