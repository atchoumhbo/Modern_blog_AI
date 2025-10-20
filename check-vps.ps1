# Script de vrification du VPS avant dploiement
# Usage: .\check-vps.ps1

$VPS_IP = "173.212.208.181"
$VPS_USER = "root"
$PROJECT_PATH = "/root/blog_strapi"

Write-Host " Vrification du VPS $VPS_IP" -ForegroundColor Cyan
Write-Host ""

# Test connexion SSH
Write-Host "1  Test connexion SSH..." -ForegroundColor Yellow
ssh -o ConnectTimeout=5 $VPS_USER@$VPS_IP "echo 'SSH OK'" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ERREUR: Connexion SSH echouee" -ForegroundColor Red
    exit 1
}
Write-Host "   OK: SSH fonctionne" -ForegroundColor Green

# Vrifier que le projet existe
Write-Host "2  Verification du projet..." -ForegroundColor Yellow
$projectExists = ssh $VPS_USER@$VPS_IP "if [ -d '$PROJECT_PATH' ]; then echo 'exists'; else echo 'missing'; fi"
if ($projectExists -match "missing") {
    Write-Host "   ERREUR: Projet non trouve dans $PROJECT_PATH" -ForegroundColor Red
    Write-Host "   Clonez d'abord le repo:" -ForegroundColor Yellow
    Write-Host "   ssh $VPS_USER@$VPS_IP" -ForegroundColor White
    Write-Host "   git clone https://github.com/boujrafh/blog_strapi.git $PROJECT_PATH" -ForegroundColor White
    exit 1
} else {
    Write-Host "   OK: Projet trouve" -ForegroundColor Green
}

# Vrifier Docker
Write-Host "3  Vrification Docker..." -ForegroundColor Yellow
$dockerVersion = ssh $VPS_USER@$VPS_IP "docker --version 2>&1"
if ($LASTEXITCODE -eq 0) {
    Write-Host "    Docker install: $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "    Docker non install" -ForegroundColor Red
    exit 1
}

# Vrifier Docker Compose
Write-Host "4  Vrification Docker Compose..." -ForegroundColor Yellow
$composeVersion = ssh $VPS_USER@$VPS_IP "docker-compose --version 2>&1"
if ($LASTEXITCODE -eq 0) {
    Write-Host "    Docker Compose install: $composeVersion" -ForegroundColor Green
} else {
    Write-Host "    Docker Compose non install" -ForegroundColor Red
    exit 1
}

# Vrifier les fichiers ncessaires
Write-Host "5  Vrification des fichiers..." -ForegroundColor Yellow
$files = @(
    "docker-compose.yml",
    "frontend/.env.production",
    "frontend/Dockerfile",
    "backend/Dockerfile"
)

foreach ($file in $files) {
    $exists = ssh $VPS_USER@$VPS_IP "[ -f '$PROJECT_PATH/$file' ] && echo 'yes' || echo 'no'"
    if ($exists -eq "yes") {
        Write-Host "    $file" -ForegroundColor Green
    } else {
        Write-Host "    $file manquant" -ForegroundColor Red
    }
}

# Vrifier les ports
Write-Host "6  Vrification des ports..." -ForegroundColor Yellow
$ports = @(80, 443, 1337)
foreach ($port in $ports) {
    $portInUse = ssh $VPS_USER@$VPS_IP "netstat -tuln | grep ':$port ' || echo 'free'"
    if ($portInUse -eq "free") {
        Write-Host "    Port $port disponible" -ForegroundColor Green
    } else {
        Write-Host "     Port $port en cours d'utilisation" -ForegroundColor Yellow
    }
}

# Vrifier l'espace disque
Write-Host "7  Verification espace disque..." -ForegroundColor Yellow
$diskSpace = ssh $VPS_USER@$VPS_IP "df -h / | tail -1 | awk '{print `$5}' | sed 's/%//'"
$diskInt = 0
[int]::TryParse($diskSpace, [ref]$diskInt) | Out-Null
if ($diskInt -lt 80) {
    Write-Host "   OK: Espace disque OK ($diskSpace pourcent utilise)" -ForegroundColor Green
} else {
    Write-Host "   ATTENTION: Espace disque faible ($diskSpace pourcent utilise)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host " VPS prt pour le dploiement!" -ForegroundColor Green
Write-Host ""
Write-Host "Pour dployer, excutez:" -ForegroundColor Cyan
Write-Host ".\deploy-vps.ps1" -ForegroundColor White
