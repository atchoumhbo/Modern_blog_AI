# Script pour mettre à jour tous les fichiers avec le port 1339
# Commit des changements pour utiliser le port correct

Write-Host "🔧 MISE À JOUR DU PORT 1337 -> 1339" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Fichiers à mettre à jour:" -ForegroundColor Yellow
Write-Host "  ✓ .env (déjà fait)" -ForegroundColor Green
Write-Host "  - .env.production" -ForegroundColor White
Write-Host "  - docker-compose.yml" -ForegroundColor White
Write-Host "  - docker-compose.production.yml" -ForegroundColor White
Write-Host "  - nginx/nginx.conf" -ForegroundColor White
Write-Host ""

# Vérifier si on est dans un repo git
if (-not (Test-Path ".git")) {
    Write-Host "❌ Erreur: Ce n'est pas un dépôt Git" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Vérification des modifications en cours..." -ForegroundColor Green
git status --short

Write-Host ""
Write-Host "📝 Ajout des fichiers modifiés..." -ForegroundColor Green
git add .env

Write-Host ""
Write-Host "💾 Création du commit..." -ForegroundColor Green
git commit -m "fix: Mise à jour du port Strapi de 1337 à 1339

- Modification du PORT dans .env (1337 -> 1339)
- Correction pour correspondre à la configuration VPS actuelle
- Strapi tourne actuellement sur le port 1339

Résout le problème de connexion entre frontend et backend.
"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Commit créé avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Dernier commit:" -ForegroundColor Yellow
    git log -1 --oneline
    Write-Host ""
    Write-Host "📤 Pour pousser vers GitHub:" -ForegroundColor Yellow
    Write-Host "   git push origin master" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors du commit" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Notes importantes:" -ForegroundColor Yellow
Write-Host "  • Le port 1339 est maintenant configuré dans .env" -ForegroundColor White
Write-Host "  • Nginx doit proxyfier vers localhost:1339" -ForegroundColor White
Write-Host "  • Frontend doit utiliser VITE_STRAPI_URL avec port 1339" -ForegroundColor White
Write-Host ""
