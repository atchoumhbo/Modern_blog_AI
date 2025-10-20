#!/bin/bash

echo "🧹 NETTOYAGE COMPLET DU VPS - Blog Strapi"
echo "========================================"

# 1. Arrêt de tous les containers Docker
echo "📦 Arrêt de tous les containers Docker..."
sudo docker stop $(sudo docker ps -aq) 2>/dev/null || echo "Aucun container en cours"

# 2. Suppression de tous les containers
echo "🗑️  Suppression de tous les containers..."
sudo docker rm $(sudo docker ps -aq) 2>/dev/null || echo "Aucun container à supprimer"

# 3. Suppression de toutes les images Docker
echo "🖼️  Suppression de toutes les images Docker..."
sudo docker rmi $(sudo docker images -q) --force 2>/dev/null || echo "Aucune image à supprimer"

# 4. Nettoyage des volumes Docker
echo "💾 Nettoyage des volumes Docker..."
sudo docker volume prune --force 2>/dev/null || echo "Aucun volume à supprimer"

# 5. Nettoyage des réseaux Docker
echo "🌐 Nettoyage des réseaux Docker..."
sudo docker network prune --force 2>/dev/null || echo "Aucun réseau à supprimer"

# 6. Nettoyage du système Docker complet
echo "🧽 Nettoyage système Docker complet..."
sudo docker system prune -a --volumes --force 2>/dev/null || echo "Système Docker déjà propre"

# 7. Suppression des dossiers de projets existants
echo "📁 Suppression des anciens projets..."
sudo rm -rf /root/blog_strapi* 2>/dev/null || echo "Aucun dossier blog_strapi trouvé"
sudo rm -rf /opt/blog_strapi* 2>/dev/null || echo "Aucun dossier blog_strapi dans /opt trouvé"
sudo rm -rf /home/*/blog_strapi* 2>/dev/null || echo "Aucun dossier blog_strapi dans /home trouvé"

# 8. Nettoyage des processus Node.js/PM2
echo "⚡ Arrêt des processus Node.js et PM2..."
sudo pkill -f node 2>/dev/null || echo "Aucun processus Node.js trouvé"
sudo pkill -f strapi 2>/dev/null || echo "Aucun processus Strapi trouvé"
pm2 kill 2>/dev/null || echo "PM2 non installé ou aucun processus"

# 9. Nettoyage des ports occupés
echo "🔌 Libération des ports 1337, 3000, 5432, 6379, 80, 443..."
sudo fuser -k 1337/tcp 2>/dev/null || echo "Port 1337 libre"
sudo fuser -k 3000/tcp 2>/dev/null || echo "Port 3000 libre"
sudo fuser -k 5432/tcp 2>/dev/null || echo "Port 5432 libre"
sudo fuser -k 6379/tcp 2>/dev/null || echo "Port 6379 libre"
sudo fuser -k 80/tcp 2>/dev/null || echo "Port 80 libre"
sudo fuser -k 443/tcp 2>/dev/null || echo "Port 443 libre"

# 10. Nettoyage des logs Docker
echo "📄 Nettoyage des logs Docker..."
sudo find /var/lib/docker/containers/ -name "*.log" -delete 2>/dev/null || echo "Aucun log Docker à supprimer"

# 11. Nettoyage de l'espace disque
echo "💿 Nettoyage de l'espace disque..."
sudo apt autoremove -y 2>/dev/null || echo "Autoremove déjà fait"
sudo apt autoclean -y 2>/dev/null || echo "Autoclean déjà fait"

# 12. Affichage de l'espace disque disponible
echo ""
echo "💾 ESPACE DISQUE APRÈS NETTOYAGE:"
df -h / | tail -1

# 13. Vérification des processus en cours
echo ""
echo "⚡ PROCESSUS EN COURS (Docker, Node.js, etc.):"
ps aux | grep -E "(docker|node|strapi|nginx|postgres|redis)" | grep -v grep || echo "Aucun processus trouvé"

# 14. Vérification des ports occupés
echo ""
echo "🔌 PORTS ACTUELLEMENT OCCUPÉS:"
sudo netstat -tlnp | grep -E ":1337|:3000|:5432|:6379|:80|:443" || echo "Aucun port occupé"

echo ""
echo "✅ NETTOYAGE TERMINÉ !"
echo "Le VPS est maintenant complètement propre et prêt pour une nouvelle installation."