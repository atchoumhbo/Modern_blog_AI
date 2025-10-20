# Configuration Strapi - Guide Complet

## 🎯 Vue d'ensemble

Cette documentation explique la configuration complète de Strapi v5 pour le blog avec intégration TanStack Query et webhooks N8N.

## 📋 Architecture

```
Backend (Strapi v5)
├── Content Types
│   ├── Article (api::article.article)
│   ├── Project (api::project.project)
│   ├── Category (api::category.category)
│   ├── Tag (api::tag.tag)
│   └── Author (api::author.author)
├── Permissions & Rôles
├── API Endpoints
└── Webhooks N8N
```

## 🔐 Système de Permissions

### Rôles Utilisateur

- **Public** : Lecture seule des contenus publiés
- **Authenticated** : Lecture des contenus + profil utilisateur
- **Author** : Création et modification de ses propres contenus
- **Editor** : Gestion complète des contenus
- **Admin** : Accès complet système

### Matrice des Permissions

| Collection | Public | Authenticated | Author | Editor | Admin |
|------------|--------|---------------|--------|--------|-------|
| Articles   | R      | R             | CRUD*  | CRUD   | CRUD  |
| Projects   | R      | R             | CRUD*  | CRUD   | CRUD  |
| Categories | R      | R             | R      | CRUD   | CRUD  |
| Tags       | R      | R             | R      | CRUD   | CRUD  |
| Upload     | -      | C             | C      | CD     | CD    |

*CRUD limité à ses propres contenus

## 🏗️ Types de Contenu

### Article (api::article.article)

```typescript
interface Article {
  id: number;
  title: string;           // Titre de l'article
  slug: string;           // URL-friendly identifier
  excerpt?: string;       // Résumé court
  body: string;          // Contenu principal (RichText)
  date: Date;            // Date de publication
  viewCount?: number;    // Nombre de vues
  readTime?: number;     // Temps de lecture estimé
  
  // Relations
  featuredImage?: Media;
  category?: Category;
  tags?: Tag[];
  author?: Author;
  seo?: SEOComponent;
  
  // Métadonnées
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Project (api::project.project)

```typescript
interface Project {
  id: number;
  title: string;
  slug: string;
  description: string;
  content?: string;      // Description détaillée
  status: 'active' | 'completed' | 'archived' | 'on-hold';
  
  // URLs
  demoUrl?: string;
  githubUrl?: string;
  
  // Relations
  featuredImage?: Media;
  gallery?: Media[];
  technologies?: Technology[];
  category?: Category;
  seo?: SEOComponent;
  
  // Métadonnées
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔗 API Endpoints

### Articles
- `GET /api/articles` - Liste des articles
- `GET /api/articles/:id` - Article par ID
- `POST /api/articles` - Création (Auth required)
- `PUT /api/articles/:id` - Mise à jour (Auth required)
- `DELETE /api/articles/:id` - Suppression (Auth required)

### Projects
- `GET /api/projects` - Liste des projets
- `GET /api/projects/:id` - Projet par ID
- `POST /api/projects` - Création (Auth required)
- `PUT /api/projects/:id` - Mise à jour (Auth required)
- `DELETE /api/projects/:id` - Suppression (Auth required)

### Paramètres de Requête

```typescript
// Pagination
?pagination[page]=1&pagination[pageSize]=25

// Tri
?sort[0]=date:desc&sort[1]=title:asc

// Filtres
?filters[category][slug][$eq]=javascript
?filters[publishedAt][$notNull]=true
?filters[title][$containsi]=react

// Population
?populate[featuredImage]=*
?populate[category][fields][0]=name
?populate[tags][populate][0]=*
```

## 🎣 Webhooks N8N

### Configuration des Webhooks

Les webhooks sont automatiquement configurés pour déclencher des workflows N8N :

```javascript
// Events disponibles
const WEBHOOK_EVENTS = {
  'article-created': 'Nouvel article publié',
  'article-updated': 'Article mis à jour',
  'article-deleted': 'Article supprimé',
  'project-created': 'Nouveau projet publié',
  'project-updated': 'Projet mis à jour',
  'project-deleted': 'Projet supprimé',
  'user-registered': 'Nouvel utilisateur',
  'contact-form': 'Message de contact'
};
```

### Payload des Webhooks

```json
{
  "event": "article-created",
  "timestamp": "2025-01-27T10:00:00Z",
  "data": {
    "id": 123,
    "title": "Mon nouvel article",
    "slug": "mon-nouvel-article",
    "publishedAt": "2025-01-27T10:00:00Z",
    "url": "https://monblog.com/blog/mon-nouvel-article",
    "category": "JavaScript",
    "tags": ["React", "TypeScript"]
  }
}
```

## ⚡ Configuration TanStack Query

### Cache Strategy

```typescript
const CACHE_CONFIG = {
  staleTime: {
    articles: 5 * 60 * 1000,   // 5 minutes
    projects: 15 * 60 * 1000,  // 15 minutes
    categories: 30 * 60 * 1000, // 30 minutes
    static: 60 * 60 * 1000     // 1 heure
  },
  
  gcTime: {
    short: 10 * 60 * 1000,     // 10 minutes
    medium: 30 * 60 * 1000,    // 30 minutes
    long: 60 * 60 * 1000       // 1 heure
  }
};
```

### Query Keys Structure

```typescript
const queryKeys = {
  articles: {
    all: () => ['articles'],
    lists: () => ['articles', 'list'],
    list: (params) => ['articles', 'list', params],
    details: () => ['articles', 'detail'],
    detail: (slug) => ['articles', 'detail', slug],
    popular: (limit) => ['articles', 'popular', limit],
    recent: (limit) => ['articles', 'recent', limit],
    search: (query) => ['articles', 'search', query],
  }
};
```

## 🛠️ Installation et Configuration

### 1. Installation des Dépendances

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. Configuration des Variables d'Environnement

```bash
# Backend (.env)
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
JWT_SECRET=your-super-secret-jwt-key
ADMIN_JWT_SECRET=your-admin-jwt-secret
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=your-api-token-salt

# N8N Webhook URL
N8N_WEBHOOK_URL=http://localhost:5678/webhook

# Frontend (.env)
VITE_STRAPI_URL=http://localhost:1337
VITE_API_TOKEN=your-api-token
```

### 3. Démarrage des Services

```bash
# Backend Strapi
npm run develop

# Frontend
npm run dev

# Configuration automatique des permissions
node scripts/setup-strapi-permissions.js
```

## 📊 Monitoring et Analytics

### Métriques Disponibles

- **Performance API** : Temps de réponse, cache hit rate
- **Contenu** : Vues par article, articles populaires
- **Utilisateurs** : Registrations, activité
- **Erreurs** : Logs d'erreurs API, retry attempts

### Dashboard N8N

Les workflows N8N peuvent inclure :
- **Notifications** : Slack/Discord pour nouveaux contenus
- **SEO** : Soumission automatique aux moteurs de recherche
- **Social Media** : Publication automatique sur réseaux sociaux
- **Analytics** : Collecte de données d'engagement
- **Backup** : Sauvegarde automatique du contenu

## 🔧 Maintenance et Mise à Jour

### Sauvegarde

```bash
# Sauvegarde de la base de données
npm run strapi export

# Sauvegarde des médias
rsync -av public/uploads/ backup/uploads/
```

### Migration

```bash
# Migration de données
npm run strapi migration:run

# Mise à jour Strapi
npm update @strapi/strapi
```

### Performance

```bash
# Build optimisé
npm run build

# Analyse du bundle
npm run analyze

# Tests de performance
npm run test:performance
```

## 📚 Ressources

- [Documentation Strapi v5](https://docs.strapi.io/)
- [TanStack Query Guide](https://tanstack.com/query/latest)
- [N8N Documentation](https://docs.n8n.io/)
- [React Router v7](https://reactrouter.com/)

## 🐛 Dépannage

### Problèmes Courants

1. **Erreurs de permissions** : Vérifier la configuration des rôles
2. **Cache incohérent** : Invalider le cache TanStack Query
3. **Webhooks qui échouent** : Vérifier l'URL N8N et la connectivité
4. **Images non chargées** : Vérifier les permissions d'upload

### Logs Utiles

```bash
# Logs Strapi
tail -f .tmp/data.db

# Logs Frontend
npm run dev --verbose

# Logs N8N
docker logs n8n-container
```