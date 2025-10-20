# 🎯 Workflow Complet V2 - Documentation

## Vue d'ensemble

Ce système automatise la création complète d'articles de blog avec :
- ✅ Génération d'images V2 (contextes intelligents)
- ✅ Summary automatique avec détection de langue
- ✅ Publication dans Strapi
- ✅ Affichage élégant dans le frontend

---

## 📋 Composants

### 1. Backend : `test-complete-workflow-v2.js`

**Fonctionnalités :**
- Récupère des posts Reddit populaires
- Génère un article avec Perplexity AI
- Génère un summary automatique (détecte la langue)
- Génère une image avec le système V2
- Upload vers Strapi avec toutes les métadonnées

**Détection de langue :**
```javascript
// Langues supportées : FR, EN, ES, DE
const language = detectLanguage(content);
// Génère le summary dans la langue détectée
const { summary, language, languageName } = await generateSummary(content, title);
```

**Utilisation :**
```bash
# Depuis backend/n8n/
node test-complete-workflow-v2.js
```

**Prérequis API Keys :**
- `REDDIT_CLIENT_ID` + `REDDIT_CLIENT_SECRET`
- `PERPLEXITY_API_KEY`
- `OPENAI_API_KEY`
- `STABILITY_API_KEY`
- `STRAPI_N8N_API_TOKEN`

---

### 2. Frontend : Footer EUC365/IONOS

**Design respecté :**
```tsx
© 2019 - 2025 Created by EUC365 Hosted by IONOS
All Rights Reserved.
```

**Liens de confidentialité :**
- Change privacy settings
- Privacy settings history
- Revoke consents (avec confirmation)

**Localisation :**
`frontend/app/components/Footer.tsx`

---

### 3. Frontend : Affichage Summary

**Design "En bref" :**
- Bloc élégant avec icône info
- Fond dégradé bleu clair
- Bordure gauche bleue
- Dark mode supporté

**Localisation :**
`frontend/app/routes/blog/$slug.tsx`

**Affichage :**
```tsx
{post.excerpt && (
  <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
    <h3>En bref</h3>
    <p>{post.excerpt}</p>
  </div>
)}
```

---

## 🔄 Workflow Complet

```
┌─────────────────┐
│  Reddit API     │
│  r/reactjs      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Perplexity AI  │
│  Article 600w+  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  OpenAI GPT-4   │
│  Summary (2-3)  │
│  + Langue FR/EN │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Image Gen V2   │
│  Stability AI   │
│  27 contextes   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Strapi API     │
│  Article Draft  │
│  + Image + Meta │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Frontend Blog  │
│  Summary "Bref" │
│  Footer EUC365  │
└─────────────────┘
```

---

## 📊 Structure de données Strapi

### Article créé contient :

```json
{
  "title": "React Tutorial",
  "slug": "react-tutorial",
  "content": "...", // Article Markdown complet
  "excerpt": "Découvrez React.js, la bibliothèque JavaScript révolutionnaire pour créer des interfaces utilisateur modernes...", // Summary auto
  "featured_image": 123, // ID image uploadée
  "status": "draft",
  "language": "fr", // Langue détectée
  "metadata": {
    "redditUrl": "https://reddit.com/r/reactjs/...",
    "redditScore": 156,
    "subreddit": "reactjs",
    "imageProvider": "stability-ai",
    "imageCost": 0.003,
    "imageCategory": "React.js",
    "summaryLanguage": "français"
  }
}
```

---

## 🎨 Design Frontend

### Summary Box

**Couleurs :**
- Light mode : Gradient `blue-50` → `indigo-50`
- Dark mode : Gradient `blue-900/20` → `indigo-900/20`
- Bordure gauche : `blue-500` (4px)
- Icône : `blue-600` / `blue-400`

**Typographie :**
- Titre "En bref" : uppercase, tracking-wide, `text-sm`
- Texte : `text-base`, leading-relaxed

### Footer EUC365

**Structure :**
```
┌─────────────────────────────────────────┐
│  © 2019-2025 Created by EUC365          │
│  Hosted by IONOS                        │
│  All Rights Reserved.                   │
│                                         │
│  Change privacy | History | Revoke      │
└─────────────────────────────────────────┘
```

**Liens cliquables :**
- EUC365 → `https://euc365.com`
- IONOS → `https://www.ionos.fr`
- Privacy → `/privacy`
- History → `/privacy-history`
- Revoke → Confirmation popup

---

## 🧪 Test

### Exécuter le workflow complet :

```bash
cd backend/n8n
node test-complete-workflow-v2.js
```

### Sortie attendue :

```
🚀 === TEST WORKFLOW COMPLET V2 ===

🔑 Vérification des APIs:
   ✅ Reddit
   ✅ Perplexity
   ✅ OpenAI
   ✅ Stability AI
   ✅ Strapi

📡 Récupération de posts Reddit (r/reactjs)...
   ✅ 5 posts récupérés

📌 Post sélectionné:
   Titre: React 19 is here!
   Score: 234
   Subreddit: r/reactjs

✍️  Génération de l'article avec Perplexity...
   ✅ Article généré (1543 caractères)

📊 Génération du summary...
   🌍 Langue détectée: français
   ✅ Summary généré (186 caractères)
   📝 "Découvrez React 19, la nouvelle version majeure..."

🎨 Génération de l'image (V2)...
   ✅ Image générée:
      Fichier: article-react-19-is-here-1759785422410-xyz.png
      Coût: $0.0030
      Temps: 6.42s
      Catégorie: React.js

📤 Upload de l'image vers Strapi...
   ✅ Image uploadée (ID: 42)

📝 Création de l'article dans Strapi...
   ✅ Article créé (ID: 23)

============================================================
✅ WORKFLOW COMPLET V2 - SUCCÈS !
============================================================

📊 Résumé:
   📝 Article: React 19 is here!
   🌍 Langue: français
   📄 Summary: "Découvrez React 19, la nouvelle version majeure avec des amélioration..."
   🎨 Image: article-react-19-is-here-1759785422410-xyz.png
   💰 Coût image: $0.0030
   ⏱️  Temps image: 6.42s
   🆔 Article Strapi ID: 23
   🔗 URL: http://localhost:1337/api/articles/23
```

---

## 🔧 Configuration avancée

### Personnaliser le summary :

```javascript
// Dans test-complete-workflow-v2.js, ligne ~95
const { summary, language } = await generateSummary(
  articleContent,
  selectedPost.title,
  {
    maxLength: 300,        // Longueur max du summary
    temperature: 0.5,      // Plus conservateur (0-1)
    sentencesCount: 3      // Nombre de phrases
  }
);
```

### Changer le provider d'images :

```javascript
// Ligne ~143
const imageResult = await imageGenerator.generateArticleImage(
  selectedPost.title,
  selectedPost.subreddit,
  {
    provider: 'openai-dalle',  // Au lieu de 'stability-ai'
    aspectRatio: '16:9',
    quality: 85
  }
);
```

### Modifier le subreddit source :

```javascript
// Ligne ~89
const posts = await getRedditPosts('webdev', 5); // Au lieu de 'reactjs'
```

---

## 📁 Fichiers modifiés

### Nouveaux fichiers :
- ✅ `backend/n8n/test-complete-workflow-v2.js` - Script workflow complet

### Fichiers mis à jour :
- ✅ `frontend/app/components/Footer.tsx` - Footer EUC365/IONOS
- ✅ `frontend/app/routes/blog/$slug.tsx` - Affichage summary élégant

---

## 🚀 Intégration N8N (optionnel)

Le workflow peut être intégré dans N8N :

```javascript
// Node "Function" N8N
const { runCompleteWorkflowV2 } = require('./backend/n8n/test-complete-workflow-v2');

const result = await runCompleteWorkflowV2();

return {
  json: {
    success: result.success,
    articleId: result.article.id,
    imageUrl: result.image.url,
    summary: result.summary,
    language: result.language
  }
};
```

---

## 🎯 Résultat final

**Frontend (exemple React Tutorial) :**

```
┌───────────────────────────────────────────────┐
│  React Tutorial                               │
│  Par AI Author | 7 Oct 2025                   │
├───────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐ │
│  │ ℹ️  EN BREF                              │ │
│  │                                          │ │
│  │ Découvrez React.js, la bibliothèque     │ │
│  │ JavaScript révolutionnaire pour créer   │ │
│  │ des interfaces modernes et réactives.   │ │
│  └──────────────────────────────────────────┘ │
│                                               │
│  [IMAGE GÉNÉRÉE PAR V2]                       │
│                                               │
│  ## Introduction                              │
│  React is a powerful JavaScript library...   │
│                                               │
│  ...                                          │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│  Footer                                       │
│  © 2019-2025 Created by EUC365 Hosted by IONOS│
│  All Rights Reserved.                         │
│  Change privacy | History | Revoke            │
└───────────────────────────────────────────────┘
```

---

## 📚 Ressources

- [Image Generator V2](./v2/README-V2.md)
- [N8N Examples](./v2/EXAMPLES-N8N.js)
- [Strapi API](http://localhost:1337/documentation)

---

**✅ Système complet prêt à l'emploi !**
