# 🤖 Intégration N8N avec Modern Blog Leader

Guide complet pour connecter N8N à votre backend sécurisé.

---

## 📋 Table des matières

1. [Configuration initiale](#1-configuration-initiale)
2. [Créer une API Key](#2-créer-une-api-key)
3. [Workflows N8N exemples](#3-workflows-n8n-exemples)
4. [Authentification](#4-authentification)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Configuration initiale

### Prérequis
- Backend MERN déployé et accessible
- N8N installé et fonctionnel
- Compte admin créé sur le backend

### Variables d'environnement N8N

Dans votre installation N8N, configurez :

```bash
# Base URL de votre API
BLOG_API_URL=https://blog.bh-systems.be/api
# ou en local
BLOG_API_URL=http://localhost:3000/api

# API Key (à créer étape 2)
BLOG_API_KEY=mbk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 2. Créer une API Key

### Option A: Via Postman/cURL

```bash
# 1. Login pour obtenir un JWT
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "boujraf.hicham@gmail.com",
    "password": "YourPassword123!"
  }'

# Response:
{
  "user": {...},
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "abc123..."
}

# 2. Créer l'API Key
curl -X POST http://localhost:3000/api/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "name": "N8N Production",
    "expiresInDays": 365,
    "canRead": true,
    "canWrite": true,
    "canDelete": false,
    "rateLimit": 2000
  }'

# Response:
{
  "id": "uuid",
  "name": "N8N Production",
  "key": "mbk_live_abc123def456...",
  "prefix": "mbk_live_",
  "message": "⚠️ IMPORTANT: Save this API key now!"
}
```

**⚠️ CRITIQUE : Sauvegardez la clé `key` immédiatement ! Elle ne sera jamais réaffichée.**

### Option B: Via script Node.js

Créez `scripts/create-api-key.js` :

```javascript
const API_URL = 'http://localhost:3000/api';
const EMAIL = 'boujraf.hicham@gmail.com';
const PASSWORD = 'YourPassword123!';

async function createApiKey() {
  // 1. Login
  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });
  
  const { accessToken } = await loginResponse.json();
  console.log('✅ Logged in successfully');
  
  // 2. Create API Key
  const apiKeyResponse = await fetch(`${API_URL}/api-keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      name: 'N8N Production',
      expiresInDays: 365,
      canRead: true,
      canWrite: true,
      canDelete: false,
      rateLimit: 2000
    })
  });
  
  const apiKey = await apiKeyResponse.json();
  console.log('\n🔑 API Key created:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Key: ${apiKey.key}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n⚠️  SAVE THIS KEY NOW! It will not be shown again.\n');
}

createApiKey().catch(console.error);
```

Exécuter :
```bash
node scripts/create-api-key.js
```

---

## 3. Workflows N8N exemples

### 3.1. Créer un article automatiquement

**Workflow : Reddit → Blog**

1. **Trigger: Webhook**
   ```json
   URL: http://your-n8n:5678/webhook/reddit-to-blog
   Method: POST
   ```

2. **Node: HTTP Request (Create Article)**
   ```
   Method: POST
   URL: {{$env.BLOG_API_URL}}/articles
   Headers:
     X-API-Key: {{$env.BLOG_API_KEY}}
     Content-Type: application/json
   Body (JSON):
   {
     "title": "{{$json.title}}",
     "slug": "{{$json.title.toLowerCase().replace(/\\s+/g, '-')}}",
     "content": "{{$json.content}}",
     "excerpt": "{{$json.content.substring(0, 200)}}...",
     "isPublished": true,
     "categoryId": "uuid-of-reddit-category",
     "tagIds": ["uuid-tag-1", "uuid-tag-2"]
   }
   ```

3. **Node: Send Email (Notification)**
   ```
   Subject: New article created: {{$json.title}}
   Body: Article created successfully with ID: {{$json.id}}
   ```

### 3.2. Sync articles Reddit → Blog

**Schedule: Every 1 hour**

1. **Trigger: Schedule**
   ```
   Mode: Interval
   Interval: 60 (minutes)
   ```

2. **Node: Reddit (Get Posts)**
   ```
   Resource: Post
   Operation: Get All
   Subreddit: devops
   Limit: 10
   ```

3. **Node: Code (Transform Data)**
   ```javascript
   const items = [];
   
   for (const item of $input.all()) {
     const post = item.json;
     
     items.push({
       title: post.title,
       slug: post.title.toLowerCase()
         .replace(/[^a-z0-9]+/g, '-')
         .replace(/^-|-$/g, ''),
       content: post.selftext || post.title,
       excerpt: (post.selftext || post.title).substring(0, 200),
       coverImage: post.thumbnail !== 'self' ? post.thumbnail : null,
       metaTitle: post.title,
       metaDescription: (post.selftext || post.title).substring(0, 160),
       metaKeywords: 'reddit, devops, automation',
       isPublished: true
     });
   }
   
   return items;
   ```

4. **Node: HTTP Request (Create Articles)**
   ```
   Method: POST
   URL: {{$env.BLOG_API_URL}}/articles
   Headers:
     X-API-Key: {{$env.BLOG_API_KEY}}
     Content-Type: application/json
   Body: {{$json}}
   ```

### 3.3. Mettre à jour les statistiques

**Workflow : Google Analytics → Blog**

1. **Trigger: Schedule (Daily)**

2. **Node: Google Analytics**
   ```
   Resource: Report
   Operation: Get
   Metrics: pageviews
   Dimensions: pagePath
   ```

3. **Node: Code (Match URLs to Articles)**
   ```javascript
   // Récupérer les articles depuis l'API
   const articlesResponse = await fetch(`${process.env.BLOG_API_URL}/articles`, {
     headers: {
       'X-API-Key': process.env.BLOG_API_KEY
     }
   });
   
   const articles = await articlesResponse.json();
   
   // Matcher les vues avec les articles
   const updates = [];
   
   for (const item of $input.all()) {
     const path = item.json.pagePath;
     const views = item.json.pageviews;
     
     // Trouver l'article correspondant
     const article = articles.data.find(a => 
       path.includes(a.slug)
     );
     
     if (article) {
       updates.push({
         articleId: article.id,
         viewCount: views
       });
     }
   }
   
   return updates;
   ```

4. **Node: HTTP Request (Update Articles)**
   ```
   Method: PATCH
   URL: {{$env.BLOG_API_URL}}/articles/{{$json.articleId}}
   Headers:
     X-API-Key: {{$env.BLOG_API_KEY}}
     Content-Type: application/json
   Body:
   {
     "viewCount": {{$json.viewCount}}
   }
   ```

### 3.4. Backup automatique

**Workflow : Export all content**

1. **Trigger: Schedule (Weekly)**

2. **Node: HTTP Request (Get All Articles)**
   ```
   Method: GET
   URL: {{$env.BLOG_API_URL}}/articles?limit=1000
   Headers:
     X-API-Key: {{$env.BLOG_API_KEY}}
   ```

3. **Node: Code (Format as JSON)**
   ```javascript
   const backup = {
     date: new Date().toISOString(),
     articles: $input.all().map(item => item.json)
   };
   
   return [{ json: backup }];
   ```

4. **Node: Write Binary File**
   ```
   File Name: blog-backup-{{$now.format('YYYY-MM-DD')}}.json
   ```

5. **Node: Google Drive (Upload)**
   ```
   Resource: File
   Operation: Upload
   Folder ID: your-backup-folder-id
   ```

---

## 4. Authentification

### Headers requis

```javascript
// Avec API Key (recommandé pour N8N)
{
  "X-API-Key": "mbk_live_abc123...",
  "Content-Type": "application/json"
}

// OU avec JWT (si nécessaire)
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs...",
  "Content-Type": "application/json"
}
```

### Node N8N HTTP Request Configuration

```
Authentication: None (géré manuellement via headers)

Headers:
  Name: X-API-Key
  Value: {{$env.BLOG_API_KEY}}
  
  Name: Content-Type
  Value: application/json
```

---

## 5. Troubleshooting

### Erreur 401 Unauthorized

```
❌ {"error": "No API key provided"}
```

**Solution :**
- Vérifier que le header `X-API-Key` est présent
- Vérifier que la clé commence par `mbk_live_`
- Vérifier que la clé n'est pas expirée

```bash
# Vérifier la clé API
curl http://localhost:3000/api/api-keys/your-key-id \
  -H "Authorization: Bearer your-jwt"
```

### Erreur 403 Forbidden

```
❌ {"error": "Write permission required"}
```

**Solution :**
- Vérifier les permissions de l'API Key
- Créer une nouvelle clé avec `canWrite: true`

```bash
# Mettre à jour les permissions
curl -X PATCH http://localhost:3000/api/api-keys/your-key-id \
  -H "Authorization: Bearer your-jwt" \
  -H "Content-Type: application/json" \
  -d '{"canWrite": true}'
```

### Erreur 429 Too Many Requests

```
❌ {"error": "API rate limit exceeded"}
```

**Solution :**
- Attendre la fin de la fenêtre de rate limiting
- Augmenter la limite dans l'API Key

```bash
# Augmenter le rate limit
curl -X PATCH http://localhost:3000/api/api-keys/your-key-id \
  -H "Authorization: Bearer your-jwt" \
  -H "Content-Type: application/json" \
  -d '{"rateLimit": 5000}'
```

### Logs d'utilisation

```bash
# Voir les logs d'utilisation de l'API Key
curl http://localhost:3000/api/api-keys/your-key-id/logs \
  -H "Authorization: Bearer your-jwt"

# Response
{
  "data": [
    {
      "action": "API_KEY_USED",
      "resource": "ApiKey",
      "ipAddress": "1.2.3.4",
      "userAgent": "n8n",
      "metadata": {
        "endpoint": "/api/articles",
        "method": "POST"
      },
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

## 📊 Monitoring N8N

### Créer un workflow de monitoring

**Workflow : Check API Health**

1. **Trigger: Schedule (Every 5 minutes)**

2. **Node: HTTP Request (Health Check)**
   ```
   Method: GET
   URL: {{$env.BLOG_API_URL}}/health
   ```

3. **Node: IF (Check Status)**
   ```
   Condition: {{$json.status}} equals "ok"
   ```

4. **Node: Send Alert (Si erreur)**
   ```
   Send email/Slack notification if status is not "ok"
   ```

---

## 🔒 Sécurité N8N

### Bonnes pratiques

1. **Limiter les permissions**
   ```json
   {
     "canRead": true,
     "canWrite": true,
     "canDelete": false  // ⚠️ Ne jamais activer pour N8N
   }
   ```

2. **Rotation des clés**
   - Créer une nouvelle clé tous les 3-6 mois
   - Supprimer l'ancienne après migration

3. **Monitoring**
   - Vérifier régulièrement les logs d'utilisation
   - Alerter sur comportements anormaux

4. **Rate limiting**
   - Ajuster selon vos besoins (1000-5000 req/h)

---

## 📚 Ressources

- [Backend API Documentation](../README.md)
- [N8N Documentation](https://docs.n8n.io)
- [Prisma Schema](../prisma/schema.prisma)

---

**Made with ❤️ for Modern Blog Leader + N8N**
