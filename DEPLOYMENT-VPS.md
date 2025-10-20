# Déploiement VPS - Guide Complet

Ce guide détaille le déploiement de l'application blog_strapi sur un VPS avec Docker.

## 📋 Prérequis VPS

- Ubuntu 20.04+ ou Debian 11+
- Docker et Docker Compose installés
- Git installé
- Ports 1339 et 5173 ouverts

## 🚀 Installation sur VPS

### 1. Connexion et préparation du VPS

```bash
# Se connecter au VPS
ssh root@votre-ip-vps

# Mettre à jour le système
apt update && apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installer Docker Compose (dernière version)
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Vérifier les installations
docker --version
docker-compose --version
```

### 2. Cloner le projet

```bash
# Aller dans le répertoire désiré
cd /opt

# Cloner le repository
git clone https://github.com/boujrafh/blog_strapi.git
cd blog_strapi

# Vérifier les fichiers
ls -la .env.production docker-compose.production.yml
```

### 3. Déploiement automatique

```bash
# Rendre le script exécutable
chmod +x deploy-vps.sh

# Lancer le déploiement
./deploy-vps.sh
```

### 4. Configuration du pare-feu

```bash
# Autoriser les ports nécessaires
ufw allow 22     # SSH
ufw allow 1339   # Strapi
ufw allow 5173   # Frontend
ufw enable

# Vérifier le statut
ufw status
```

## 🔧 Configuration des secrets

Le fichier `.env.production` contient des secrets sécurisés pré-générés :

- JWT_SECRET : Token d'authentification JWT
- ADMIN_JWT_SECRET : Token admin Strapi
- API_TOKEN_SALT : Salt pour les tokens API
- TRANSFER_TOKEN_SALT : Salt pour les tokens de transfert
- APP_KEYS : Clés d'application (4 clés)

⚠️ **Important** : Ces secrets sont déjà générés et sécurisés. Ne les modifiez pas sauf nécessité.

## 📊 Vérification du déploiement

### URLs d'accès

- **Frontend** : http://votre-ip:5173
- **Admin Strapi** : http://votre-ip:1339/admin
- **API** : http://votre-ip:1339/api

### Commandes de gestion

```bash
# Voir les containers
docker-compose -f docker-compose.production.yml ps

# Voir les logs
docker-compose -f docker-compose.production.yml logs -f

# Redémarrer les services
docker-compose -f docker-compose.production.yml restart

# Arrêter les services
docker-compose -f docker-compose.production.yml down

# Mettre à jour et redéployer
./deploy-vps.sh
```

## 🔐 Configuration des permissions Strapi

Après le premier déploiement :

1. Aller sur : http://votre-ip:1339/admin
2. Créer le compte administrateur
3. Aller dans : **Settings > Users & Permissions Plugin > Roles**
4. Cliquer sur **Public**
5. Autoriser les permissions :
   - **Article** : find, findOne
   - **Category** : find, findOne  
   - **Tag** : find, findOne
   - **Project** : find, findOne
6. Sauvegarder

## 🌐 Configuration Nginx (Optionnel)

Pour utiliser un nom de domaine :

```bash
# Installer Nginx
apt install nginx -y

# Créer la configuration
nano /etc/nginx/sites-available/blog
```

Ajouter la configuration Nginx :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:1339;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /admin {
        proxy_pass http://localhost:1339;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activer le site
ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## 📝 Logs et débogage

```bash
# Logs en temps réel
docker-compose -f docker-compose.production.yml logs -f

# Logs d'un service spécifique
docker-compose -f docker-compose.production.yml logs strapi
docker-compose -f docker-compose.production.yml logs frontend

# Entrer dans un container
docker exec -it blog-strapi-prod /bin/sh
docker exec -it blog-frontend-prod /bin/sh
```

## 🔄 Mise à jour

```bash
# Simple : relancer le script
./deploy-vps.sh

# Manuel :
git pull origin master
docker-compose -f docker-compose.production.yml up -d --build
```

## 🗂️ Structure des données

- **Base SQLite** : Volume `blog_strapi_prod_data`
- **Uploads** : Volume `blog_strapi_prod_uploads`

Les données persistent entre les redémarrages de containers.

## ⚠️ Sécurité

- Changez les ports par défaut si nécessaire
- Configurez un firewall approprié
- Utilisez HTTPS en production (Certbot + Nginx)
- Sauvegardez régulièrement les volumes Docker

## 🆘 Dépannage

### Container qui ne démarre pas
```bash
docker-compose -f docker-compose.production.yml logs nom-du-service
```

### Problème de permissions
```bash
docker exec -it blog-strapi-prod chown -R strapi:nodejs /opt/app/data
```

### Reset complet
```bash
docker-compose -f docker-compose.production.yml down -v
docker system prune -a
./deploy-vps.sh
```