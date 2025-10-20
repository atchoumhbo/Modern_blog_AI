# Deployment Guide – Docker Simple (Production Ready)

## 🐳 Déploiement Automatique avec Docker

Cette méthode utilise Docker pour automatiser complètement l'installation de Strapi.

---

## ✅ Avantages de cette Méthode

- 🚀 **Installation en une commande** : `docker-compose up -d`
- 📦 **Tout est isolé** : Pas de conflit avec d'autres services
- 🔄 **Reproductible** : Fonctionne partout de la même manière
- 🛡️ **Production-ready** : Healthchecks, restart automatique
- 💾 **Données persistées** : Volumes Docker pour DB et uploads

---

## Prerequisites

- Ubuntu 22.04/24.04 Server (VPS)
- Root or sudo privileges
- Git installé
- Docker et Docker Compose installés

---

## ÉTAPE 1 : Installer Docker sur le VPS

### 1.1 Mettre à jour le système

```bash
sudo apt update -y && sudo apt upgrade -y
```

### 1.2 Installer Docker

```bash
# Installer les dépendances
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Ajouter la clé GPG Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Ajouter le repository Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installer Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Vérifier
docker --version
```

### 1.3 Installer Docker Compose

```bash
# Télécharger Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Rendre exécutable
sudo chmod +x /usr/local/bin/docker-compose

# Vérifier
docker-compose --version
```

### 1.4 Permettre l'utilisation de Docker sans sudo (optionnel)

```bash
sudo usermod -aG docker $USER
newgrp docker
```

---

## ÉTAPE 2 : Cloner le Projet

```bash
cd /root
git clone https://github.com/boujrafh/blog_strapi.git
cd blog_strapi
```

---

## ÉTAPE 3 : Configurer les Variables d'Environnement

### 3.1 Copier le fichier d'exemple et le modifier

```bash
cd /root/blog_strapi

# Copier le fichier d'exemple
cp .env.docker.example .env

# Éditer le fichier
nano .env
```

### 3.2 Générer les secrets

```bash
echo "APP_KEYS=$(openssl rand -base64 32),$(openssl rand -base64 32)"
echo "API_TOKEN_SALT=$(openssl rand -base64 32)"
echo "ADMIN_JWT_SECRET=$(openssl rand -base64 32)"
echo "TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 32)"
```

### 3.3 Éditer le fichier .env

```bash
nano .env
```

Remplacer les valeurs `changeme` par les valeurs générées ci-dessus.

Exemple final :
```env
APP_KEYS=abc123def456ghi789,xyz987uvw654rst321
API_TOKEN_SALT=salt123456789abcdef
ADMIN_JWT_SECRET=jwt987654321fedcba
TRANSFER_TOKEN_SALT=transfer123456789abc
JWT_SECRET=secret789456123defghi
```

Sauvegarder avec **Ctrl+X**, puis **Y**, puis **Enter**.

---

## ÉTAPE 4 : Vérifier les Fichiers Docker

### 4.1 Vérifier docker-compose.simple.yml

```bash
cd /root/blog_strapi
cat docker-compose.simple.yml
```

Vous devriez voir :
- ✅ Service `postgres` avec PostgreSQL 16
- ✅ Service `strapi` qui build depuis `./backend`
- ✅ Volumes pour persistance des données
- ✅ Healthchecks configurés

### 4.2 Vérifier backend/Dockerfile.prod

```bash
cat backend/Dockerfile.prod
```

Vous devriez voir :
- ✅ Multi-stage build (builder + production)
- ✅ Node.js 18 Alpine
- ✅ npm run build
- ✅ Healthcheck

---

## ÉTAPE 5 : Démarrer les Services Docker

### 5.1 Builder et démarrer

```bash
cd /root/blog_strapi

# Builder les images et démarrer les conteneurs
docker-compose -f docker-compose.simple.yml up -d --build
```

Cette commande va :
1. Builder l'image Strapi (5-10 minutes la première fois)
2. Télécharger l'image PostgreSQL
3. Créer les volumes Docker
4. Démarrer PostgreSQL
5. Attendre que PostgreSQL soit prêt (healthcheck)
6. Démarrer Strapi

### 5.2 Suivre les logs

```bash
# Voir tous les logs
docker-compose -f docker-compose.simple.yml logs -f

# Voir seulement les logs Strapi
docker-compose -f docker-compose.simple.yml logs -f strapi

# Voir seulement les logs PostgreSQL
docker-compose -f docker-compose.simple.yml logs -f postgres
```

Attendez de voir dans les logs Strapi :
```
strapi_backend | 
strapi_backend | ┌──────────────────────────────────────────────────┐
strapi_backend | │ Strapi is running                                 │
strapi_backend | │ http://0.0.0.0:1337/admin                        │
strapi_backend | └──────────────────────────────────────────────────┘
```

Appuyez sur Ctrl+C pour sortir des logs (les conteneurs continuent de tourner).

---

## ÉTAPE 6 : Créer le Premier Admin

1. Ouvrir `http://YOUR_VPS_IP:1337/admin`
2. Créer votre compte administrateur
3. Vérifier que le Content-Type Builder affiche vos content-types

---

## ÉTAPE 7 : Configurer les Permissions API

### Via l'interface admin

1. Se connecter à `http://YOUR_VPS_IP:1337/admin`
2. Aller dans **Settings → Users & Permissions Plugin → Roles → Public**
3. Pour chaque content-type (Article, Project, Category, Tag) :
   - Développer le content-type
   - Cocher ✅ **find**
   - Cocher ✅ **findOne**
4. Cliquer sur **Save**

---

## ÉTAPE 8 : Tester l'API

```bash
# Depuis le VPS
curl http://localhost:1337/api/articles
curl http://localhost:1337/api/projects

# Depuis votre machine locale
curl http://YOUR_VPS_IP:1337/api/articles
```

Résultat attendu : `{"data":[],"meta":{...}}`

---

## 📊 Commandes Docker Utiles

### Gestion des conteneurs

```bash
# Voir l'état des conteneurs
docker-compose -f docker-compose.simple.yml ps

# Arrêter les conteneurs
docker-compose -f docker-compose.simple.yml stop

# Démarrer les conteneurs
docker-compose -f docker-compose.simple.yml start

# Redémarrer les conteneurs
docker-compose -f docker-compose.simple.yml restart

# Arrêter et supprimer les conteneurs
docker-compose -f docker-compose.simple.yml down

# Arrêter et supprimer tout (conteneurs + volumes + images)
docker-compose -f docker-compose.simple.yml down -v --rmi all
```

### Logs

```bash
# Logs en temps réel
docker-compose -f docker-compose.simple.yml logs -f

# Dernières 100 lignes
docker-compose -f docker-compose.simple.yml logs --tail=100

# Logs d'un service spécifique
docker-compose -f docker-compose.simple.yml logs -f strapi
```

### Exécuter des commandes dans les conteneurs

```bash
# Shell dans le conteneur Strapi
docker exec -it strapi_backend sh

# Shell dans le conteneur PostgreSQL
docker exec -it strapi_postgres psql -U strapi_admin -d strapi_db

# Voir les fichiers dans Strapi
docker exec strapi_backend ls -la /opt/app/src/api
```

### Backup de la base de données

```bash
# Backup
docker exec strapi_postgres pg_dump -U strapi_admin strapi_db > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20251016.sql | docker exec -i strapi_postgres psql -U strapi_admin -d strapi_db
```

---

## 🔄 Mettre à Jour depuis Git

```bash
# Arrêter les conteneurs
cd /root/blog_strapi
docker-compose -f docker-compose.simple.yml down

# Récupérer les changements
git pull origin master

# Rebuild et redémarrer
docker-compose -f docker-compose.simple.yml up -d --build

# Vérifier les logs
docker-compose -f docker-compose.simple.yml logs -f strapi
```

---

## 🛡️ Configuration Nginx (Optionnel)

Si vous voulez utiliser un nom de domaine et SSL :

### 1. Installer Nginx

```bash
sudo apt install -y nginx
```

### 2. Créer la configuration

```bash
sudo nano /etc/nginx/sites-available/strapi
```

Ajouter :
```nginx
server {
    listen 80;
    server_name yourdomain.com;  # Remplacer

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:1337;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Activer le site

```bash
sudo ln -s /etc/nginx/sites-available/strapi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Installer SSL

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 🔧 Troubleshooting

### Les conteneurs ne démarrent pas

```bash
# Voir les logs d'erreur
docker-compose -f docker-compose.simple.yml logs

# Vérifier l'état
docker-compose -f docker-compose.simple.yml ps

# Rebuild complet
docker-compose -f docker-compose.simple.yml down -v
docker-compose -f docker-compose.simple.yml up -d --build
```

### Strapi ne se connecte pas à PostgreSQL

```bash
# Vérifier que PostgreSQL est prêt
docker-compose -f docker-compose.simple.yml logs postgres

# Vérifier la connexion depuis Strapi
docker exec -it strapi_backend sh
apk add postgresql-client
psql -U strapi_admin -h postgres -d strapi_db
```

### Port 1337 déjà utilisé

```bash
# Trouver le processus qui utilise le port
sudo lsof -i :1337

# Tuer le processus
sudo kill -9 <PID>

# Ou changer le port dans docker-compose.simple.yml
# ports:
#   - "1338:1337"  # Utiliser le port 1338 au lieu de 1337
```

### Content-Types ne s'affichent pas

```bash
# Vérifier qu'ils sont dans le code
docker exec strapi_backend ls -la /opt/app/src/api

# Rebuild
docker-compose -f docker-compose.simple.yml down
docker-compose -f docker-compose.simple.yml up -d --build
```

---

## 📋 Volumes Docker

Les données sont persistées dans des volumes Docker :

| Volume | Contenu | Localisation |
|--------|---------|-------------|
| `postgres_data` | Base de données PostgreSQL | `/var/lib/docker/volumes/` |
| `strapi_uploads` | Fichiers uploadés (images, etc.) | `/var/lib/docker/volumes/` |
| `strapi_cache` | Cache Strapi | `/var/lib/docker/volumes/` |

Pour voir les volumes :
```bash
docker volume ls
docker volume inspect blog_strapi_postgres_data
```

---

## ✅ Checklist de Déploiement

- [ ] Docker et Docker Compose installés
- [ ] Projet cloné depuis Git
- [ ] Fichier `.env` créé avec secrets générés
- [ ] `docker-compose.simple.yml` vérifié
- [ ] `backend/Dockerfile.prod` vérifié
- [ ] `docker-compose up -d --build` exécuté
- [ ] Logs vérifiés (Strapi démarre sans erreur)
- [ ] Premier admin créé
- [ ] Content-Types visibles dans Content-Type Builder
- [ ] Permissions API configurées
- [ ] API testée avec curl
- [ ] Nginx configuré (optionnel)
- [ ] SSL installé (optionnel)

---

## 🎯 Comparaison avec les Autres Méthodes

| Critère | Docker | Git Clone Manuel | Fresh Install |
|---------|--------|------------------|---------------|
| Simplicité | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Vitesse | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Isolation | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| Reproductibilité | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Maintenance | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

---

## 🚀 Résultat Final

Après cette procédure, vous aurez :

- ✅ Strapi en production dans Docker
- ✅ PostgreSQL dans Docker
- ✅ Tous vos content-types fonctionnels
- ✅ Données persistées dans volumes Docker
- ✅ Healthchecks et restart automatique
- ✅ Facile à mettre à jour (`git pull` + `docker-compose up -d --build`)
- ✅ Facile à migrer vers un autre serveur

---

**Cette méthode est recommandée pour la production !**

*Testé avec succès sur Ubuntu 24.04 LTS + Docker 24.0 + Strapi 5.24.1+*
