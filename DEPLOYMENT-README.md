# 🚀 Guide de Déploiement Strapi Blog

Ce projet contient un blog Strapi avec plusieurs méthodes de déploiement testées et validées.

---

## 📚 Méthodes de Déploiement Disponibles

Nous avons testé **3 méthodes principales** pour déployer ce projet Strapi sur un VPS Ubuntu.

### 🐳 **Méthode 1 : Docker Simple** (⭐ **RECOMMANDÉE pour Production**)

**Fichier** : [`DEPLOYMENT-DOCKER-SIMPLE.md`](./DEPLOYMENT-DOCKER-SIMPLE.md)

✅ **Avantages** :
- Installation en **une seule commande** : `docker-compose up -d --build`
- **Isolation complète** : Pas de conflit avec autres services
- **Reproductible** : Fonctionne partout de la même manière
- **Production-ready** : Healthchecks, restart automatique
- **Facile à mettre à jour** : `git pull` + rebuild

❌ **Inconvénients** :
- Nécessite Docker (mais c'est un standard aujourd'hui)
- Build initial plus long (~5-10 min)

👉 **Utilisez cette méthode si** : Vous voulez une installation **simple, propre et maintenable**

---

### 📦 **Méthode 2 : Git Clone Manuel**

**Fichier** : [`DEPLOYMENT-GIT-CLONE-WORKING.md`](./DEPLOYMENT-GIT-CLONE-WORKING.md)

✅ **Avantages** :
- Utilise directement le code du repository Git
- Tous les fichiers (routes, controllers, services) sont présents
- **Installation native** sans Docker
- Démarrage rapide après installation

❌ **Inconvénients** :
- Configuration manuelle requise (PostgreSQL, PM2, etc.)
- Dépendances système à installer manuellement
- Nécessite plusieurs étapes

👉 **Utilisez cette méthode si** : Vous préférez une installation **native sans Docker**

---

### 🆕 **Méthode 3 : Fresh Install + Import**

**Fichier** : [`DEPLOYMENT-FRESH-INSTALL-PRESERVE-DATA.md`](./DEPLOYMENT-FRESH-INSTALL-PRESERVE-DATA.md)

✅ **Avantages** :
- Base de données propre garantie
- Résout les problèmes de permissions corrompues
- Utile si votre installation existante est cassée

❌ **Inconvénients** :
- Plus longue (création nouveau projet + copie fichiers)
- Risque de conflits lors de la copie
- Nécessite plusieurs étapes manuelles

👉 **Utilisez cette méthode si** : Votre installation est **cassée** et vous voulez **repartir de zéro**

---

## 🎯 Quelle Méthode Choisir ?

| Situation | Méthode Recommandée |
|-----------|-------------------|
| 🆕 **Nouveau déploiement** sur VPS vierge | **Docker Simple** |
| 🔄 **Re-déploiement** après problèmes | **Docker Simple** |
| 🐧 Préférence pour installation **native Linux** | **Git Clone Manuel** |
| 🛠️ Installation **cassée**, besoin de repartir de zéro | **Fresh Install + Import** |
| 🚀 **Production** avec maintenance facile | **Docker Simple** |
| 📊 Besoin de **performances maximales** | **Git Clone Manuel** (sans overhead Docker) |

---

## 📋 Structure du Projet

```
blog_strapi/
├── backend/                          # Code Strapi
│   ├── src/
│   │   ├── api/                      # Content-Types
│   │   │   ├── article/              # Articles du blog
│   │   │   ├── project/              # Portfolio de projets
│   │   │   ├── category/             # Catégories
│   │   │   └── tag/                  # Tags
│   │   ├── components/               # Composants réutilisables
│   │   └── middlewares/              # Middlewares custom
│   ├── config/                       # Configuration Strapi
│   ├── Dockerfile.prod               # Dockerfile pour production
│   └── package.json
│
├── frontend/                         # Frontend (React/Next.js)
│   └── ...
│
├── nginx/                            # Configuration Nginx
│
├── docker-compose.simple.yml         # Docker Compose simplifié
├── docker-compose.prod.yml           # Docker Compose production complète
│
├── DEPLOYMENT-DOCKER-SIMPLE.md       # 🐳 Guide Docker (RECOMMANDÉ)
├── DEPLOYMENT-GIT-CLONE-WORKING.md   # 📦 Guide installation native
├── DEPLOYMENT-FRESH-INSTALL-PRESERVE-DATA.md  # 🆕 Guide fresh install
│
└── README.md                         # Ce fichier
```

---

## 🛠️ Content-Types Disponibles

Ce projet Strapi contient les content-types suivants :

| Content-Type | Description | Relations |
|--------------|-------------|-----------|
| **Article** | Articles de blog | → Categories, Tags, Author |
| **Project** | Projets du portfolio | → Categories, Tags |
| **Category** | Catégories | ← Articles, Projects |
| **Tag** | Tags | ← Articles, Projects |
| **User** | Utilisateurs (défaut Strapi) | ← Articles (author) |

---

## ⚙️ Configuration Requise

### Serveur (VPS)

- **OS** : Ubuntu 22.04 LTS ou 24.04 LTS
- **RAM** : Minimum 2 GB (4 GB recommandé)
- **CPU** : 1 vCPU minimum (2 vCPU recommandé)
- **Disque** : 20 GB minimum
- **Accès** : Root ou sudo

### Logiciels

#### Pour Docker :
- Docker 20.10+
- Docker Compose 2.0+

#### Pour Installation Native :
- Node.js 18.x
- PostgreSQL 12+
- PM2 (pour production)
- Nginx (optionnel, pour reverse proxy)

---

## 🚀 Démarrage Rapide (Docker)

```bash
# 1. Cloner le projet
git clone https://github.com/boujrafh/blog_strapi.git
cd blog_strapi

# 2. Créer le fichier .env avec vos secrets
nano .env
# Ajouter APP_KEYS, API_TOKEN_SALT, etc.

# 3. Démarrer avec Docker Compose
docker-compose -f docker-compose.simple.yml up -d --build

# 4. Suivre les logs
docker-compose -f docker-compose.simple.yml logs -f

# 5. Ouvrir http://YOUR_IP:1337/admin et créer le premier admin
```

➡️ **Guide complet** : [DEPLOYMENT-DOCKER-SIMPLE.md](./DEPLOYMENT-DOCKER-SIMPLE.md)

---

## 🚀 Démarrage Rapide (Installation Native)

```bash
# 1. Installer Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Installer PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 3. Créer la base de données
sudo -u postgres psql
CREATE USER strapi_admin WITH PASSWORD 'Password123!';
CREATE DATABASE strapi_db OWNER strapi_admin;
ALTER USER strapi_admin WITH SUPERUSER;
\q

# 4. Cloner et configurer
git clone https://github.com/boujrafh/blog_strapi.git
cd blog_strapi/backend
nano .env  # Configurer les variables

# 5. Installer et builder
npm install
npm run build

# 6. Démarrer en production
sudo npm install -g pm2
pm2 start npm --name "strapi" -- run start
```

➡️ **Guide complet** : [DEPLOYMENT-GIT-CLONE-WORKING.md](./DEPLOYMENT-GIT-CLONE-WORKING.md)

---

## 🔧 Configuration Post-Installation

### 1. Créer le Premier Admin

1. Ouvrir `http://YOUR_IP:1337/admin`
2. Remplir le formulaire de création de compte
3. Se connecter

### 2. Vérifier les Content-Types

1. Aller dans **Content-Type Builder**
2. Vérifier que vous voyez :
   - ✅ Article
   - ✅ Project
   - ✅ Category
   - ✅ Tag

### 3. Configurer les Permissions API

Pour permettre l'accès public à l'API :

1. **Settings → Users & Permissions Plugin → Roles → Public**
2. Pour chaque content-type :
   - Cocher ✅ `find` (liste)
   - Cocher ✅ `findOne` (détail)
3. **Save**

### 4. Tester l'API

```bash
curl http://YOUR_IP:1337/api/articles
curl http://YOUR_IP:1337/api/projects
curl http://YOUR_IP:1337/api/categories
curl http://YOUR_IP:1337/api/tags
```

Résultat attendu : `{"data":[],"meta":{...}}`

---

## 📖 Documentation Additionnelle

- [`STRAPI_CONFIG.md`](./STRAPI_CONFIG.md) - Configuration détaillée de Strapi
- [`N8N_STRAPI_INTEGRATION.md`](./N8N_STRAPI_INTEGRATION.md) - Intégration avec n8n
- [`TANSTACK_QUERY_GUIDE.md`](./TANSTACK_QUERY_GUIDE.md) - Guide TanStack Query
- [`configure-strapi-permissions.md`](./configure-strapi-permissions.md) - Permissions détaillées

---

## 🔄 Mises à Jour

### Avec Docker

```bash
cd /root/blog_strapi
git pull origin master
docker-compose -f docker-compose.simple.yml up -d --build
```

### Installation Native

```bash
cd /root/blog_strapi
git pull origin master
cd backend
npm install
npm run build
pm2 restart strapi
```

---

## 🛡️ Sécurité en Production

### Secrets à Changer

⚠️ **IMPORTANT** : Changez ces valeurs avant de déployer en production :

```env
APP_KEYS=<génerer_avec_openssl>
API_TOKEN_SALT=<génerer_avec_openssl>
ADMIN_JWT_SECRET=<génerer_avec_openssl>
TRANSFER_TOKEN_SALT=<génerer_avec_openssl>
JWT_SECRET=<génerer_avec_openssl>
```

Générer des secrets sécurisés :
```bash
openssl rand -base64 32
```

### Autres Recommandations

- ✅ Utiliser HTTPS (Let's Encrypt)
- ✅ Configurer un firewall (ufw)
- ✅ Limiter l'accès SSH (clés SSH uniquement)
- ✅ Mettre à jour régulièrement
- ✅ Backup automatique de la base de données
- ✅ Monitoring (Uptime Robot, etc.)

---

## 🐛 Troubleshooting

### Problème : "Cannot read properties of undefined (reading 'filter')"

**Solution** : C'est un problème de permissions dans la base de données.

➡️ Voir [`DEPLOYMENT-FRESH-INSTALL-PRESERVE-DATA.md`](./DEPLOYMENT-FRESH-INSTALL-PRESERVE-DATA.md)

### Problème : "Cannot send secure cookie over unencrypted connection"

**Solution** : Créer `config/admin.ts` avec `secure: false`.

```typescript
export default ({ env }) => ({
  auth: {
    sessions: {
      cookie: {
        secure: false,
      },
    },
  },
});
```

### Problème : Content-Types ne s'affichent pas

**Solution** : Rebuild complet

```bash
# Docker
docker-compose down -v
docker-compose up -d --build

# Native
rm -rf .cache dist build
npm run build
```

### Problème : API retourne 403 Forbidden

**Solution** : Configurer les permissions dans Settings → Users & Permissions → Public

---

## 📞 Support

- **GitHub Issues** : [https://github.com/boujrafh/blog_strapi/issues](https://github.com/boujrafh/blog_strapi/issues)
- **Strapi Documentation** : [https://docs.strapi.io](https://docs.strapi.io)

---

## 📝 Changelog

### Version 2.0 - 2025-10-16
- ✅ Ajout méthode Docker Simple (recommandée)
- ✅ Guide Git Clone amélioré et testé
- ✅ Documentation complète de toutes les méthodes
- ✅ Résolution de tous les problèmes de déploiement

### Version 1.0 - 2025-09
- ✅ Initial release
- ✅ Content-Types : Article, Project, Category, Tag

---

## 📄 License

MIT

---

**Bon déploiement ! 🚀**
