# 🚀 Guide de Déploiement - Modern Blog Leader

## Vue d'ensemble

Ce guide détaille le processus de déploiement de l'application Modern Blog Leader sur un VPS en utilisant Docker et Docker Compose.

## 🏗️ Architecture de Déploiement

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Nginx (Port 80/443)                        │
│                 Reverse Proxy                               │
└─────────────┬───────────────────────┬─────────────────────────┘
              │                       │
    ┌─────────▼─────────┐   ┌─────────▼─────────┐
    │    Frontend       │   │     Strapi       │
    │  (React Router)   │   │   (Backend API)  │
    │   Port 3000       │   │   Port 1337      │
    └───────────────────┘   └─────────┬─────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
    ┌─────────▼─────────┐   ┌─────────▼─────────┐   ┌─────────▼─────────┐
    │   PostgreSQL      │   │      Redis       │   │   File Storage    │
    │   Port 5432       │   │   Port 6379      │   │    (Volumes)      │
    └───────────────────┘   └───────────────────┘   └───────────────────┘
```

## 📋 Prérequis

### Sur votre VPS
- **OS :** Ubuntu 20.04+ ou Debian 11+
- **RAM :** Minimum 2GB (4GB recommandé)
- **Stockage :** Minimum 20GB
- **Docker :** Version 20.10+
- **Docker Compose :** Version 2.0+

### Domaine et SSL
- Nom de domaine configuré vers votre VPS
- Certificats SSL (Let's Encrypt recommandé)

## 🔧 Configuration Initiale

### 1. Installation de Docker

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER

# Installation de Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Vérification
docker --version
docker-compose --version
```

### 2. Clonage du Projet

```bash
# Cloner le repository
git clone https://github.com/votre-username/blog_strapi.git
cd blog_strapi

# Rendre les scripts exécutables
chmod +x deploy.sh
```

### 3. Configuration des Variables d'Environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer les variables (utilisez nano, vim, ou votre éditeur préféré)
nano .env
```

#### Variables Importantes à Configurer :

```bash
# Base de données - utilisez des mots de passe forts !
DATABASE_NAME=blog_strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=VotreMdpSecurise123!

# Redis
REDIS_PASSWORD=VotreRedisPassword456!

# Strapi - générez des clés aléatoirement !
JWT_SECRET=$(openssl rand -base64 32)
ADMIN_JWT_SECRET=$(openssl rand -base64 32)
API_TOKEN_SALT=$(openssl rand -base64 32)
APP_KEYS=$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32)

# URLs de production
VITE_STRAPI_URL=https://api.votre-domaine.com
VITE_SITE_URL=https://votre-domaine.com
VITE_SITE_NAME=Modern Blog Leader

# Google Analytics (optionnel)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Monitoring
GRAFANA_USER=admin
GRAFANA_PASSWORD=VotreGrafanaPassword789!
```

## 🚀 Déploiement

### Option 1 : Script Automatique (Recommandé)

```bash
# Déploiement complet
./deploy.sh production

# Ou mode interactif
./deploy.sh
```

### Option 2 : Déploiement Manuel

```bash
# 1. Construction des images
docker-compose build --pull

# 2. Sauvegarde (si migration)
docker-compose exec postgres pg_dump -U strapi blog_strapi > backup.sql

# 3. Démarrage des services
docker-compose up -d postgres redis
sleep 10

docker-compose up -d strapi
sleep 20

docker-compose up -d frontend nginx

# 4. Vérification
docker-compose ps
```

### Option 3 : PowerShell (Windows)

```powershell
# Déploiement complet
.\deploy.ps1 -Environment production -Action full

# Mode interactif
.\deploy.ps1 -Action interactive
```

## 🔐 Configuration SSL/HTTPS

### 1. Installation de Certbot (Let's Encrypt)

```bash
# Installation
sudo apt install certbot python3-certbot-nginx

# Obtenir les certificats
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Renouvellement automatique
sudo crontab -e
# Ajouter : 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Configuration Nginx pour HTTPS

Modifiez `/nginx/conf.d/default.conf` :

```nginx
# Décommentez et configurez la section HTTPS
server {
    listen 443 ssl http2;
    server_name votre-domaine.com www.votre-domaine.com;
    
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_private_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
    
    # ... reste de la configuration
}
```

### 3. Redémarrage après Configuration SSL

```bash
# Redémarrer Nginx
docker-compose restart nginx

# Ou redéploiement complet
./deploy.sh production deploy
```

## 📊 Monitoring et Surveillance

### 1. Activation du Monitoring

```bash
# Démarrer avec le profil monitoring
docker-compose --profile monitoring up -d

# Ou via le script
./deploy.sh production
# Puis choisir l'option monitoring
```

### 2. Accès aux Outils

- **Grafana :** http://votre-domaine.com:3001
  - User: `admin`
  - Password: Configuré dans `.env`

- **Prometheus :** http://votre-domaine.com:9090

### 3. Métriques Surveillées

- Performance des conteneurs
- Utilisation CPU/RAM/Disque
- Logs d'erreurs applicatives
- Temps de réponse des API
- Métriques Google Analytics

## 🔄 Maintenance et Mises à Jour

### 1. Sauvegarde Régulière

```bash
# Sauvegarde manuelle
./deploy.sh production backup

# Automatisation avec cron
0 2 * * * cd /path/to/blog_strapi && ./deploy.sh production backup
```

### 2. Mise à Jour de l'Application

```bash
# 1. Récupérer les dernières modifications
git pull origin main

# 2. Déploiement avec sauvegarde
./deploy.sh production

# 3. Vérification
./deploy.sh production health
```

### 3. Rotation des Logs

```bash
# Configuration dans /etc/logrotate.d/docker
/var/lib/docker/containers/*/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
```

## 🚨 Dépannage

### 1. Vérification de l'État des Services

```bash
# État des conteneurs
docker-compose ps

# Logs d'un service spécifique
docker-compose logs -f strapi
docker-compose logs -f frontend
docker-compose logs -f nginx

# Utilisation des ressources
docker stats
```

### 2. Problèmes Courants

#### Base de Données Inaccessible
```bash
# Vérifier PostgreSQL
docker-compose exec postgres pg_isready -U strapi

# Redémarrer si nécessaire
docker-compose restart postgres
```

#### Erreurs de Build
```bash
# Nettoyer et reconstruire
docker-compose down
docker system prune -f
docker-compose build --no-cache
```

#### Problèmes SSL
```bash
# Vérifier les certificats
sudo certbot certificates

# Renouveler manuellement
sudo certbot renew
```

### 3. Commandes d'Urgence

```bash
# Arrêt d'urgence
docker-compose down

# Sauvegarde d'urgence
docker-compose exec postgres pg_dump -U strapi blog_strapi > emergency_backup.sql

# Restauration depuis sauvegarde
docker-compose exec -T postgres psql -U strapi -d blog_strapi < backup.sql
```

## 📈 Optimisations de Performance

### 1. Configuration Nginx

```nginx
# Dans nginx.conf - optimisations déjà incluses
worker_processes auto;
worker_connections 1024;
gzip on;
```

### 2. Configuration Base de Données

```sql
-- Optimisations PostgreSQL (à exécuter dans postgres)
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET random_page_cost = 1.1;
SELECT pg_reload_conf();
```

### 3. Monitoring des Performances

```bash
# Surveiller les ressources
docker stats --no-stream

# Analyser les logs lents
docker-compose logs strapi | grep "slow query"
```

## 🔒 Sécurité

### 1. Pare-feu

```bash
# Configuration UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Fail2Ban

```bash
# Installation
sudo apt install fail2ban

# Configuration pour Nginx
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
# Éditer et activer les règles nginx
```

### 3. Mise à jour Régulière

```bash
# Script de mise à jour système
#!/bin/bash
sudo apt update && sudo apt upgrade -y
docker system prune -f
```

## 📞 Support

En cas de problème :

1. **Vérifiez les logs :** `docker-compose logs -f`
2. **Consultez la santé :** `./deploy.sh health`
3. **Sauvegardez avant modifications :** `./deploy.sh backup`

## 🎯 Checklist de Déploiement

- [ ] VPS configuré avec Docker
- [ ] Domaine pointé vers le VPS
- [ ] Variables d'environnement configurées
- [ ] Certificats SSL obtenus
- [ ] Application déployée
- [ ] Tests de santé passés
- [ ] Monitoring activé
- [ ] Sauvegardes configurées
- [ ] Pare-feu configuré

---

**🎉 Félicitations !** Votre Modern Blog Leader est maintenant déployé en production !