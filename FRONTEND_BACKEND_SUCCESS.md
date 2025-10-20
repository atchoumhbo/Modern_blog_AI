# ✅ Frontend ↔ Backend MERN Configuration - SUCCESS

## 🎯 Configuration Actuelle

### Backend MERN - VPS Production
- **URL**: http://173.212.208.181:3000
- **API**: http://173.212.208.181:3000/api
- **Status**: ✅ ONLINE
- **Base de données**: PostgreSQL 16.10 (blog_mern)
- **Tables**: 11 tables créées
- **Seed data**: Admin + échantillons insérés

### Frontend - React Router v7
- **URL Dev**: http://localhost:5173
- **Backend Type**: MERN
- **API URL**: http://173.212.208.181:3000/api
- **Status**: ✅ RUNNING

### Credentials Admin
```
Email: boujraf.hicham@gmail.com
Password: Admin123!
```

## 📊 Tests Réalisés

### ✅ Backend VPS Health Check
```bash
GET http://173.212.208.181:3000/health
Response: {"status":"ok"}
```

### ✅ Backend VPS Login
```bash
POST http://173.212.208.181:3000/api/auth/login
Response: {
  "user": {...},
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "..."
}
```

### ✅ Endpoints Authentifiés
- **Articles**: GET /api/articles → 0 items (TODO: stubs à implémenter)
- **Categories**: GET /api/categories → 0 items (TODO: stubs à implémenter)
- **Tags**: GET /api/tags → 0 items (TODO: stubs à implémenter)
- **Projects**: GET /api/projects → 0 items (TODO: stubs à implémenter)

**Note**: Les endpoints retournent 0 items car les contrôleurs sont encore des stubs TODO. Les données seed existent en base mais ne sont pas récupérées pour l'instant.

## 🔧 Configuration Frontend

### .env.local
```bash
# Backend type: 'strapi' ou 'mern'
VITE_BACKEND_TYPE=mern

# URL du backend MERN (VPS Production)
VITE_API_URL=http://173.212.208.181:3000/api
VITE_STRAPI_URL=http://173.212.208.181:3000

# Frontend
VITE_SITE_URL=http://localhost:5173

# Analytics (optionnel)
VITE_GOOGLE_ANALYTICS_ID=your_ga_id_here
VITE_GOOGLE_SEARCH_CONSOLE_ID=your_gsc_id_here
```

### Fichiers de Configuration
- **app/lib/api-config.ts**: Configuration adaptive Strapi/MERN ✅
- **app/lib/auth-service.ts**: Service d'authentification unifié ✅
- **.env.local**: Configuration VPS active ✅
- **.env.vps**: Backup configuration VPS ✅

## 🚀 Comment Utiliser

### 1. Démarrer le Frontend
```powershell
cd C:\Devops\blog_strapi\frontend
npm run dev
```
Accéder à: http://localhost:5173

### 2. Tester la Connexion
```powershell
.\test-backend.ps1
```

### 3. Tester le Login
1. Ouvrir http://localhost:5173
2. Aller sur la page de login
3. Se connecter avec:
   - Email: `boujraf.hicham@gmail.com`
   - Password: `Admin123!`

## 🔄 Basculer entre Localhost et VPS

### Utiliser Backend VPS (actuel)
```powershell
Copy-Item .env.vps .env.local -Force
npm run dev
```

### Utiliser Backend Local
Créer `.env.local`:
```bash
VITE_BACKEND_TYPE=mern
VITE_API_URL=http://localhost:3000/api
VITE_STRAPI_URL=http://localhost:3000
VITE_SITE_URL=http://localhost:5173
```

## 📝 Prochaines Étapes

### 1. Implémenter les Contrôleurs CRUD (backend-mern)
Les contrôleurs actuels sont des stubs TODO qui retournent toujours `[]`:

```typescript
// backend-mern/src/controllers/articles.controller.ts
export const getArticles = async (req: Request, res: Response) => {
  // TODO: Implement
  res.json({ data: [], meta: { total: 0 } });
};
```

**À faire**:
- Implémenter `getArticles` avec Prisma queries
- Implémenter `getCategories`, `getTags`, `getProjects`
- Ajouter pagination, filtres, tri
- Ajouter validation des données

### 2. Tester l'Interface Frontend
- Vérifier l'affichage de la liste d'articles
- Tester la création d'un nouvel article
- Tester l'édition et la suppression
- Vérifier les filtres et la recherche

### 3. Configurer CORS pour Production
Si nécessaire, ajouter le domaine frontend dans `.env.production`:
```bash
CORS_ORIGINS="http://localhost:5173,https://your-frontend-domain.com"
```

### 4. Configurer N8N avec API Keys
```bash
# Créer une API Key
POST http://173.212.208.181:3000/api/api-keys
Authorization: Bearer <admin_token>
Body: {
  "name": "N8N Integration",
  "expiresAt": "2025-12-31"
}

# Utiliser dans N8N
Headers: {
  "X-API-Key": "generated_key"
}
```

## 🐛 Troubleshooting

### CORS Errors
Si vous voyez des erreurs CORS dans la console:
1. Éditer `/root/blog_strapi/backend-mern/.env.production` sur le VPS
2. Ajouter l'URL du frontend: `CORS_ORIGINS="http://localhost:5173"`
3. Redémarrer: `docker-compose -f docker-compose.prod.yml restart backend`

### Token Expiré
Les access tokens expirent après 15 minutes. Si vous obtenez une erreur 401:
1. Le frontend utilisera automatiquement le refresh token
2. Ou se connecter à nouveau

### Backend VPS Non Disponible
```bash
# Vérifier le conteneur
ssh root@173.212.208.181
docker ps
docker logs backend-mern

# Vérifier PostgreSQL
sudo -u postgres psql -d blog_mern -c '\dt'
```

## 📚 Documentation Supplémentaire

- **DEPLOYMENT_PROCEDURE.md**: Procédure complète de déploiement VPS
- **PRE_DEPLOYMENT_CHECKLIST.md**: Checklist avant déploiement
- **BACKEND_CONNECTION_GUIDE.md**: Guide détaillé des tests API
- **test-backend.ps1**: Script automatique de tests

## ✅ Status Final

| Composant | Status | Notes |
|-----------|--------|-------|
| Backend VPS | ✅ ONLINE | Port 3000, Docker |
| PostgreSQL | ✅ ONLINE | 11 tables, seed data OK |
| Frontend Config | ✅ OK | Adaptive Strapi/MERN |
| Authentication | ✅ OK | JWT + Refresh tokens |
| Health Check | ✅ OK | /health responding |
| Login API | ✅ OK | Admin user working |
| CRUD Endpoints | ⚠️ TODO | Stubs à implémenter |
| CORS | ⚠️ À TESTER | Configurer si nécessaire |

**Date de configuration**: 2025-01-18
**Configuration testée**: VPS 173.212.208.181 + Frontend localhost:5173
