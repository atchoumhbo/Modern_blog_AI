# 🚀 Déploiement MERN Production via Git

## ✅ Avantages de cette méthode

- **Simple** : `git push` + `.\deploy-git-vps.ps1` = déploiement automatique
- **Rapide** : Seulement les fichiers modifiés sont transférés
- **Fiable** : Docker gère la compilation et les dépendances
- **Traçable** : Historique Git complet des déploiements

## 📋 Architecture Actuelle

```
┌─────────────────────────────────────────────────────────┐
│            VPS 173.212.208.181                          │
│                                                         │
│  ┌─────────────────┐      ┌──────────────────┐        │
│  │  PostgreSQL 16  │◄─────┤  Backend MERN    │        │
│  │  blog_mern      │      │  Node.js + Prisma│        │
│  │  Port: 5432     │      │  Port: 3001      │        │
│  └─────────────────┘      └──────────────────┘        │
│                                   ▲                     │
└───────────────────────────────────┼─────────────────────┘
                                    │
                            http://173.212.208.181:3001
```

## 🔧 Configuration

### Backend
- **URL** : http://173.212.208.181:3001
- **Health** : http://173.212.208.181:3001/health
- **API** : http://173.212.208.181:3001/api
- **Credentials** : boujraf.hicham@gmail.com / Admin123!

### Base de données
- **Type** : PostgreSQL 16
- **Database** : blog_mern
- **User** : blog_user
- **Tables** : 11 (users, articles, categories, tags, projects, etc.)

## 📝 Procédure de Déploiement

### 1. Développement Local

```powershell
# Modifier le code
cd C:\Devops\blog_strapi

# Tester localement si besoin
npm test
```

### 2. Commit & Push

```powershell
git add .
git commit -m "feat: Add new feature"
git push origin master
```

### 3. Déploiement sur VPS

```powershell
# Déployer le backend uniquement
.\deploy-git-vps.ps1

# OU déployer le stack complet (backend + frontend + nginx)
.\deploy-full-stack.ps1
```

### 4. Initialisation DB (première fois seulement)

```powershell
# Exécuter les migrations et seed
.\init-db-prod.ps1
```

## 🛠️ Scripts Disponibles

| Script | Description |
|--------|-------------|
| `deploy-git-vps.ps1` | Déploie le backend via Git (3001) |
| `deploy-full-stack.ps1` | Déploie backend + frontend + nginx (80) |
| `init-db-prod.ps1` | Migrations + seed des données |

## 📊 Tests

```powershell
# Health check
Invoke-RestMethod http://173.212.208.181:3001/health

# Catégories
Invoke-RestMethod http://173.212.208.181:3001/api/categories

# Articles
Invoke-RestMethod http://173.212.208.181:3001/api/articles

# Tags
Invoke-RestMethod http://173.212.208.181:3001/api/tags

# Projects
Invoke-RestMethod http://173.212.208.181:3001/api/projects
```

## 🐛 Dépannage

### Voir les logs

```powershell
# Backend MERN
ssh root@173.212.208.181 "docker logs -f blog-mern-backend-prod"

# PostgreSQL
ssh root@173.212.208.181 "docker logs -f blog-postgres-prod"

# Tous les containers
ssh root@173.212.208.181 "docker-compose -f /root/blog_strapi/docker-compose.mern-prod.yml logs -f"
```

### Redémarrer les services

```powershell
# Redémarrer le backend
ssh root@173.212.208.181 "cd /root/blog_strapi && docker-compose -f docker-compose.mern-prod.yml restart backend"

# Redémarrer tout
ssh root@173.212.208.181 "cd /root/blog_strapi && docker-compose -f docker-compose.mern-prod.yml restart"

# Arrêter tout
ssh root@173.212.208.181 "cd /root/blog_strapi && docker-compose -f docker-compose.mern-prod.yml down"

# Démarrer tout
ssh root@173.212.208.181 "cd /root/blog_strapi && docker-compose -f docker-compose.mern-prod.yml up -d"
```

### Reset complet de la DB

```powershell
ssh root@173.212.208.181 @"
cd /root/blog_strapi
docker-compose -f docker-compose.mern-prod.yml down -v
docker-compose -f docker-compose.mern-prod.yml up -d
"@

# Attendre 10s puis réinitialiser
Start-Sleep -Seconds 10
.\init-db-prod.ps1
```

## 📦 Données Seed

### Admin
- **Email** : boujraf.hicham@gmail.com
- **Password** : Admin123!

### Catégories (4)
- DevOps
- Development
- Technology
- Tutorial

### Tags (7)
- TypeScript
- React
- Node.js
- PostgreSQL
- Docker
- API
- Backend

### Articles (1)
- "Getting Started with Modern Blog Leader"

### Projects (1)
- "Modern Blog Leader Platform" (COMPLETED)

## 🔄 Workflow Complet

```
Local Dev → Git Commit → Git Push → VPS Git Pull → Docker Build → Container Start → Tests
```

## 📈 Prochaines Étapes

- [ ] Configurer Frontend React (port 8080)
- [ ] Ajouter Nginx reverse proxy (port 80)
- [ ] Configurer HTTPS avec Let's Encrypt
- [ ] Configurer domaine blog.bh-systems.be
- [ ] Intégrer N8N workflows
- [ ] Ajouter CI/CD avec GitHub Actions

## ✅ Statut Actuel

- ✅ Backend MERN déployé (port 3001)
- ✅ PostgreSQL configuré
- ✅ Migrations Prisma exécutées
- ✅ Données seed insérées
- ✅ Tous les endpoints CRUD fonctionnels
- ✅ Déploiement via Git opérationnel
- ⏳ Frontend en cours
- ⏳ Nginx en cours
- ⏳ HTTPS en attente
