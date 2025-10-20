# 🚀 Déploiement Production MERN Stack

Production complète avec Frontend + Backend + PostgreSQL + Nginx sur VPS.

## 📦 Architecture

```
Internet (Port 80)
    ↓
Nginx (Reverse Proxy)
    ├─→ Frontend (React) - Container Nginx interne
    ├─→ Backend API (/api/*) - Node.js:3000
    ├─→ Health Check (/health)
    └─→ Uploads (/uploads/*)
            ↓
    Backend MERN (Node.js + Express + Prisma)
            ↓
    PostgreSQL 16 (Database)
```

## 🎯 Services

| Service | Port | Container | Description |
|---------|------|-----------|-------------|
| **Nginx** | 80 | blog-nginx-prod | Reverse proxy principal |
| **Frontend** | - | blog-mern-frontend-prod | React SPA (Nginx interne) |
| **Backend** | 3000 | blog-mern-backend-prod | API REST Node.js |
| **PostgreSQL** | 5432 | blog-postgres-prod | Base de données |

## ✅ Accès

- **Frontend**: http://173.212.208.181
- **API**: http://173.212.208.181/api
- **Health**: http://173.212.208.181/health

## 🚀 Déploiement Rapide

### Option 1: Script automatique (RECOMMANDÉ)

```powershell
.\deploy-quick.ps1
```

Ce script fait TOUT automatiquement:
1. ✅ Transfert des fichiers vers VPS
2. ✅ Build des images Docker (backend + frontend)
3. ✅ Démarrage des services (PostgreSQL + Backend + Frontend + Nginx)
4. ✅ Tests de santé (health + API + frontend)
5. ✅ Ouvre le navigateur

**Durée**: ~5 minutes

### Option 2: Déploiement manuel

```powershell
# 1. Transfert
ssh root@173.212.208.181 "mkdir -p /root/blog_mern_prod"
scp -r backend frontend nginx docker-compose.mern-prod.yml .env.mern.prod root@173.212.208.181:/root/blog_mern_prod/

# 2. Build et démarrage
ssh root@173.212.208.181
cd /root/blog_mern_prod
docker-compose build
docker-compose up -d

# 3. Vérification
docker-compose ps
docker-compose logs -f
```

## 📋 Fichiers de Configuration

### `docker-compose.mern-prod.yml`
Définit les 4 services (PostgreSQL, Backend, Frontend, Nginx) avec:
- Health checks
- Volumes persistants
- Network bridge
- Variables d'environnement

### `nginx/nginx.prod.conf`
Configuration Nginx avec:
- Reverse proxy vers backend:3000 (`/api/*`)
- Reverse proxy vers frontend:80 (`/`)
- Gestion des uploads (`/uploads/*`)
- Security headers
- Gzip compression

### `.env.mern.prod`
Variables d'environnement:
```bash
DB_PASSWORD=BlogSecurePass2024!
JWT_SECRET=...
CORS_ORIGINS=http://173.212.208.181,http://localhost:5173
VITE_API_URL=http://173.212.208.181/api
```

### `frontend/Dockerfile.prod`
Multi-stage build:
1. **Builder**: npm ci + npm build
2. **Production**: Nginx Alpine + build files

## 🔧 Commandes Utiles

### Statut des services
```bash
ssh root@173.212.208.181 'cd /root/blog_mern_prod && docker-compose ps'
```

### Logs en temps réel
```bash
ssh root@173.212.208.181 'cd /root/blog_mern_prod && docker-compose logs -f'
```

### Logs d'un service spécifique
```bash
# Backend
ssh root@173.212.208.181 'cd /root/blog_mern_prod && docker-compose logs -f backend'

# Frontend
ssh root@173.212.208.181 'cd /root/blog_mern_prod && docker-compose logs -f frontend'

# Nginx
ssh root@173.212.208.181 'cd /root/blog_mern_prod && docker-compose logs -f nginx'
```

### Redémarrer un service
```bash
ssh root@173.212.208.181 'cd /root/blog_mern_prod && docker-compose restart backend'
```

### Rebuild après changement de code
```bash
ssh root@173.212.208.181 'cd /root/blog_mern_prod && docker-compose build backend && docker-compose up -d backend'
```

### Arrêter tous les services
```bash
ssh root@173.212.208.181 'cd /root/blog_mern_prod && docker-compose down'
```

### Shell dans un container
```bash
# Backend
ssh root@173.212.208.181 'docker exec -it blog-mern-backend-prod sh'

# PostgreSQL
ssh root@173.212.208.181 'docker exec -it blog-postgres-prod psql -U blog_user -d blog_mern'
```

## 🧪 Tests

### Health Check
```powershell
Invoke-RestMethod http://173.212.208.181/health
```

### API Categories
```powershell
Invoke-RestMethod http://173.212.208.181/api/categories
```

### Frontend
```powershell
Invoke-WebRequest http://173.212.208.181/
```

### Script de test complet
```powershell
.\deploy-mern-prod.ps1 -Test
```

## 📊 Monitoring

### Ressources utilisées
```bash
ssh root@173.212.208.181 'docker stats --no-stream'
```

### Espace disque
```bash
ssh root@173.212.208.181 'df -h'
ssh root@173.212.208.181 'docker system df'
```

### Containers en cours
```bash
ssh root@173.212.208.181 'docker ps -a'
```

## 🔒 Sécurité

- ✅ JWT tokens avec expiration (15m access, 7d refresh)
- ✅ Passwords bcrypt hashés
- ✅ CORS configuré
- ✅ Security headers (X-Frame-Options, X-XSS-Protection)
- ✅ PostgreSQL non exposé publiquement (network interne)
- ⚠️ HTTP seulement (ajouter HTTPS avec Let's Encrypt plus tard)

## 🐛 Troubleshooting

### Backend ne démarre pas
```bash
# Vérifier les logs
ssh root@173.212.208.181 'cd /root/blog_mern_prod && docker-compose logs backend'

# Vérifier la DB
ssh root@173.212.208.181 'cd /root/blog_mern_prod && docker-compose logs postgres'
```

### Frontend affiche une page blanche
```bash
# Vérifier le build
ssh root@173.212.208.181 'docker exec -it blog-mern-frontend-prod ls -la /usr/share/nginx/html'

# Vérifier Nginx logs
ssh root@173.212.208.181 'cd /root/blog_mern_prod && docker-compose logs nginx'
```

### Erreurs CORS
```bash
# Vérifier CORS_ORIGINS dans .env
ssh root@173.212.208.181 'cat /root/blog_mern_prod/.env | grep CORS'

# Redémarrer backend après modification
ssh root@173.212.208.181 'cd /root/blog_mern_prod && docker-compose restart backend'
```

### Migration Prisma nécessaire
```bash
ssh root@173.212.208.181 'docker exec -it blog-mern-backend-prod npx prisma migrate deploy'
```

## 📝 Notes

- Les volumes PostgreSQL et uploads sont persistants
- Les logs Nginx sont dans `/var/log/nginx/` du container
- Le frontend est rebuildé à chaque déploiement
- Les migrations Prisma sont automatiques au démarrage du backend

## 🔄 Mise à jour

Pour mettre à jour le code:

1. Modifier le code localement
2. Relancer `.\deploy-quick.ps1`
3. Le script rebuild automatiquement les images
4. Les containers sont recréés avec le nouveau code

## 📚 Prochaines étapes

- [ ] Configurer HTTPS avec Let's Encrypt
- [ ] Ajouter monitoring (Prometheus/Grafana)
- [ ] Configurer backups PostgreSQL automatiques
- [ ] Ajouter CI/CD (GitHub Actions)
- [ ] Rate limiting sur l'API
- [ ] Logs centralisés (ELK stack)
