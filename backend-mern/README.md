# Modern Blog Leader - Backend MERN

🚀 Backend sécurisé pour Modern Blog Leader avec PostgreSQL, Express, Node.js et TypeScript.

## 🎯 Fonctionnalités

### Sécurité renforcée
- ✅ **Authentification JWT** avec refresh tokens
- ✅ **API Keys** pour N8N et webhooks (cryptographiquement sécurisées)
- ✅ **Bcrypt** (12 salt rounds) pour les passwords
- ✅ **Rate limiting** (global + par endpoint)
- ✅ **Helmet.js** (sécurité HTTP headers)
- ✅ **CORS** strict avec whitelist
- ✅ **Validation Zod** des inputs
- ✅ **SQL injection protection** (Prisma ORM)
- ✅ **Audit logs** pour traçabilité

### API complète
- Articles (CRUD, pagination, filtering, search)
- Projects (CRUD, statuts, liens GitHub/Demo)
- Categories (avec couleurs)
- Tags (avec couleurs)
- API Keys management
- Authentication (register, login, refresh, logout)

### Intégrations
- **N8N** : API Keys avec permissions granulaires
- **Docker** : Déploiement containerisé
- **PostgreSQL** : Base relationnelle performante
- **Prisma** : ORM type-safe

---

## 📦 Installation

### Prérequis
- Node.js 18+ 
- PostgreSQL 14+
- Docker & Docker Compose (optionnel)

### Installation locale

```bash
# 1. Installer les dépendances
npm install

# 2. Copier .env.example vers .env
cp .env.example .env

# 3. Configurer DATABASE_URL dans .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/blog_mern"

# 4. Générer Prisma Client
npm run prisma:generate

# 5. Créer les tables
npm run prisma:migrate

# 6. (Optionnel) Ouvrir Prisma Studio
npm run prisma:studio

# 7. Lancer en développement
npm run dev

# 8. Lancer en production
npm run build
npm start
```

### Installation Docker

```bash
# 1. Copier .env.example vers .env et configurer

# 2. Build et démarrage
docker-compose up -d

# 3. Vérifier les logs
docker-compose logs -f backend

# 4. Accéder aux migrations
docker-compose exec backend npx prisma migrate deploy

# 5. (Optionnel) Seed initial data
docker-compose exec backend npm run seed
```

---

## 🔐 Authentification

### 1. Utilisateurs humains (JWT)

**Register**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "username": "admin",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}

Response:
{
  "user": { ... },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "a1b2c3d4..."
}
```

**Login**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}

Response:
{
  "user": { ... },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "a1b2c3d4..."
}
```

**Utilisation**
```bash
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 2. N8N / Webhooks (API Keys)

**Créer une API Key**
```bash
POST /api/api-keys
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "name": "N8N Production",
  "expiresInDays": 365,
  "canRead": true,
  "canWrite": true,
  "canDelete": false,
  "rateLimit": 1000
}

Response:
{
  "id": "uuid",
  "name": "N8N Production",
  "key": "mbk_live_abc123def456...",  // ⚠️ SAUVEGARDER MAINTENANT !
  "prefix": "mbk_live_",
  "message": "IMPORTANT: Save this API key now..."
}
```

**Utilisation avec N8N**
```bash
# Headers dans N8N HTTP Request Node:
X-API-Key: mbk_live_abc123def456...

# Exemple: Créer un article depuis N8N
POST https://blog.bh-systems.be/api/articles
Headers:
  X-API-Key: mbk_live_abc123def456...
  Content-Type: application/json
Body:
{
  "title": "Mon article",
  "slug": "mon-article",
  "content": "Contenu...",
  "isPublished": true
}
```

---

## 🛣️ Routes API

### Authentication (`/api/auth`)
```
POST   /register          Register new user
POST   /login             Login user
POST   /refresh           Refresh access token
POST   /logout            Logout user
GET    /me                Get current user profile
POST   /change-password   Change password
```

### API Keys (`/api/api-keys`) 🔒 JWT Required
```
POST   /                  Create API key
GET    /                  List user's API keys
GET    /:id               Get API key details
PATCH  /:id               Update API key
DELETE /:id               Delete API key
GET    /:id/logs          Get API key usage logs
```

### Articles (`/api/articles`)
```
GET    /                  List articles (public)
GET    /:id               Get article by ID (public)
GET    /slug/:slug        Get article by slug (public)
POST   /                  Create article 🔒 JWT or API Key (write)
PATCH  /:id               Update article 🔒 JWT or API Key (write)
DELETE /:id               Delete article 🔒 JWT or API Key (delete)
```

### Projects (`/api/projects`)
```
GET    /                  List projects (public)
GET    /:id               Get project by ID (public)
GET    /slug/:slug        Get project by slug (public)
POST   /                  Create project 🔒 JWT or API Key (write)
PATCH  /:id               Update project 🔒 JWT or API Key (write)
DELETE /:id               Delete project 🔒 JWT or API Key (delete)
```

### Categories (`/api/categories`)
```
GET    /                  List categories (public)
GET    /:id               Get category (public)
POST   /                  Create category 🔒 JWT or API Key (write)
PATCH  /:id               Update category 🔒 JWT or API Key (write)
DELETE /:id               Delete category 🔒 JWT or API Key (delete)
```

### Tags (`/api/tags`)
```
GET    /                  List tags (public)
GET    /:id               Get tag (public)
POST   /                  Create tag 🔒 JWT or API Key (write)
PATCH  /:id               Update tag 🔒 JWT or API Key (write)
DELETE /:id               Delete tag 🔒 JWT or API Key (delete)
```

---

## 🔒 Permissions

### API Keys Permissions

| Permission | Description | Défaut |
|------------|-------------|--------|
| `canRead` | GET requests | ✅ true |
| `canWrite` | POST, PATCH requests | ❌ false |
| `canDelete` | DELETE requests | ❌ false |

**Exemple N8N avec permissions limitées :**
```json
{
  "name": "N8N Read-Only",
  "canRead": true,
  "canWrite": false,
  "canDelete": false
}
```

**Exemple N8N avec écriture :**
```json
{
  "name": "N8N Full Access",
  "canRead": true,
  "canWrite": true,
  "canDelete": true
}
```

---

## 📊 Modèles de données

### User
```typescript
{
  id: string (UUID)
  email: string (unique)
  username: string (unique)
  password: string (bcrypt hash)
  firstName?: string
  lastName?: string
  isActive: boolean
  isAdmin: boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Article
```typescript
{
  id: string (UUID)
  title: string
  slug: string (unique)
  excerpt?: string
  content: string
  coverImage?: string
  isPublished: boolean
  publishedAt?: DateTime
  viewCount: number
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
  authorId: string (FK -> User)
  categoryId?: string (FK -> Category)
  tags: Tag[]
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Project
```typescript
{
  id: string (UUID)
  title: string
  slug: string (unique)
  description?: string
  content?: string
  coverImage?: string
  githubUrl?: string
  demoUrl?: string
  status: ProjectStatus (PLANNING|IN_PROGRESS|COMPLETED|ARCHIVED)
  isPublished: boolean
  publishedAt?: DateTime
  viewCount: number
  metaTitle?: string
  metaDescription?: string
  authorId: string (FK -> User)
  categoryId?: string (FK -> Category)
  tags: Tag[]
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

## 🚀 Déploiement sur VPS

### Option 1: Docker Compose (Recommandé)

```bash
# 1. Sur le VPS
cd /root/blog_strapi/backend-mern

# 2. Configurer .env pour production
nano .env
# Changer NODE_ENV=production
# Configurer DATABASE_URL
# Générer de nouveaux secrets JWT

# 3. Build et démarrage
docker-compose up -d

# 4. Migrations
docker-compose exec backend npx prisma migrate deploy

# 5. Vérifier
curl http://localhost:3000/health
```

### Option 2: PM2 (Node.js direct)

```bash
# 1. Installer PM2
npm install -g pm2

# 2. Build
npm run build

# 3. Migrations
npm run prisma:deploy

# 4. Démarrer avec PM2
pm2 start dist/server.js --name blog-api

# 5. Auto-restart au boot
pm2 startup
pm2 save
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name blog.bh-systems.be;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📝 Logs & Monitoring

### Audit Logs

Tous les accès API Keys sont loggés :

```bash
GET /api/api-keys/:id/logs
Authorization: Bearer your-jwt-token

Response:
{
  "data": [
    {
      "id": "uuid",
      "action": "API_KEY_USED",
      "resource": "ApiKey",
      "ipAddress": "1.2.3.4",
      "userAgent": "N8N/1.0",
      "metadata": {
        "apiKeyName": "N8N Production",
        "endpoint": "/api/articles",
        "method": "POST"
      },
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Health Check

```bash
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00Z",
  "uptime": 3600,
  "environment": "production"
}
```

---

## 🔧 Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Port du serveur | 3000 |
| `HOST` | Host du serveur | 0.0.0.0 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret pour access tokens | - |
| `JWT_REFRESH_SECRET` | Secret pour refresh tokens | - |
| `JWT_EXPIRES_IN` | Durée access token | 15m |
| `JWT_REFRESH_EXPIRES_IN` | Durée refresh token | 7d |
| `API_KEY_SALT` | Salt pour API Keys | - |
| `CORS_ORIGINS` | Origins autorisées (csv) | http://localhost:5173 |
| `MAX_FILE_SIZE` | Taille max upload (bytes) | 5242880 (5MB) |
| `UPLOAD_PATH` | Dossier uploads | ./uploads |
| `RATE_LIMIT_WINDOW_MS` | Fenêtre rate limit | 900000 (15min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests/fenêtre | 100 |

---

## 🛠️ Scripts disponibles

```bash
npm run dev              # Dev avec hot-reload (tsx watch)
npm run build            # Build TypeScript
npm start                # Démarrer en production
npm run prisma:generate  # Générer Prisma Client
npm run prisma:migrate   # Créer/appliquer migration
npm run prisma:studio    # Ouvrir Prisma Studio (GUI)
npm run prisma:deploy    # Appliquer migrations (production)
npm run seed             # Seed données initiales
```

---

## 🔒 Sécurité Best Practices

### 1. Génération de secrets sécurisés

```bash
# JWT_SECRET
openssl rand -base64 32

# JWT_REFRESH_SECRET
openssl rand -base64 32

# API_KEY_SALT
openssl rand -base64 32
```

### 2. API Keys rotation

- Expirer les clés après 1 an maximum
- Révoquer immédiatement si compromises
- Monitorer les logs d'utilisation
- Une clé par service (N8N, webhooks, etc.)

### 3. Rate Limiting

- Global: 100 req/15min
- Auth endpoints: 5 req/15min
- API Keys: 1000 req/heure (configurable)

### 4. HTTPS obligatoire en production

```bash
# Utiliser Let's Encrypt avec Nginx
certbot --nginx -d blog.bh-systems.be
```

---

## 📚 Documentation complète

- Schéma Prisma : `prisma/schema.prisma`
- Middlewares : `src/middlewares/`
- Controllers : `src/controllers/`
- Routes : `src/routes/`
- Configuration : `src/config/`

---

## 🆘 Support

En cas de problème :

1. Vérifier les logs : `docker-compose logs -f backend`
2. Vérifier la DB : `npm run prisma:studio`
3. Tester l'API : `curl http://localhost:3000/health`
4. Vérifier les secrets dans `.env`

---

**Made with ❤️ for Modern Blog Leader**
