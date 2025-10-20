# Script PowerShell pour nettoyer le VPS à distance
param(
    [Parameter(Mandatory=$true)]
    [string]$VpsIP = "173.212.208.181"
)

Write-Host "🧹 NETTOYAGE DU VPS $VpsIP" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow

# 1. Copie du script de nettoyage sur le VPS
Write-Host "📤 Copie du script de nettoyage sur le VPS..." -ForegroundColor Green
scp scripts/clean-vps.sh root@${VpsIP}:/tmp/clean-vps.sh

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la copie du script" -ForegroundColor Red
    exit 1
}

# 2. Rendre le script exécutable et l'exécuter
Write-Host "⚡ Exécution du nettoyage sur le VPS..." -ForegroundColor Green
ssh root@$VpsIP @"
chmod +x /tmp/clean-vps.sh
/tmp/clean-vps.sh
rm /tmp/clean-vps.sh
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Nettoyage du VPS terminé avec succès !" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur during le nettoyage" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 Le VPS est maintenant prêt pour un nouveau déploiement !" -ForegroundColor Cyan