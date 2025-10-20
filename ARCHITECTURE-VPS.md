# 🎯 Configuration VPS - Architecture Simple

## Architecture Actuelle (QUI FONCTIONNE)

```
Internet
  │
  ├─→ https://blog.bh-systems.be (nginx port 443)
  │   └─→ Frontend (React Router) - Port interne 3000
  │       └─→ API calls → http://strapi:1337 (réseau Docker interne)
  │
  └─→ http://173.212.208.181:1337 (Strapi direct)
      └─→ Admin Strapi accessible directement pour configuration
```

## ✅ Ce qui est CORRECT

1. **Frontend** : Accessible uniquement via nginx (HTTPS)
   - URL publique : https://blog.bh-systems.be
   - Port 3000 : NON exposé (interne Docker uniquement)
   
2. **Backend Strapi** : Port 1337 exposé TEMPORAIREMENT
   - Admin direct : http://173.212.208.181:1337/admin
   - API via nginx : https://blog.bh-systems.be/api/
   - Communication interne : Frontend → `http://strapi:1337`

3. **Nginx** : Reverse proxy HTTPS
   - Port 443 : HTTPS avec Let's Encrypt
   - Port 80 : Redirect vers HTTPS

## ❌ ERREUR : Vous utilisez le mauvais fichier Docker Compose

### Sur le VPS, vous avez exécuté :
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### ❌ Problème : `docker-compose.prod.yml`
- Essaie de monter des certificats SSL qui n'existent pas
- Configuration complexe inutile
- Nginx crash en boucle

### ✅ Solution : Utiliser `docker-compose.yml`
```bash
docker compose up -d
```

## 🚀 Déploiement Correct

### Option 1 : Script PowerShell (Recommandé)

Sur votre machine Windows :
```powershell
.\deploy-simple-vps.ps1
```

### Option 2 : Manuel sur le VPS

Connexion SSH :
```bash
ssh root@173.212.208.181
```

Commandes sur le VPS :
```bash
cd /root/blog_strapi

# Git pull
git pull origin master

# Arrêter les containers actuels
docker compose down

# Démarrer avec le BON fichier (docker-compose.yml)
docker compose up -d

# Vérifier l'état
docker compose ps
```

## 📋 Vérification

### 1. Vérifier que les containers sont UP

```bash
docker compose ps
```

Résultat attendu :
```
NAME                 STATUS              PORTS
blog-nginx           Up (healthy)        0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
blog-strapi          Up (healthy)        0.0.0.0:1337->1337/tcp
blog-frontend        Up                  (internal only)
blog-redis           Up (healthy)        (internal only)
```

### 2. Tester HTTPS Frontend

```bash
curl -I https://blog.bh-systems.be/
```

Résultat attendu : `HTTP/2 200 OK`

### 3. Tester Backend Direct

```bash
curl -I http://173.212.208.181:1337/admin
```

Résultat attendu : `HTTP/1.1 200 OK`

## ⚙️ Configuration Strapi (OBLIGATOIRE)

Une fois les containers UP :

1. **Ouvrir dans navigateur** : http://173.212.208.181:1337/admin

2. **Créer super admin** :
   - Firstname : Votre prénom
   - Lastname : Votre nom
   - Email : Votre email
   - Password : Mot de passe sécurisé

3. **Configurer permissions publiques** :
   - Settings → Users & Permissions Plugin → Roles → Public
   - Cocher pour Article : `find` ✅ `findOne` ✅
   - Cocher pour Project : `find` ✅ `findOne` ✅
   - Cocher pour Category : `find` ✅ `findOne` ✅
   - Cocher pour Tag : `find` ✅ `findOne` ✅
   - Cocher pour Upload : `find` ✅ `findOne` ✅
   - Cliquer **Save**

4. **Tester l'API** :
   ```bash
   curl -I https://blog.bh-systems.be/api/articles
   ```
   Résultat attendu : `HTTP/2 200 OK` (au lieu de 500)

## 🔒 Sécurité Post-Configuration (OPTIONNEL)

Une fois que tout fonctionne et que les permissions sont configurées, vous pouvez désactiver le port 1337 :

1. Éditer `docker-compose.yml` :
   ```yaml
   strapi:
     # ports:  # DÉSACTIVÉ - Admin accessible uniquement via nginx
     #   - "1337:1337"
   ```

2. Redéployer :
   ```bash
   docker compose down
   docker compose up -d
   ```

3. Admin accessible uniquement via :
   ```
   https://blog.bh-systems.be/admin
   ```

## 📊 Fichiers Docker Compose

### ✅ `docker-compose.yml` - À UTILISER
- Configuration complète et fonctionnelle
- Port 1337 exposé temporairement
- Nginx avec SSL Let's Encrypt
- SQLite comme base de données

### ❌ `docker-compose.prod.yml` - NE PAS UTILISER
- Configuration incomplète
- Problèmes de montage SSL
- Nginx crash en boucle

## 🛠️ Résolution de Problèmes

### Nginx crash avec erreur SSL

**Erreur** :
```
nginx: [emerg] cannot load certificate "/etc/letsencrypt/live/blog.bh-systems.be/fullchain.pem"
```

**Cause** : Vous utilisez `docker-compose.prod.yml`

**Solution** : Utiliser `docker-compose.yml` :
```bash
docker compose down
docker compose up -d
```

### Erreurs 500 "Forbidden access"

**Cause** : Permissions Strapi non configurées

**Solution** : Suivre la section "Configuration Strapi" ci-dessus

### Frontend ne charge pas

**Vérifier nginx** :
```bash
docker compose logs blog-nginx
```

**Vérifier frontend** :
```bash
docker compose logs blog-frontend
```

## 📁 Structure Réseau Docker

```yaml
blog-network (interne)
  ├── nginx (blog-nginx)
  │   └── Ports publics: 80, 443
  │
  ├── strapi (blog-strapi)
  │   └── Port public: 1337 (temporaire)
  │   └── Port interne: 1337
  │
  ├── frontend (blog-frontend)
  │   └── Port interne: 3000 (NON exposé)
  │
  └── redis (blog-redis)
      └── Port interne: 6379 (NON exposé)
```

Communication interne :
- Frontend → Backend : `http://strapi:1337`
- Nginx → Frontend : `http://frontend:3000`
- Nginx → Backend : `http://strapi:1337`
- Backend → Redis : `redis://redis:6379`

## 🎯 Résumé

**URLs Finales** :
- Frontend public : https://blog.bh-systems.be
- Admin direct : http://173.212.208.181:1337/admin (temporaire)
- API publique : https://blog.bh-systems.be/api/

**Commande de déploiement** :
```bash
cd /root/blog_strapi && git pull && docker compose up -d
```

**Fichier utilisé** : `docker-compose.yml` (PAS `.prod.yml`)

**Action requise** : Configurer les permissions Strapi via l'interface admin
