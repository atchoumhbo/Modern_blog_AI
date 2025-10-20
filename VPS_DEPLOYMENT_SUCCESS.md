# 🚀 Déploiement VPS Réussi !

## ✅ Statut du Déploiement

**Date**: 9 Octobre 2025  
**VPS**: 173.212.208.181 (Ubuntu)  
**Statut**: **TOUS LES SERVICES OPÉRATIONNELS** 🎉

---

## 📊 Services Actifs

| Service | Container | Status | Port | Health |
|---------|-----------|---------|------|--------|
| **Frontend React** | blog-frontend | ✅ Running | 3000 | ✅ Healthy |
| **Backend Strapi** | blog-strapi | ✅ Running | 1337 | ✅ Healthy |
| **Nginx Reverse Proxy** | blog-nginx | ✅ Running | 80, 443 | ✅ Healthy |
| **PostgreSQL** | blog-postgres | ✅ Running | 5432 | ✅ Healthy |
| **Redis** | blog-redis | ✅ Running | 6379 | ✅ Healthy |

---

## 🌐 URLs d'Accès

### HTTP (Actuel - Sans SSL)
- **Site Frontend**: http://173.212.208.181/
- **Admin Strapi**: http://173.212.208.181/admin
- **API Strapi**: http://173.212.208.181/api/
- **Health Check**: http://173.212.208.181/health

### HTTPS (À Configurer)
- **Domaine Cible**: https://blog.bh-systems.be
- **Certificat SSL**: Let's Encrypt (à installer)

---

## 🔧 Problèmes Résolus

### 1. **TypeScript Config Loading** ❌ → ✅
**Erreur initiale**: 
```
Config file not loaded, extension must be one of .js,.json): database.ts
```

**Cause**: ts-node installé comme devDependency (-D), non copié au stage production

**Solution**: 
```dockerfile
# backend/Dockerfile ligne 26
RUN npm install ts-node @types/node pg
```
**Commit**: `70cd624` - "fix: Installer ts-node en prod pour charger config .ts sur VPS"

---

### 2. **Driver PostgreSQL Manquant** ❌ → ✅
**Erreur**:
```
Cannot find module 'pg'
Require stack: /opt/app/node_modules/knex/lib/dialects/postgres/index.js
```

**Cause**: Module `pg` absent des dépendances production

**Solution**:
```dockerfile
# backend/Dockerfile ligne 26
RUN npm install ts-node @types/node pg
```
**Commit**: `467495e` - "fix: Ajouter pg (PostgreSQL driver) en prod pour VPS"

---

### 3. **Nginx Configuration Invalide** ❌ → ✅
**Erreur**:
```
nginx: [emerg] "server" directive is not allowed here in /etc/nginx/nginx.conf:2
```

**Cause**: Bloc `server` sans enveloppe `http { }`

**Solution**: Créé `nginx-dev.conf` avec structure complète :
```nginx
http {
    server {
        listen 80;
        server_name _;
        
        location / {
            proxy_pass http://frontend:3000;
        }
        # ... autres locations
    }
}
```
**Commit**: `ab6eb2d` - "fix: Config nginx HTTP simple pour VPS (sans SSL)"

---

### 4. **Certificats SSL Manquants** ❌ → ✅
**Erreur**:
```
cannot load certificate "/etc/letsencrypt/live/blog.bh-systems.be/fullchain.pem"
```

**Cause**: Certificats Let's Encrypt non configurés sur VPS

**Solution Temporaire**: Utilisation de `nginx-dev.conf` (HTTP sans SSL)  
**Solution Permanente**: Installer Let's Encrypt avec Certbot (voir section suivante)

---

## 🔒 Prochaines Étapes - SSL/HTTPS

### Installer Certbot et Générer Certificats

```bash
# SSH au VPS
ssh root@173.212.208.181

# Installer Certbot
apt update
apt install -y certbot python3-certbot-nginx

# Générer certificat
certbot certonly --standalone -d blog.bh-systems.be

# Vérifier certificats
ls -la /etc/letsencrypt/live/blog.bh-systems.be/

# Copier les certificats dans le projet
mkdir -p /root/blog_strapi/nginx/ssl
cp /etc/letsencrypt/live/blog.bh-systems.be/fullchain.pem \
   /root/blog_strapi/nginx/ssl/
cp /etc/letsencrypt/live/blog.bh-systems.be/privkey.pem \
   /root/blog_strapi/nginx/ssl/

# Remplacer nginx.conf par la version HTTPS
cd /root/blog_strapi
git pull origin master  # Récupérer nginx.conf avec HTTPS
cp nginx/nginx.conf nginx/nginx.conf.bak  # Backup
# Éditer nginx/nginx.conf pour pointer vers /etc/nginx/ssl/
docker-compose restart nginx
```

### Renouvellement Automatique SSL

```bash
# Ajouter cron job
crontab -e

# Ajouter cette ligne (renouvellement tous les lundis à 3h du matin)
0 3 * * 1 certbot renew --quiet && docker-compose -f /root/blog_strapi/docker-compose.yml restart nginx
```

---

## 📁 Architecture Multi-Stage Docker

### Frontend (`frontend/Dockerfile`)
```
Stage 1: BUILD (dependencies + npm run build)
Stage 2: PRODUCTION (copies build + node_modules)
```

### Backend (`backend/Dockerfile`)
```
Stage 1: BUILD
  - Installe toutes dépendances (npm install)
  - Installe ts-node, pg en PROD (pas -D)
  - Compile TypeScript (npm run build)

Stage 2: PRODUCTION
  - Copie node_modules depuis BUILD ✅
  - Copie dist/, src/, config/ ✅
  - Lance: npm start (Strapi en mode production)
```

**Important**: Multi-stage build copie **UNIQUEMENT** les dépendances production (node_modules sans devDependencies) SAUF si installées explicitement dans BUILD sans `-D`.

---

## 📝 Fichiers de Configuration Modifiés

### 1. `backend/Dockerfile`
```diff
- RUN npm install -D ts-node @types/node
+ RUN npm install ts-node @types/node pg
```

### 2. `nginx/nginx-dev.conf` (Créé)
Structure complète avec `http { server { } }`

### 3. `docker-compose.yml`
```diff
- ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
+ ./nginx/nginx-dev.conf:/etc/nginx/nginx.conf:ro
```

---

## 🎯 Commandes Utiles VPS

### Monitoring
```bash
# Status des containers
docker-compose ps

# Logs en temps réel
docker-compose logs -f

# Logs spécifiques
docker-compose logs strapi --tail=100
docker-compose logs nginx --tail=50

# Health checks
curl http://localhost/health
curl http://localhost:1337/_health
```

### Déploiement
```bash
# Pull + Rebuild + Redémarrage
cd /root/blog_strapi
git pull origin master
docker-compose down
docker-compose up -d --build

# Redémarrage simple
docker-compose restart

# Redémarrage service spécifique
docker-compose restart nginx
docker-compose restart strapi
```

### Nettoyage
```bash
# Supprimer images inutilisées
docker system prune -a --volumes

# Supprimer tout et reconstruire
docker-compose down --volumes --rmi all
docker-compose up -d --build
```

---

## 🏗️ Build Times Observés

| Service | Build Time | Note |
|---------|------------|------|
| Frontend | ~32s | Build React + Vite |
| Backend (Strapi) | ~100s | npm install (1448 packages) + Strapi admin build |
| Production Stages | ~900s | chown permissions (slow on VPS) |

**Total Deployment**: ~20 minutes (première fois)  
**Redéploiement**: ~5 minutes (avec cache Docker)

---

## ✅ Checklist Validation

- [x] Docker local fonctionne (Footer EUC365/IONOS visible)
- [x] Environnements séparés (.env.development, .env.docker, .env.production)
- [x] Scripts PowerShell (check-vps.ps1, deploy-vps.ps1)
- [x] VPS accessible via SSH
- [x] Projet cloné sur VPS (/root/blog_strapi)
- [x] PostgreSQL driver `pg` installé
- [x] ts-node en production (config .ts loadable)
- [x] Nginx HTTP fonctionnel
- [x] Tous containers healthy
- [x] Site accessible via http://173.212.208.181/
- [ ] SSL/HTTPS configuré (À faire)
- [ ] Domaine blog.bh-systems.be pointé vers VPS
- [ ] Certificat Let's Encrypt installé
- [ ] Renouvellement automatique SSL

---

## 🎉 Résultat Final

**DÉPLOIEMENT VPS RÉUSSI !** 🚀

```bash
NAME            IMAGE                  STATUS
blog-frontend   blog_strapi-frontend   Up 12 minutes (healthy)
blog-nginx      nginx:alpine           Up About a minute (healthy)
blog-postgres   postgres:15-alpine     Up 12 minutes (healthy)
blog-redis      redis:7-alpine         Up 12 minutes (healthy)
blog-strapi     blog_strapi-strapi     Up 12 minutes (healthy)
```

### Accès Public
http://173.212.208.181/ ✅ **200 OK**

---

## 👨‍💻 Crédits

**Développeur**: Copilot + Utilisateur  
**VPS**: 173.212.208.181 (Ubuntu)  
**Stack**: React + Strapi v5 + PostgreSQL + Redis + Nginx  
**Conteneurisation**: Docker + Docker Compose  
**Déploiement**: PowerShell automation scripts

---

**Date de Génération**: 9 Octobre 2025 16:50 CET
