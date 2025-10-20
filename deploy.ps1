# Script de déploiement PowerShell pour Modern Blog Leader
# Usage: .\deploy.ps1 [-Environment production] [-Action deploy]

param(
    [string]$Environment = "production",
    [string]$Action = "full"
)

# Variables
$ProjectName = "blog-strapi"
$ComposeFile = "docker-compose.yml"

# Fonction de logging avec couleurs
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    switch ($Level) {
        "INFO"    { Write-Host "[$timestamp] $Message" -ForegroundColor Green }
        "WARN"    { Write-Host "[$timestamp] WARNING: $Message" -ForegroundColor Yellow }
        "ERROR"   { Write-Host "[$timestamp] ERROR: $Message" -ForegroundColor Red }
        "DEBUG"   { Write-Host "[$timestamp] DEBUG: $Message" -ForegroundColor Cyan }
    }
}

function Write-Error-Exit {
    param([string]$Message)
    Write-Log $Message "ERROR"
    exit 1
}

# Vérifier les prérequis
function Test-Prerequisites {
    Write-Log "Vérification des prérequis..."
    
    # Vérifier Docker
    try {
        $null = docker --version
        Write-Log "Docker: OK ✓"
    }
    catch {
        Write-Error-Exit "Docker n'est pas installé ou accessible"
    }
    
    # Vérifier Docker Compose
    try {
        $null = docker-compose --version
        Write-Log "Docker Compose: OK ✓"
    }
    catch {
        Write-Error-Exit "Docker Compose n'est pas installé ou accessible"
    }
    
    # Vérifier le fichier .env
    if (-not (Test-Path ".env")) {
        Write-Error-Exit "Le fichier .env n'existe pas. Copiez .env.example vers .env et configurez-le."
    }
    
    Write-Log "Prérequis OK ✓"
}

# Sauvegarder la base de données
function Backup-Database {
    Write-Log "Sauvegarde de la base de données..."
    
    # Créer le dossier de sauvegardes
    if (-not (Test-Path "backups")) {
        New-Item -ItemType Directory -Path "backups"
    }
    
    # Nom du fichier avec timestamp
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "backups/backup_$timestamp.sql"
    
    # Vérifier si PostgreSQL est en cours d'exécution
    $postgresStatus = docker-compose ps postgres 2>$null
    if ($postgresStatus -match "Up") {
        try {
            docker-compose exec -T postgres pg_dump -U strapi blog_strapi | Out-File -FilePath $backupFile -Encoding UTF8
            Write-Log "Sauvegarde créée: $backupFile ✓"
        }
        catch {
            Write-Log "Erreur lors de la sauvegarde: $_" "WARN"
        }
    }
    else {
        Write-Log "PostgreSQL n'est pas en cours d'exécution, saut de la sauvegarde" "WARN"
    }
}

# Construire les images
function Build-Images {
    Write-Log "Construction des images Docker..."
    
    try {
        docker-compose build --pull
        Write-Log "Images construites ✓"
    }
    catch {
        Write-Error-Exit "Erreur lors de la construction des images: $_"
    }
}

# Déployer l'application
function Deploy-Application {
    Write-Log "Déploiement de l'environnement: $Environment"
    
    try {
        # Arrêter les services existants
        Write-Log "Arrêt des services existants..."
        docker-compose down
        
        # Démarrer les services de base
        Write-Log "Démarrage des services de base..."
        docker-compose up -d postgres redis
        
        # Attendre que les services soient prêts
        Write-Log "Attente de la disponibilité des services..."
        Start-Sleep -Seconds 10
        
        # Démarrer Strapi
        Write-Log "Démarrage de Strapi..."
        docker-compose up -d strapi
        
        # Attendre Strapi
        Write-Log "Attente de Strapi..."
        Start-Sleep -Seconds 20
        
        # Démarrer le frontend
        Write-Log "Démarrage du frontend..."
        docker-compose up -d frontend
        
        # Démarrer Nginx
        Write-Log "Démarrage de Nginx..."
        docker-compose up -d nginx
        
        # Monitoring en production
        if ($Environment -eq "production") {
            Write-Log "Démarrage du monitoring..."
            docker-compose --profile monitoring up -d
        }
        
        Write-Log "Déploiement terminé ✓"
    }
    catch {
        Write-Error-Exit "Erreur lors du déploiement: $_"
    }
}

# Vérifier la santé
function Test-Health {
    Write-Log "Vérification de la santé de l'application..."
    
    # Attendre le démarrage
    Start-Sleep -Seconds 30
    
    # Tester Nginx
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Log "Nginx: OK ✓"
        }
    }
    catch {
        Write-Log "Nginx: FAILED ✗" "ERROR"
    }
    
    # Tester Strapi
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:1337/_health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Log "Strapi: OK ✓"
        }
    }
    catch {
        Write-Log "Strapi: FAILED ✗" "ERROR"
    }
    
    # Tester Frontend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Log "Frontend: OK ✓"
        }
    }
    catch {
        Write-Log "Frontend: FAILED ✗" "ERROR"
    }
    
    Write-Log "Vérification terminée"
}

# Afficher les logs
function Show-Logs {
    Write-Log "Affichage des logs..."
    docker-compose logs -f --tail=50
}

# Nettoyage
function Invoke-Cleanup {
    Write-Log "Nettoyage des ressources inutilisées..."
    
    try {
        # Nettoyer les images
        docker image prune -f
        
        # Nettoyer les volumes (sauf en production)
        if ($Environment -ne "production") {
            docker volume prune -f
        }
        
        Write-Log "Nettoyage terminé ✓"
    }
    catch {
        Write-Log "Erreur lors du nettoyage: $_" "WARN"
    }
}

# Menu interactif
function Show-Menu {
    Clear-Host
    Write-Host "╔══════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║        Modern Blog Leader            ║" -ForegroundColor Cyan
    Write-Host "║       Script de Déploiement         ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Environnement: $Environment" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options disponibles:"
    Write-Host "  1) Déploiement complet (recommandé)"
    Write-Host "  2) Construction des images seulement"
    Write-Host "  3) Déploiement sans reconstruction"
    Write-Host "  4) Sauvegarde de la base de données"
    Write-Host "  5) Vérification de la santé"
    Write-Host "  6) Affichage des logs"
    Write-Host "  7) Nettoyage"
    Write-Host "  8) Arrêt des services"
    Write-Host "  Q) Quitter"
    Write-Host ""
}

# Fonction principale
function Main {
    Test-Prerequisites
    
    if ($Action -eq "interactive") {
        # Mode interactif
        do {
            Show-Menu
            $choice = Read-Host "Choisissez une option"
            
            switch ($choice.ToUpper()) {
                "1" {
                    Backup-Database
                    Build-Images
                    Deploy-Application
                    Test-Health
                }
                "2" { Build-Images }
                "3" { Deploy-Application }
                "4" { Backup-Database }
                "5" { Test-Health }
                "6" { Show-Logs }
                "7" { Invoke-Cleanup }
                "8" {
                    docker-compose down
                    Write-Log "Services arrêtés ✓"
                }
                "Q" {
                    Write-Log "Au revoir!"
                    return
                }
                default {
                    Write-Log "Option invalide" "WARN"
                    Start-Sleep -Seconds 2
                }
            }
            
            if ($choice.ToUpper() -ne "Q") {
                Write-Host ""
                Read-Host "Appuyez sur Entrée pour continuer"
            }
        } while ($choice.ToUpper() -ne "Q")
    }
    else {
        # Mode automatique
        switch ($Action) {
            "build"   { Build-Images }
            "deploy"  { Deploy-Application }
            "backup"  { Backup-Database }
            "health"  { Test-Health }
            "logs"    { Show-Logs }
            "cleanup" { Invoke-Cleanup }
            "stop"    { docker-compose down }
            "full"    {
                Backup-Database
                Build-Images
                Deploy-Application
                Test-Health
            }
            default   {
                Write-Log "Action inconnue: $Action" "ERROR"
                exit 1
            }
        }
    }
}

# Exécution
try {
    Main
}
catch {
    Write-Error-Exit "Erreur fatale: $_"
}