#!/bin/bash

# Script de déploiement automatique pour VPS
# Usage: ./deploy-vps.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement blog_strapi sur VPS..."
echo "========================================"

# Vérifications préalables
echo "🔍 Vérifications préalables..."

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé!"
    exit 1
fi

# Vérifier que Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé!"
    exit 1
fi

# Vérifier que le fichier .env.production existe
if [ ! -f ".env.production" ]; then
    echo "❌ Fichier .env.production manquant!"
    exit 1
fi

echo "✅ Vérifications OK"

# Mise à jour du code
echo "📥 Mise à jour du code depuis Git..."
git pull origin master

# Arrêter les anciens containers (si ils existent)
echo "🛑 Arrêt des anciens containers..."
docker-compose -f docker-compose.production.yml down || true

# Nettoyer les anciennes images (optionnel)
echo "🧹 Nettoyage des anciennes images..."
docker system prune -f || true

# Construction et démarrage
echo "🏗️  Construction et démarrage des containers..."
docker-compose -f docker-compose.production.yml up -d --build

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 30

# Vérifier le statut des containers
echo "📊 Statut des containers:"
docker-compose -f docker-compose.production.yml ps

# Test de santé
echo "🏥 Tests de santé..."
echo "Strapi:"
curl -f http://localhost:1339/_health && echo " ✅ Strapi OK" || echo " ❌ Strapi KO"

echo "Frontend:"
curl -f http://localhost:5173 &>/dev/null && echo " ✅ Frontend OK" || echo " ❌ Frontend KO"

# Afficher les logs récents
echo "📋 Logs récents:"
docker-compose -f docker-compose.production.yml logs --tail=20

echo ""
echo "✅ Déploiement terminé!"
echo "========================================"
echo "🌐 Frontend: http://$(curl -s ifconfig.me):5173"
echo "⚙️  Admin Strapi: http://$(curl -s ifconfig.me):1339/admin"
echo "📚 API: http://$(curl -s ifconfig.me):1339/api"
echo ""
echo "📝 Commandes utiles:"
echo "  - Voir les logs: docker-compose -f docker-compose.production.yml logs -f"
echo "  - Redémarrer: docker-compose -f docker-compose.production.yml restart"
echo "  - Arrêter: docker-compose -f docker-compose.production.yml down"
echo ""