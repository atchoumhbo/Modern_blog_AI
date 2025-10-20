# 🚀 Déploiement sur VPS Ubuntu

Ce guide explique comment déployer le blog sur votre VPS Ubuntu avec SQLite (sans PostgreSQL ni Redis).

## 📋 Prérequis

- VPS Ubuntu (20.04+ recommandé)
- Docker et Docker Compose installés
- Accès SSH au VPS
- Nom de domaine configuré (optionnel mais recommandé)

## 🔧 Installation initiale sur le VPS

### 1. Connexion au VPS
```bash
ssh root@votre-vps-ip
```

### 2. Installation de Docker (si pas déjà fait)
```bash
# Mise à jour du système
apt update && apt upgrade -y

# Installation de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installation de Docker Compose
apt install docker-compose -y

# Vérification
docker --version
docker-compose --version
```

### 3. Cloner le repository
```bash
cd /devops
git clone https://github.com/boujrafh/blog_strapi.git
cd blog_strapi
```

### 4. Configurer les variables d'environnement
```bash
# Copier le fichier exemple
cp .env.prod.example .env

# Éditer avec vos valeurs (IMPORTANT: changez les secrets!)
nano .env

# Générer des secrets forts:
openssl rand -base64 32  # Utilisez ceci pour JWT_SECRET
openssl rand -base64 32  # Pour ADMIN_JWT_SECRET
openssl rand -base64 32  # Pour API_TOKEN_SALT
openssl rand -base64 32  # Pour TRANSFER_TOKEN_SALT
```

### 5. Premier déploiement
```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Lancer le déploiement
./deploy.sh
```

## 🔄 Mises à jour (déploiement régulier)

**Commande simple** (la plus facile à retenir) :
```bash
cd /devops/blog_strapi
./deploy.sh
```

**Ou manuellement** :
```bash
cd /devops/blog_strapi

# 1. Récupérer les changements
git pull origin master

# 2. Arrêter les conteneurs
docker-compose -f docker-compose.prod.yml down

# 3. Reconstruire et relancer
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Voir les logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 📊 Commandes utiles

### Voir l'état des conteneurs
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Voir les logs
```bash
# Tous les services
docker-compose -f docker-compose.prod.yml logs -f

# Un service spécifique
docker-compose -f docker-compose.prod.yml logs -f strapi
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Redémarrer un service
```bash
docker-compose -f docker-compose.prod.yml restart strapi
docker-compose -f docker-compose.prod.yml restart frontend
```

### Arrêter tout
```bash
docker-compose -f docker-compose.prod.yml down
```

### Nettoyer complètement (⚠️ supprime les données)
```bash
docker-compose -f docker-compose.prod.yml down -v
```

## 🔍 Vérifications

### Santé des conteneurs
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Vérifier que Strapi fonctionne
```bash
curl http://localhost:1337/_health
# Devrait retourner: {"status":"ok"}
```

### Vérifier Nginx
```bash
curl http://localhost
# Devrait retourner le HTML du frontend
```

## 🗄️ Base de données SQLite

Les données SQLite sont stockées dans un volume Docker :
- **Volume** : `strapi_prod_data`
- **Localisation dans le conteneur** : `/opt/app/data/data.db`

### Backup de la base de données
```bash
# Créer un backup
docker-compose -f docker-compose.prod.yml exec strapi cp /opt/app/data/data.db /opt/app/data/backup-$(date +%Y%m%d).db

# Copier le backup vers l'hôte
docker cp blog-strapi-prod:/opt/app/data/backup-20251006.db ./backup-20251006.db
```

### Restaurer un backup
```bash
# Copier le backup dans le conteneur
docker cp ./backup-20251006.db blog-strapi-prod:/opt/app/data/data.db

# Redémarrer Strapi
docker-compose -f docker-compose.prod.yml restart strapi
```

## 📁 Uploads (images, fichiers)

Les fichiers uploadés sont stockés dans le volume :
- **Volume** : `strapi_prod_uploads`
- **Localisation** : `/opt/app/public/uploads`

### Backup des uploads
```bash
# Copier tous les uploads
docker cp blog-strapi-prod:/opt/app/public/uploads ./uploads-backup
```

## 🔒 SSL/HTTPS avec Certbot (optionnel)

Pour activer HTTPS avec Let's Encrypt :

```bash
# Installer Certbot
apt install certbot python3-certbot-nginx -y

# Obtenir un certificat
certbot --nginx -d votre-domaine.com

# Renouvellement automatique (déjà configuré par défaut)
certbot renew --dry-run
```

## 🆘 Dépannage

### Conteneur ne démarre pas
```bash
# Voir les logs d'erreur
docker-compose -f docker-compose.prod.yml logs strapi

# Vérifier les variables d'environnement
docker-compose -f docker-compose.prod.yml exec strapi env | grep -i strapi
```

### Espace disque plein
```bash
# Nettoyer les images inutilisées
docker system prune -a

# Voir l'espace utilisé
docker system df
```

### Reset complet (⚠️ perte de données)
```bash
# Tout arrêter et supprimer
docker-compose -f docker-compose.prod.yml down -v

# Supprimer les images
docker-compose -f docker-compose.prod.yml down --rmi all

# Redéployer
./deploy.sh
```

## 📝 Notes importantes

1. **SQLite uniquement** : Pas de PostgreSQL ni Redis en production
2. **Données persistantes** : Les volumes Docker conservent vos données
3. **Backups réguliers** : Sauvegardez régulièrement la base de données et les uploads
4. **Secrets** : Ne partagez JAMAIS votre fichier `.env` avec les vraies valeurs

## 🔗 Liens utiles

- [Documentation Strapi](https://docs.strapi.io)
- [Documentation Docker](https://docs.docker.com)
- [GitHub Repository](https://github.com/boujrafh/blog_strapi)
