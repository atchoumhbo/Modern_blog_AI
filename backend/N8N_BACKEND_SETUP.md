# Configuration Backend Strapi pour N8N

## Étapes de Configuration

### 1. Générer un Token API dans Strapi Admin

1. Démarrer Strapi :
```bash
cd backend
npm run develop
```

2. Aller sur http://localhost:1337/admin

3. Naviguer vers **Settings → API Tokens**

4. Cliquer sur **Create new API Token**

5. Configurer le token :
   - **Name**: `N8N Automation Token`
   - **Description**: `Token pour l'automation N8N - création/modification de contenu`
   - **Token duration**: `Unlimited`
   - **Token type**: `Custom`

6. **Permissions à configurer** :
   ```
   Article (api::article.article)
   ✅ find
   ✅ findOne  
   ✅ create
   ✅ update
   ✅ delete

   Project (api::project.project)
   ✅ find
   ✅ findOne
   ✅ create
   ✅ update
   ✅ delete

   Category (api::category.category)
   ✅ find
   ✅ findOne

   Tag (api::tag.tag)
   ✅ find
   ✅ findOne

   Upload
   ✅ upload
   ✅ destroy
   ```

7. **Copier le token généré** et l'ajouter dans `.env`

### 2. Variables d'Environnement

Ajouter dans `backend/.env` :
```bash
# Token API pour N8N
STRAPI_N8N_API_TOKEN=your-generated-token-here

# Secret pour webhook validation
N8N_WEBHOOK_SECRET=your-super-secret-webhook-key

# URL pour les webhooks sortants (optionnel)
N8N_WEBHOOK_URL=http://localhost:5678/webhook
```

### 3. Content Types à Créer

Dans l'admin Strapi, créer ces Content Types :

#### Article (api::article.article)
```json
{
  "kind": "collectionType",
  "collectionName": "articles",
  "info": {
    "singularName": "article",
    "pluralName": "articles",
    "displayName": "Article"
  },
  "attributes": {
    "title": {
      "type": "string",
      "required": true,
      "maxLength": 200
    },
    "slug": {
      "type": "uid",
      "targetField": "title",
      "required": true
    },
    "excerpt": {
      "type": "text",
      "maxLength": 500
    },
    "body": {
      "type": "richtext",
      "required": true
    },
    "date": {
      "type": "datetime",
      "default": "2025-09-29T00:00:00.000Z"
    },
    "featuredImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "category": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::category.category",
      "inversedBy": "articles"
    },
    "tags": {
      "type": "relation", 
      "relation": "manyToMany",
      "target": "api::tag.tag",
      "mappedBy": "articles"
    },
    "author": {
      "type": "relation",
      "relation": "manyToOne", 
      "target": "api::author.author",
      "inversedBy": "articles"
    },
    "seo": {
      "type": "component",
      "component": "shared.seo",
      "repeatable": false
    }
  }
}
```

#### Project (api::project.project)
```json
{
  "kind": "collectionType",
  "collectionName": "projects",
  "info": {
    "singularName": "project",
    "pluralName": "projects", 
    "displayName": "Project"
  },
  "attributes": {
    "title": {
      "type": "string",
      "required": true,
      "maxLength": 200
    },
    "slug": {
      "type": "uid",
      "targetField": "title",
      "required": true
    },
    "description": {
      "type": "text",
      "required": true,
      "maxLength": 1000
    },
    "content": {
      "type": "richtext"
    },
    "status": {
      "type": "enumeration",
      "enum": ["active", "completed", "archived", "on-hold"],
      "default": "active"
    },
    "featuredImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "gallery": {
      "type": "media",
      "multiple": true,
      "allowedTypes": ["images"]
    },
    "technologies": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::technology.technology",
      "mappedBy": "projects"
    },
    "category": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::category.category",
      "inversedBy": "projects"
    },
    "demoUrl": {
      "type": "string"
    },
    "githubUrl": {
      "type": "string"  
    },
    "seo": {
      "type": "component",
      "component": "shared.seo",
      "repeatable": false
    }
  }
}
```

### 4. Test de l'API

Une fois configuré, tester avec :

```bash
# Test de récupération d'articles
curl -X GET "http://localhost:1337/api/articles" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test de création d'article  
curl -X POST "http://localhost:1337/api/articles" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "title": "Test Article from N8N",
      "slug": "test-article-n8n",  
      "excerpt": "Test d'\''intégration N8N",
      "body": "# Test\n\nContenu de test",
      "publishedAt": "2025-09-29T10:00:00Z"
    }
  }'
```

### 5. Configuration des Permissions

Aller dans **Settings → Users & Permissions Plugin → Roles → Public** :

- Article : `find`, `findOne`
- Project : `find`, `findOne`  
- Category : `find`, `findOne`
- Tag : `find`, `findOne`

### 6. Webhooks Sortants (Optionnel)

Pour notifier N8N lors de modifications :

**Settings → Webhooks → Create new webhook** :
- **Name**: `N8N Article Created`
- **URL**: `http://localhost:5678/webhook/article-created`
- **Events**: `Entry Create` sur Article
- **Headers**: 
  ```json
  {
    "Content-Type": "application/json",
    "X-Webhook-Source": "strapi"
  }
  ```

## ✅ Checklist de Configuration

- [ ] Token API N8N généré
- [ ] Permissions configurées  
- [ ] Content Types Article et Project créés
- [ ] Variables d'environnement ajoutées
- [ ] Test API réussi
- [ ] Webhooks configurés (optionnel)

Une fois cette configuration terminée, N8N pourra créer du contenu dans votre Strapi ! 🚀