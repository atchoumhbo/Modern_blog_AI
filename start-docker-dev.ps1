# Script PowerShell pour lancer l'environnement Docker de développement

Write-Host "🚀 Démarrage de l'environnement Docker de développement..." -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Vérifier que Docker fonctionne
try {
    docker --version | Out-Null
    Write-Host "✅ Docker est disponible" -ForegroundColor Green
}
catch {
    Write-Host "❌ Docker n'est pas disponible!" -ForegroundColor Red
    exit 1
}

# Lancer les containers
Write-Host "🏗️  Construction et démarrage des containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml up -d --build

# Attendre un peu
Write-Host "⏳ Attente du démarrage des services..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Vérifier le statut
Write-Host "📊 Statut des containers:" -ForegroundColor Cyan
docker-compose -f docker-compose.dev.yml ps

# Test de santé
Write-Host "🏥 Tests de santé:" -ForegroundColor Cyan
try {
    $strapiHealth = Invoke-WebRequest -Uri "http://localhost:1339/_health" -UseBasicParsing -TimeoutSec 5
    if ($strapiHealth.StatusCode -eq 204) {
        Write-Host "✅ Strapi est accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Strapi pas encore prêt" -ForegroundColor Yellow
}

try {
    $frontendHealth = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 5
    if ($frontendHealth.StatusCode -eq 200) {
        Write-Host "✅ Frontend est accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Frontend pas encore prêt" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Environnement Docker lancé!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host "🌐 URLs d'accès:" -ForegroundColor Cyan
Write-Host "   Frontend:    http://localhost:5173" -ForegroundColor White
Write-Host "   Admin:       http://localhost:1339/admin" -ForegroundColor White
Write-Host "   API:         http://localhost:1339/api" -ForegroundColor White
Write-Host ""
Write-Host "📝 Commandes utiles:" -ForegroundColor Cyan
Write-Host "   Logs:        docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor White
Write-Host "   Arrêter:     docker-compose -f docker-compose.dev.yml down" -ForegroundColor White
Write-Host "   Redémarrer:  docker-compose -f docker-compose.dev.yml restart" -ForegroundColor White
Write-Host ""