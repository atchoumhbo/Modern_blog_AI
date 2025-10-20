#!/bin/bash

# Script de déploiement pour Modern Blog Leader
# Usage: ./deploy.sh [production|staging]

set -e

# Variables
ENVIRONMENT=${1:-production}
PROJECT_NAME="blog-strapi"
# Utiliser docker-compose.prod.yml pour la production
COMPOSE_FILE="docker-compose.prod.yml"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Vérifier les prérequis
check_prerequisites() {
    log "Vérification des prérequis..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker n'est pas installé"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose n'est pas installé"
    fi
    
    if [[ ! -f ".env" ]]; then
        error "Le fichier .env n'existe pas. Copiez .env.example vers .env et configurez-le."
    fi
    
    log "Prérequis OK ✓"
}

# Sauvegarder la base de données
backup_database() {
    log "Sauvegarde de la base de données..."
    
    # Créer le dossier de sauvegardes s'il n'existe pas
    mkdir -p ./backups
    
    # Nom du fichier de sauvegarde avec timestamp
    BACKUP_FILE="./backups/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Sauvegarder si le conteneur postgres existe
    if docker-compose ps postgres | grep -q "Up"; then
        docker-compose exec -T postgres pg_dump -U strapi blog_strapi > "$BACKUP_FILE"
        log "Sauvegarde créée: $BACKUP_FILE ✓"
    else
        warn "Le conteneur PostgreSQL n'est pas en cours d'exécution, saut de la sauvegarde"
    fi
}

# Construire les images
build_images() {
    log "Construction des images Docker..."
    
    # Construire avec cache
    docker-compose build --pull
    
    log "Images construites ✓"
}

# Déployer l'application
deploy() {
    log "Déploiement de l'environnement: $ENVIRONMENT"
    
    # Arrêter les services existants
    log "Arrêt des services existants..."
    docker-compose down
    
    # Démarrer les services de base (base de données, cache)
    log "Démarrage des services de base..."
    docker-compose up -d postgres redis
    
    # Attendre que les services soient prêts
    log "Attente de la disponibilité des services..."
    sleep 10
    
    # Démarrer Strapi
    log "Démarrage de Strapi..."
    docker-compose up -d strapi
    
    # Attendre que Strapi soit prêt
    log "Attente de Strapi..."
    sleep 20
    
    # Démarrer le frontend
    log "Démarrage du frontend..."
    docker-compose up -d frontend
    
    # Démarrer Nginx
    log "Démarrage de Nginx..."
    docker-compose up -d nginx
    
    # Optionnel: démarrer le monitoring
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log "Démarrage du monitoring..."
        docker-compose --profile monitoring up -d
    fi
    
    log "Déploiement terminé ✓"
}

# Vérifier la santé de l'application
health_check() {
    log "Vérification de la santé de l'application..."
    
    # Attendre un peu pour que les services démarrent
    sleep 30
    
    # Vérifier Nginx
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log "Nginx: OK ✓"
    else
        error "Nginx: FAILED ✗"
    fi
    
    # Vérifier Strapi
    if curl -f http://localhost:1337/_health > /dev/null 2>&1; then
        log "Strapi: OK ✓"
    else
        error "Strapi: FAILED ✗"
    fi
    
    # Vérifier Frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log "Frontend: OK ✓"
    else
        error "Frontend: FAILED ✗"
    fi
    
    log "Tous les services sont opérationnels ✓"
}

# Afficher les logs
show_logs() {
    log "Affichage des logs..."
    docker-compose logs -f --tail=50
}

# Nettoyage
cleanup() {
    log "Nettoyage des ressources inutilisées..."
    
    # Nettoyer les images non utilisées
    docker image prune -f
    
    # Nettoyer les volumes non utilisés (attention en production!)
    if [[ "$ENVIRONMENT" != "production" ]]; then
        docker volume prune -f
    fi
    
    log "Nettoyage terminé ✓"
}

# Menu principal
show_menu() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════╗"
    echo "║        Modern Blog Leader            ║"
    echo "║       Script de Déploiement         ║"
    echo "╚══════════════════════════════════════╝"
    echo -e "${NC}"
    echo "Environnement: $ENVIRONMENT"
    echo ""
    echo "Options disponibles:"
    echo "  1) Déploiement complet (recommandé)"
    echo "  2) Construction des images seulement"
    echo "  3) Déploiement sans reconstruction"
    echo "  4) Sauvegarde de la base de données"
    echo "  5) Vérification de la santé"
    echo "  6) Affichage des logs"
    echo "  7) Nettoyage"
    echo "  8) Arrêt des services"
    echo "  q) Quitter"
    echo ""
}

# Fonction principale
main() {
    check_prerequisites
    
    if [[ $# -eq 0 ]]; then
        # Mode interactif
        while true; do
            show_menu
            read -p "Choisissez une option: " choice
            
            case $choice in
                1)  backup_database
                    build_images
                    deploy
                    health_check
                    ;;
                2)  build_images ;;
                3)  deploy ;;
                4)  backup_database ;;
                5)  health_check ;;
                6)  show_logs ;;
                7)  cleanup ;;
                8)  docker-compose down
                    log "Services arrêtés ✓"
                    ;;
                q)  log "Au revoir!"
                    exit 0
                    ;;
                *)  warn "Option invalide" ;;
            esac
            
            echo ""
            read -p "Appuyez sur Entrée pour continuer..."
        done
    else
        # Mode automatique
        case $2 in
            "build")    build_images ;;
            "deploy")   deploy ;;
            "backup")   backup_database ;;
            "health")   health_check ;;
            "logs")     show_logs ;;
            "cleanup")  cleanup ;;
            "stop")     docker-compose down ;;
            *)          # Déploiement complet par défaut
                        backup_database
                        build_images
                        deploy
                        health_check
                        ;;
        esac
    fi
}

# Exécution
main "$@"