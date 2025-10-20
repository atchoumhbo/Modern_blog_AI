# 🔄 Migration Frontend : Strapi → Backend MERN

## ✅ Changements effectués

### 1. Fichiers créés

- **`frontend/app/lib/api-config.ts`** : Configuration adaptative Strapi/MERN
- **`frontend/app/lib/auth-service.ts`** : Service d'authentification unifié

### 2. Fichiers modifiés

- **`frontend/.env.local`** : Variables d'environnement pour backend MERN

---

## 🚀 Démarrage Rapide

### Étape 1 : Backend MERN opérationnel

Le backend MERN doit tourner (déjà fait) :
```bash
# VPS
curl http://localhost:3000/health
# Devrait retourner: {"status":"ok",...}
```

### Étape 2 : Migrer la base de données

```bash
# Sur le VPS
cd /root/blog_strapi/backend-mern

# 1. Migrations Prisma (créer les tables)
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# 2. Seed admin + données initiales
docker-compose -f docker-compose.prod.yml exec backend npm run seed
```

**Admin créé** : `boujraf.hicham@gmail.com` / `Admin123!`

### Étape 3 : Configurer le frontend

```bash
cd frontend

# Variables déjà configurées dans .env.local :
# VITE_BACKEND_TYPE=mern
# VITE_API_URL=http://localhost:3000/api
```

### Étape 4 : Lancer le frontend

```bash
npm run dev
# Le frontend pointe maintenant vers le backend MERN sur port 3000
```

---

## 🔐 Authentification

### Ancien (Strapi)
```javascript
// Login Strapi
POST http://localhost:1337/api/auth/local
{
  "identifier": "user@example.com",
  "password": "password"
}

// Réponse
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "username": "user", "email": "..." }
}
```

### Nouveau (MERN)
```javascript
// Login MERN
POST http://localhost:3000/api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

// Réponse
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { 
    "id": "uuid", 
    "email": "...", 
    "username": "...",
    "isAdmin": true
  }
}
```

**Le service `authService` gère automatiquement la différence !**

---

## 📡 Endpoints API

| Ressource | Strapi | MERN | Status |
|-----------|---------|------|--------|
| **Articles** |  |  | |
| Liste | `GET /api/articles` | `GET /api/articles` | ✅ Compatible |
| Détail | `GET /api/articles/:id` | `GET /api/articles/:id` | ✅ Compatible |
| Par slug | `GET /api/articles?filters[slug][$eq]=xxx` | `GET /api/articles/slug/:slug` | ⚠️ À adapter |
| Créer | `POST /api/articles` | `POST /api/articles` | ✅ Compatible |
| Modifier | `PUT /api/articles/:id` | `PATCH /api/articles/:id` | ⚠️ PUT → PATCH |
| Supprimer | `DELETE /api/articles/:id` | `DELETE /api/articles/:id` | ✅ Compatible |
| **Projets** |  |  | |
| Liste | `GET /api/projects` | `GET /api/projects` | ✅ Compatible |
| Détail | `GET /api/projects/:id` | `GET /api/projects/:id` | ✅ Compatible |
| **Categories** | `GET /api/categories` | `GET /api/categories` | ✅ Compatible |
| **Tags** | `GET /api/tags` | `GET /api/tags` | ✅ Compatible |

---

## ⚠️ Adaptations nécessaires

### 1. Format de réponse (IDENTIQUE ✅)

**Strapi v5 :**
```json
{
  "data": [...],
  "meta": {
    "pagination": { "page": 1, "pageSize": 10, "pageCount": 5, "total": 42 }
  }
}
```

**MERN Backend :**
```json
{
  "data": [...],
  "meta": {
    "pagination": { "page": 1, "pageSize": 10, "pageCount": 5, "total": 42 }
  }
}
```

✅ **Pas de changement nécessaire !**

### 2. Filtres et tri

**Strapi** (format complexe) :
```
GET /api/articles?filters[category][name][$eq]=Tech&sort=publishedAt:desc
```

**MERN** (format simplifié) :
```
GET /api/articles?category=Tech&sort=-publishedAt
```

**À adapter dans les services** :
```typescript
// frontend/app/lib/strapi-services.ts
// Remplacer buildStrapiFilters() par buildMernFilters()

function buildMernFilters(params: any): Record<string, string> {
  const query: Record<string, string> = {};
  
  if (params.category) query.category = params.category;
  if (params.tag) query.tag = params.tag;
  if (params.search) query.search = params.search;
  if (params.sort) query.sort = params.sort; // Ex: "-publishedAt"
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);
  
  return query;
}
```

### 3. Controllers manquants (TODO)

Le backend MERN a des **stubs** pour Articles/Projects/Categories/Tags. Il faut les implémenter :

```typescript
// backend-mern/src/routes/article.routes.ts
// Actuellement : res.json({ message: "TODO: Implement..." })
// À faire : Implémenter les controllers avec Prisma
```

**Prochaine étape** : Implémenter les controllers CRUD complets.

---

## 🔄 Migration de données Strapi → PostgreSQL

Si vous avez des données dans Strapi à migrer :

```bash
# 1. Exporter depuis Strapi
cd backend
npx strapi export --file strapi-backup.tar.gz

# 2. Script de migration custom (à créer)
node scripts/migrate-strapi-to-mern.js
```

**OU**

Utiliser N8N pour synchroniser :
- Workflow : Strapi → Backend MERN
- Lire tous les articles Strapi
- Créer dans backend MERN via API Keys

---

## ✅ Checklist de migration

- [x] Backend MERN déployé et opérationnel
- [x] Migrations Prisma exécutées
- [x] Admin créé (seed)
- [x] Frontend configuré (`.env.local`)
- [ ] Tester login avec admin
- [ ] Tester création d'article
- [ ] Tester affichage liste articles
- [ ] Implémenter controllers manquants
- [ ] Migrer données existantes (si nécessaire)
- [ ] Configurer CORS pour frontend VPS
- [ ] Tester en production

---

## 📝 Prochaines étapes

1. **Implémenter les controllers CRUD** (articles, projects, categories, tags)
2. **Tester l'intégration frontend-backend** localement
3. **Déployer le frontend** sur VPS
4. **Configurer Nginx** pour reverse proxy
5. **SSL** avec Let's Encrypt
6. **N8N** avec API Keys pour automatisation

---

## 🆘 Dépannage

### Le frontend ne se connecte pas au backend

```bash
# Vérifier que le backend tourne
curl http://localhost:3000/health

# Vérifier les logs backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Vérifier la config frontend
cat frontend/.env.local | grep VITE_API_URL
```

### CORS errors

Ajouter l'URL du frontend dans `backend-mern/.env` :
```bash
CORS_ORIGINS=http://localhost:5173,http://173.212.208.181:5173
```

Puis rebuild :
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### 401 Unauthorized

Token expiré ou invalide. Se reconnecter :
```javascript
// Dans le frontend
authService.logout();
authService.login({ email: "...", password: "..." });
```
