# TanStack Query Integration Guide

## Vue d'ensemble

Cette intégration met en place TanStack Query (React Query) pour optimiser les appels d'API dans notre application React Router avec Strapi. Le système inclut :

- ✅ **Cache intelligent** : Mise en cache automatique avec TTL configurables
- ✅ **Authentification JWT** : Système d'authentification sécurisé avec tokens
- ✅ **Routes protégées** : Protection automatique des routes administratives
- ✅ **Mutations optimistes** : Créations/suppressions avec invalidation de cache
- ✅ **Gestion d'erreur** : Gestion centralisée des erreurs et états de chargement

## Architecture

```
frontend/app/
├── lib/
│   ├── query-provider.tsx     # Configuration TanStack Query
│   ├── auth.ts               # Service d'authentification
│   └── api.ts                # API client existant
├── hooks/
│   ├── useApi.ts             # Hooks TanStack Query pour les données
│   ├── useAuth.ts            # Hook d'authentification
│   └── usePermissions.ts     # Hook de gestion des permissions
├── components/
│   └── ProtectedRoute.tsx    # Composant de protection des routes
└── routes/
    ├── blog/index.tsx        # Route blog avec TanStack Query
    ├── admin/index.tsx       # Dashboard admin protégé
    └── login/index.tsx       # Page de connexion
```

## Fonctionnalités implémentées

### 1. Configuration TanStack Query

Le `QueryClient` est configuré avec :
- **Cache par défaut** : 5 minutes pour les requêtes
- **Retry automatique** : 2 tentatives en cas d'échec
- **Background refetch** : Mise à jour automatique en arrière-plan
- **Gestion d'erreur** : Log automatique des erreurs

```typescript
// Exemple d'utilisation
import { usePosts } from '~/hooks/useApi';

function BlogPage() {
  const { data: response, isLoading, error } = usePosts({ 
    page: 1, 
    pageSize: 10 
  });
  
  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;
  
  const posts = response?.posts || [];
  return <div>{/* Render posts */}</div>;
}
```

### 2. Système d'authentification

- **JWT Tokens** : Access token + Refresh token
- **Persistance** : Stockage sécurisé dans localStorage
- **Auto-refresh** : Renouvellement automatique des tokens
- **Hooks réactifs** : État d'authentification partagé

```typescript
// Utilisation du hook d'auth
import { useAuth } from '~/hooks/useAuth';

function AdminPanel() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginForm />;
  }
  
  return <AdminDashboard user={user} onLogout={logout} />;
}
```

### 3. Hooks API optimisés

Tous les hooks incluent :
- **Cache intelligent** avec TTL spécifiques
- **Invalidation automatique** après mutations
- **États de chargement** et gestion d'erreur
- **Placeholder data** pour éviter les layouts shifts

#### Hooks disponibles :

- `usePosts(params)` - Liste des articles avec pagination
- `useArticle(slug)` - Article individuel par slug
- `useProjects(params)` - Liste des projets
- `useProject(slug)` - Projet individuel
- `useSearchPosts(query)` - Recherche d'articles
- `usePopularPosts(limit)` - Articles populaires
- `useRecentPosts(limit)` - Articles récents
- `useInfinitePosts(pageSize)` - Scroll infini
- `useCreatePost()` - Création d'article
- `useDeletePost()` - Suppression d'article

### 4. Routes protégées

Le composant `ProtectedRoute` gère :
- **Vérification d'authentification**
- **Redirection automatique** vers /login
- **États de chargement** pendant la vérification
- **Gestion des permissions** par rôle

### 5. Performance et Cache

#### Stratégies de cache :
- **Articles individuels** : 10 minutes (rarement modifiés)
- **Listes d'articles** : 2 minutes (mises à jour fréquentes)
- **Projets** : 5 minutes (statiques)
- **Recherche** : 5 minutes avec debounce

#### Optimisations :
- **Prefetching** au survol des liens
- **Background updates** pour la fraîcheur des données
- **Optimistic updates** pour les mutations
- **Automatic garbage collection** des caches inutilisés

## Exemples d'utilisation

### Route avec TanStack Query

```typescript
// routes/blog/index.tsx
export default function BlogIndex() {
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  
  const { data: response, isLoading, error } = usePosts({ 
    page, 
    pageSize: 10 
  });
  
  if (isLoading) return <BlogSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  const posts = response?.posts || [];
  const meta = response?.meta;
  
  return (
    <div>
      {posts.map(post => <PostCard key={post.id} post={post} />)}
      <Pagination meta={meta} />
    </div>
  );
}
```

### Dashboard admin avec mutations

```typescript
// routes/admin/index.tsx
export default function AdminDashboard() {
  const { data: response } = usePosts({ pageSize: 20 });
  const createPost = useCreatePost();
  const deletePost = useDeletePost();
  
  const handleCreate = async () => {
    try {
      await createPost.mutateAsync({
        title: 'Nouvel article',
        // ...
      });
      toast.success('Article créé !');
    } catch (error) {
      toast.error('Erreur création');
    }
  };
  
  return (
    <div>
      <button onClick={handleCreate}>
        {createPost.isPending ? 'Création...' : 'Créer'}
      </button>
      {/* Dashboard content */}
    </div>
  );
}
```

## Configuration et démarrage

### 1. Installation des dépendances

```bash
cd frontend
npm install @tanstack/react-query
```

### 2. Configuration du QueryClient

Le `query-provider.tsx` est automatiquement intégré dans `root.tsx` :

```typescript
// root.tsx
export default function App() {
  return (
    <QueryProvider>
      {/* App content */}
    </QueryProvider>
  );
}
```

### 3. Variables d'environnement

```env
STRAPI_API_URL=http://localhost:1337
JWT_SECRET=your-jwt-secret
```

### 4. Types TypeScript

Tous les types sont définis dans `lib/types.ts` et exportés pour utilisation.

## Sécurité

### JWT Tokens
- **Access token** : Durée de vie courte (15 min)
- **Refresh token** : Durée de vie longue (7 jours)
- **Auto-refresh** : Renouvellement transparent
- **Logout sécurisé** : Nettoyage des tokens et cache

### Protection CSRF
- **Token CSRF** automatique dans les headers
- **SameSite cookies** configurés
- **Validation côté serveur** des tokens

### Sanitization
- **Input validation** sur tous les formulaires
- **XSS protection** avec DOMPurify
- **SQL injection** prevention via Strapi

## Monitoring et Debug

### TanStack Query DevTools

Activées en développement pour :
- **Visualiser le cache**
- **Debugger les requêtes**
- **Analyser les performances**
- **Invalider manuellement le cache**

### Logging

- **Erreurs API** loggées automatiquement
- **Métriques de performance** collectées
- **États de cache** trackés
- **Analytics d'utilisation** intégrées

## Migration depuis l'ancien système

### Étapes de migration

1. **Remplacer les appels directs** par les hooks TanStack Query
2. **Migrer la gestion d'état** vers React Query
3. **Adapter les composants** pour les nouveaux états
4. **Tester les performances** et ajuster les caches

### Compatibilité

- ✅ **API Strapi** : Compatible avec l'existant
- ✅ **Types TypeScript** : Réutilise les types existants  
- ✅ **Routes React Router** : Intégration transparente
- ✅ **Composants UI** : Aucune modification requise

## Prochaines étapes

### Fonctionnalités à venir

1. **N8N Integration** : Webhooks pour automatisation
2. **Real-time updates** : WebSocket support
3. **Offline support** : Cache persistant
4. **Advanced caching** : Service Worker integration

### Optimisations

1. **Bundle splitting** : Lazy loading des hooks
2. **Preloading strategies** : Smart prefetching
3. **Memory optimization** : Garbage collection tuning
4. **Network optimization** : Request deduplication

---

*Cette intégration TanStack Query fournit une base solide pour une application moderne avec des performances optimales et une excellente expérience utilisateur.*