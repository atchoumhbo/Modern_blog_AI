# 🚀 Système N8N - Reddit → AI → Strapi

## 📋 Description

Système automatisé complet pour générer des articles de blog à partir de posts Reddit en utilisant l'IA et les publier dans Strapi CMS.

## 🔧 Fonctionnalités

- **🕷️ Scraping Reddit intelligent** avec filtrage par mots-clés
- **🧠 Analyse IA** via Perplexity pour contexte technique
- **✍️ Génération d'articles** via OpenAI GPT
- **🌐 Traduction automatique** via Groq (FR ⟷ EN)
- **📊 Tracking SQLite** pour éviter les doublons
- **📝 Publication Strapi** automatique

## 🗄️ Base de Données de Tracking

Le système utilise SQLite pour tracker les posts Reddit déjà traités :

```sql
CREATE TABLE processed_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subreddit TEXT NOT NULL,
  url TEXT NOT NULL,
  processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  strapi_id_fr INTEGER,
  strapi_id_en INTEGER,
  impact_score INTEGER,
  processing_priority INTEGER
);
```

## 🚀 Installation

1. **Installer les dépendances** :
```bash
cd backend
npm install sqlite3
```

2. **Configurer les variables d'environnement** (déjà fait dans .env) :
```bash
# APIs IA
OPENAI_API_KEY=your-key
PERPLEXITY_API_KEY=your-key
GROQ_API_KEY=your-key

# Strapi
STRAPI_N8N_API_TOKEN=your-token
CLOUDFLARE_TUNNEL_URL=your-tunnel-url
```

3. **Initialiser la base de données** :
```bash
cd backend/n8n
node init-database.js
```

## 🧪 Tests

### Test rapide du système
```bash
cd backend/n8n
node test-n8n-quick.js
```

### Test du tracking SQLite
```bash
node test-tracker.js
```

### Test des traductions Groq
```bash
node test-groq.js
```

### Test du workflow complet (démo)
```bash
node test-n8n-workflow.js
```

## 🏃‍♂️ Exécution

### Workflow complet
```bash
cd backend/n8n
node n8n-workflow-reproduction.js
```

Le workflow va :
1. 🔍 Chercher des posts Reddit sur r/AskProgramming
2. 📊 Filtrer les posts non traités (via SQLite)
3. 🤖 Analyser avec Perplexity AI
4. ✍️ Générer un article avec OpenAI
5. 🌐 Traduire en FR/EN avec Groq
6. 📝 Publier dans Strapi
7. ✅ Marquer comme traité dans SQLite

## 📊 Monitoring

### Statistiques du tracker
```javascript
const tracker = new RedditTracker();
const stats = await tracker.getStats();
console.log(stats);
// { total: 45, today: 3, week: 12 }
```

### Nettoyage automatique
```javascript
await tracker.cleanOldPosts(30); // Supprime posts > 30 jours
```

## 🎯 Configuration Avancée

### Personnaliser les sources Reddit
```javascript
const CONFIG = {
  REDDIT_SUBREDDIT: 'AskProgramming', // ou 'Intune', 'sysadmin', etc.
  REDDIT_KEYWORD: 'error issue',      // mots-clés à rechercher
  REDDIT_LIMIT: 50                    // nombre de posts à analyser
};
```

### Adapter les prompts IA
Modifiez les prompts dans `n8n-workflow-reproduction.js` selon vos besoins.

## 🔄 Workflow Automatique

Pour automatiser l'exécution, vous pouvez :

1. **Cron Job** (Linux/Mac) :
```bash
# Exécuter toutes les heures
0 * * * * cd /path/to/backend/n8n && node n8n-workflow-reproduction.js
```

2. **Task Scheduler** (Windows) ou **PM2** pour un service permanent

## 📈 Résultats

Le système génère automatiquement :
- ✅ Articles techniques de qualité (800-1200 mots)
- ✅ Versions FR et EN 
- ✅ SEO optimisé
- ✅ Tracking complet des sources
- ✅ Pas de doublons

## 🎉 Status

🟢 **SYSTÈME OPÉRATIONNEL** - Prêt pour la production !

---

*Développé avec ❤️ pour automatiser la création de contenu technique*