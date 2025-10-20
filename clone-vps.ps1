# Script pour cloner le projet sur le VPS
# Usage: .\clone-vps.ps1

$VPS_IP = "173.212.208.181"
$VPS_USER = "root"
$PROJECT_PATH = "/root/blog_strapi"
$GITHUB_URL = "https://boujrafh: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@github.com/boujrafh/blog_strapi.git"

Write-Host "[CLONE VPS] Clonage du projet sur le VPS $VPS_IP" -ForegroundColor Cyan
Write-Host ""

# Vérifier la connexion SSH
Write-Host "[SSH] Test de connexion..." -ForegroundColor Yellow
ssh -o ConnectTimeout=5 $VPS_USER@$VPS_IP "echo '[OK] Connexion SSH reussie'" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERREUR] Impossible de se connecter au VPS" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Vérifier si le dossier existe déjà
Write-Host "[CHECK] Verification si le projet existe deja..." -ForegroundColor Yellow
$projectExists = ssh $VPS_USER@$VPS_IP "[ -d '$PROJECT_PATH' ] && echo 'exists' || echo 'missing'"

if ($projectExists -match "exists") {
    Write-Host "[WARNING] Le projet existe deja dans $PROJECT_PATH" -ForegroundColor Yellow
    $response = Read-Host "Voulez-vous le supprimer et cloner a nouveau? (o/N)"
    if ($response -eq "o" -or $response -eq "O") {
        Write-Host "[DELETE] Suppression du dossier existant..." -ForegroundColor Yellow
        ssh $VPS_USER@$VPS_IP "rm -rf '$PROJECT_PATH'"
    } else {
        Write-Host "[ANNULE] Clonage annule" -ForegroundColor Yellow
        exit 0
    }
}

# Cloner le projet
Write-Host "[GIT] Clonage du projet depuis GitHub..." -ForegroundColor Yellow
Write-Host ""

ssh -t $VPS_USER@$VPS_IP "git clone '$GITHUB_URL' '$PROJECT_PATH'"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[SUCCESS] Projet clone avec succes!" -ForegroundColor Green
    Write-Host ""
    Write-Host "[INFO] Prochaines etapes:" -ForegroundColor Cyan
    Write-Host "  1. Verifier le VPS: .\check-vps.ps1" -ForegroundColor White
    Write-Host "  2. Deployer: .\deploy-vps.ps1" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "[ERREUR] Echec du clonage" -ForegroundColor Red
}
