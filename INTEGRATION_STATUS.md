# 🚧 Intégration Frontend-Backend en cours

## ✅ Ce qui fonctionne

1. **Backend MERN opérationnel**
   - Health check: https://blog.bh-systems.be/health ✅
   - API Articles: https://blog.bh-systems.be/api/articles ✅
   - API Projects: https://blog.bh-systems.be/api/projects ✅
   - Seed données: 1 article, 1 projet, 4 catégories, 7 tags ✅

2. **Frontend SSR déployé**
   - Page d'accueil: https://blog.bh-systems.be ✅ (200 OK)
   - Build et déploiement Docker OK ✅
   - Variables d'environnement configurées ✅

3. **Infrastructure**
   - HTTPS avec SSL Let's Encrypt ✅
   - Nginx reverse proxy ✅
   - Docker Compose complet ✅
   - PostgreSQL avec données ✅

## ❌ Problème actuel

**Les pages `/blog` et `/projects` retournent une erreur 500**

### Cause racine

Le frontend utilise `fetchStrapi()` avec la syntaxe Strapi (populate, filters, etc.) mais le backend est MERN avec une API différente :

**Syntaxe Strapi (actuelle dans le code)** :
```typescript
const params = {
  populate: { author: true, category: true, tags: true },
  filters: { slug: { $eq: slug } },
  sort: { publishedAt: "desc" },
  pagination: { page, pageSize }
};
const data = await fetchStrapi("/articles", params);
```

**Syntaxe MERN (attendue par le backend)** :
```typescript
const params = {
  page: 1,
  limit: 10,
  sort: 'publishedAt',
  order: 'desc',
  search: 'keyword'
};
const response = await fetch('/api/articles?' + new URLSearchParams(params));
```

### Erreur détaillée

```
Error: Strapi request failed 500: {"error":"Failed to fetch articles"}
    at fetchStrapi (file:///app/build/server/index.js:1463:11)
    at getPosts (file:///app/build/server/index.js:1520:16)
```

## 🔧 Solutions possibles

### Option 1: Adapter le frontend pour MERN (RECOMMANDÉ)

Créer une fonction `useApi()` ou `fetchMern()` qui :
- Convertit les paramètres Strapi en query params MERN
- Gère les 2 types d'API selon `VITE_BACKEND_TYPE`
- Transforme les réponses MERN au format Strapi pour compatibilité

**Fichiers à modifier** :
- `frontend/app/lib/api.ts` : Ajouter `fetchMern()` et adapter les fonctions
- `frontend/app/lib/utils.ts` : Déjà configuré avec `backendType`
- `frontend/app/hooks/useApi.ts` : Vérifier la configuration

### Option 2: Adapter le backend MERN pour Strapi (NON RECOMMANDÉ)

Modifier les contrôleurs MERN pour accepter les query params Strapi.

**Inconvénient** : Complexifie le backend, perte des avantages d'une API REST propre.

### Option 3: Créer un adaptateur (SOLUTION INTERMÉDIAIRE)

Créer un middleware/adaptateur qui traduit les requêtes Strapi en MERN.

## 📝 TODO Immédiat

### Priorité 1 : Fix les appels API

1. **Créer `fetchMern()` dans `api.ts`**
   ```typescript
   async function fetchMern<T>(path: string, params: any): Promise<T> {
     const queryString = new URLSearchParams(params).toString();
     const url = `${config.apiUrl}${path}?${queryString}`;
     const response = await fetch(url);
     if (!response.ok) throw new Error(`API error: ${response.status}`);
     return response.json();
   }
   ```

2. **Adapter `getPosts()` pour MERN**
   ```typescript
   export async function getPosts({ page = 1, pageSize = 10, sort, filters }: any = {}) {
     if (config.backendType === 'mern') {
       const params = {
         page,
         limit: pageSize,
         sort: sort?.publishedAt ? 'publishedAt' : 'createdAt',
         order: sort?.publishedAt || 'desc',
         search: filters?.title?.$contains || '',
         category: filters?.category?.id || '',
         status: 'published'
       };
       const data = await fetchMern('/articles', params);
       return { posts: data.data.map(mapMernPost), meta: data.meta };
     } else {
       // Code Strapi existant
     }
   }
   ```

3. **Créer `mapMernPost()` pour transformer les données**
   ```typescript
   function mapMernPost(item: any): Post {
     return {
       id: item.id,
       title: item.title,
       slug: item.slug,
       excerpt: item.excerpt,
       content: item.content,
       publishedAt: item.publishedAt,
       category: item.category,
       tags: item.tags || [],
       author: item.author,
       featuredImage: item.featuredImage,
       // ... autres champs
     };
   }
   ```

### Priorité 2: Page d'erreur professionnelle

Créer un composant `ErrorBoundary` ou `ErrorPage` pour afficher une belle erreur au lieu de "Oops!".

### Priorité 3: Tests complets

Une fois l'API fixée :
- ✅ Login avec boujraf.hicham@gmail.com / Admin123!
- ✅ Affichage de la liste des articles
- ✅ Affichage d'un article
- ✅ Liste des projets
- ✅ Création d'un nouvel article
- ✅ Upload d'images

## 🎯 Estimation

- **Fix API calls** : 1-2 heures
- **Tests intégration** : 30 minutes
- **Page d'erreur** : 15 minutes

**Total** : ~2-3 heures de développement

## 📊 État actuel

```
✅ Infrastructure    100%
✅ Backend MERN      100%
✅ Frontend Build    100%
⚠️  API Integration   20%  ← EN COURS
❌ Tests E2E           0%
```

## 🚀 Prochaine étape

**IMMÉDIAT** : Adapter `frontend/app/lib/api.ts` pour supporter l'API MERN en détectant `config.backendType === 'mern'` et en utilisant les bons paramètres de query.
