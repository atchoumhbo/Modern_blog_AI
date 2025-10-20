# 🎨 Image Generator V2 - Documentation Complète

Architecture professionnelle de génération d'images avec IA pour articles de blog.

## 📋 Table des Matières

- [Vue d'Ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Best Practices Implémentées](#best-practices-implémentées)
- [Contextes Supportés](#contextes-supportés)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'Ensemble

Image Generator V2 est un système complet de génération d'images par IA avec :

- ✅ **Prompts Contextuels Intelligents** - Microsoft 365, Sécurité, Tech, Cloud, DevOps
- ✅ **Multi-Providers** - Stability AI SD3, OpenAI DALL-E 3
- ✅ **Cache Intelligent** - Évite les générations en double
- ✅ **Rate Limiting** - Respect des limites API
- ✅ **Retry Logic** - Backoff exponentiel sur erreurs
- ✅ **Optimisation d'Images** - Compression Sharp automatique
- ✅ **Validation Complète** - Inputs, environnement, options
- ✅ **Logging Structuré** - Métriques et statistiques détaillées

---

## 🏗️ Architecture

```
v2/
├── core/                       # Logique métier principale
│   ├── image-generator.js      # Orchestrateur principal
│   ├── prompt-engine.js        # Génération de prompts contextuels
│   └── provider-manager.js     # Gestion multi-providers
├── utils/                      # Utilitaires
│   ├── retry.js                # Retry avec backoff exponentiel
│   ├── rate-limiter.js         # Rate limiting par provider
│   ├── validation.js           # Validation des inputs
│   ├── logger.js               # Logging structuré + métriques
│   ├── cache-manager.js        # Système de cache
│   └── image-optimizer.js      # Optimisation Sharp
├── config/                     # Configuration
│   ├── contexts.js             # Contextes M365, Security, Tech
│   └── providers.js            # Config Stability AI, OpenAI
├── index.js                    # Point d'entrée
└── README-V2.md                # Cette documentation
```

---

## 📦 Installation

### 1. Dépendances NPM

```bash
# Dans le dossier backend/
npm install sharp node-cache
```

### 2. Variables d'Environnement

Créer/modifier `.env` dans `backend/` :

```bash
# Provider par défaut (stability-ai ou openai-dalle)
IMAGE_PROVIDER=stability-ai

# Clés API (au moins une requise)
STABILITY_API_KEY=sk-your-stability-key-here
OPENAI_API_KEY=sk-your-openai-key-here

# Optionnel
LOG_LEVEL=info  # debug, info, warn, error
```

### 3. Vérification

```bash
node backend/n8n/v2/index.js --stats
```

---

## 🚀 Utilisation

### Usage Basique

```javascript
const { imageGenerator } = require('./backend/n8n/v2');

// Générer une image
const result = await imageGenerator.generateArticleImage(
  'Microsoft Teams Security Best Practices',
  'MicrosoftTeams'
);

console.log('Image générée:', result.filename);
console.log('URL:', result.url);
console.log('Coût:', result.cost);
```

### Avec Options

```javascript
const result = await imageGenerator.generateArticleImage(
  'React Hooks Tutorial',
  'reactjs',
  {
    provider: 'stability-ai',      // ou 'openai-dalle'
    aspectRatio: '16:9',           // Pour Stability AI
    outputFormat: 'webp',          // png, jpeg, webp
    quality: 90,                   // 1-100
    maxWidth: 1920,
    maxHeight: 1080,
    enableCache: true,             // Utiliser le cache
    enableOptimization: true       // Optimiser avec Sharp
  }
);
```

### Ligne de Commande

```bash
# Génération simple
node v2/index.js "Learn Docker Containers"

# Avec subreddit
node v2/index.js "Azure Security" azure

# Avec options
node v2/index.js "React Tips" reactjs --provider=stability-ai --format=webp

# Stats
node v2/index.js --stats

# Nettoyer le cache
node v2/index.js --cleanup
```

---

## ✨ Best Practices Implémentées

### 1. ✅ Retry Logic avec Backoff Exponentiel

```javascript
// Automatic retry sur erreurs network/timeout
// 3 tentatives avec délai croissant: 1s, 2s, 4s
```

### 2. ✅ Rate Limiting

```javascript
// Stability AI: 10 req/min
// OpenAI DALL-E: 5 req/min
// Attente automatique si limite atteinte
```

### 3. ✅ Validation Complète

```javascript
// Titre: 3-255 caractères
// Subreddit: format valide
// Options: validation par provider
// Environnement: clés API présentes
```

### 4. ✅ Cache Intelligent

```javascript
// MD5 hash: titre + subreddit + options
// Durée: 24h par défaut
// Auto-cleanup des fichiers expirés
```

### 5. ✅ Optimisation d'Images

```javascript
// Compression Sharp automatique
// Redimensionnement intelligent
// Conversion de format
// Réduction jusqu'à 70% de la taille
```

### 6. ✅ Logging Structuré

```javascript
// Métriques: coûts, temps, succès/échecs
// Niveaux: debug, info, warn, error
// Stats détaillées par provider
```

### 7. ✅ Fallback Automatique

```javascript
// Si Stability AI échoue → Bascule sur DALL-E
// Si DALL-E échoue → Bascule sur Stability AI
// Transparant pour l'utilisateur
```

---

## 🎨 Contextes Supportés

### Microsoft 365 & Azure

| Contexte | Keywords | Style Visuel |
|----------|----------|--------------|
| **Microsoft 365** | office 365, o365, microsoft 365 | Interface Office moderne, bleu/blanc |
| **Teams** | teams, microsoft teams | Collaboration, violet, video call |
| **SharePoint** | sharepoint, document management | Bibliothèque docs, teal |
| **Intune** | intune, mdm, endpoint management | Gestion devices, sécurité |
| **Azure** | azure, azure cloud | Infrastructure cloud, bleu Azure |
| **PowerShell** | powershell, ps1, scripting | Terminal bleu, automation |

### Sécurité & Cybersecurity

| Contexte | Keywords | Style Visuel |
|----------|----------|--------------|
| **CVE** | cve, vulnerability, security flaw | Alertes rouges, vulnérabilités |
| **Malware** | malware, virus, ransomware | Cyber menaces, dark theme |
| **Zero-Day** | zero-day, 0-day, exploit | Breach critique, urgent |
| **Data Breach** | data breach, leaked data | Données compromises, rouge |
| **Phishing** | phishing, email scam | Email piégé, warning |
| **Pentest** | pentest, ethical hacking | Hacking éthique, terminal |
| **Encryption** | encryption, cryptography, ssl | Cadenas, sécurisé, vert |
| **Firewall** | firewall, network security | Barrière protectrice, réseau |

### Technologies Générales

| Contexte | Keywords | Style Visuel |
|----------|----------|--------------|
| **Web Dev** | web development, webdev | Workspace moderne, code editor |
| **JavaScript** | javascript, js, nodejs | Logo JS jaune, async code |
| **React** | react, reactjs, hooks | Logo React cyan, components |
| **Next.js** | nextjs, next.js, vercel | Logo noir, SSR concept |
| **Docker** | docker, container | Logo baleine bleue, containers |
| **Kubernetes** | kubernetes, k8s | Logo hexagonal bleu, cluster |
| **CI/CD** | ci/cd, pipeline, github actions | Pipeline DevOps, automation |
| **AWS** | aws, amazon web services | Logo orange, cloud infra |

### Concepts Techniques

- **Performance** - Optimisation, speed, benchmarks
- **Architecture** - Design patterns, microservices, system design
- **API** - REST, GraphQL, endpoints
- **Database** - SQL, NoSQL, data architecture

---

## ⚙️ Configuration

### Providers Config (`config/providers.js`)

```javascript
PROVIDERS: {
  'stability-ai': {
    baseURL: 'https://api.stability.ai',
    endpoint: '/v2beta/stable-image/generate/sd3',
    apiKey: process.env.STABILITY_API_KEY,
    costPerImage: 0.003,
    supportedAspectRatios: ['16:9', '1:1', '21:9', '2:3', '3:2'],
    supportedFormats: ['jpeg', 'png', 'webp'],
    rateLimit: { maxRequests: 10, timeWindow: 60000 }
  },
  'openai-dalle': {
    baseURL: 'https://api.openai.com/v1',
    endpoint: '/images/generations',
    apiKey: process.env.OPENAI_API_KEY,
    costPerImage: 0.04,
    supportedSizes: ['1024x1024', '1792x1024', '1024x1792'],
    rateLimit: { maxRequests: 5, timeWindow: 60000 }
  }
}
```

### Ajouter un Contexte Personnalisé

```javascript
const { promptEngine } = require('./v2');

promptEngine.addCustomContext('terraform', {
  category: 'Terraform IaC',
  keywords: ['terraform', 'infrastructure as code', 'tf'],
  visualStyle: 'infrastructure diagram, purple Terraform logo, IaC concept',
  technicalElements: ['cloud resources', 'terraform modules'],
  dominantColors: ['#7B42BC', '#FFFFFF'],
  style: 'digital-art',
  mood: 'professional, technical'
});
```

---

## 📚 API Reference

### ImageGenerator

```javascript
const generator = new ImageGenerator({
  outputDir: './custom/output',
  enableCache: true,
  enableOptimization: true,
  defaultProvider: 'stability-ai'
});

// Méthode principale
await generator.generateArticleImage(title, subreddit, options);

// Générer plusieurs variantes
await generator.generateVariants(title, subreddit, [
  { aspectRatio: '16:9' },
  { aspectRatio: '1:1' },
  { aspectRatio: '9:16' }
]);

// Stats
const stats = generator.getStats();
generator.displayStats();

// Maintenance
generator.cleanupCache();
```

### PromptEngine

```javascript
const { promptEngine } = require('./v2');

// Générer un prompt
const promptData = promptEngine.generateEnrichedPrompt(
  'Microsoft Teams Security',
  'MicrosoftTeams'
);

console.log(promptData.prompt);          // Prompt text
console.log(promptData.negativePrompt);  // Negative prompt
console.log(promptData.style);           // Style preset
console.log(promptData.metadata);        // Metadata

// Ajouter un contexte
promptEngine.addCustomContext('custom-key', {...});

// Lister les contextes
const contexts = promptEngine.listContexts();
```

### CacheManager

```javascript
const { cacheManager } = require('./v2');

// Vérifier si en cache
const key = cacheManager.getCacheKey(title, subreddit, options);
const exists = cacheManager.has(key);

// Récupérer du cache
const result = cacheManager.get(key);

// Sauvegarder dans le cache
cacheManager.set(key, result);

// Nettoyer le cache expiré
const cleaned = cacheManager.cleanup();

// Vider tout le cache
cacheManager.clear();

// Stats
const stats = cacheManager.getStats();
```

### Logger

```javascript
const { logger } = require('./v2');

// Logs
logger.debug('Message de debug', { data: '...' });
logger.info('Information');
logger.success('Opération réussie');
logger.warn('Avertissement');
logger.error('Erreur', error);

// Timer
const timer = logger.startTimer('Mon opération');
// ... opération ...
const duration = timer.stop(); // Log automatique

// Métriques
const metrics = logger.getMetrics();
logger.logStats();
```

---

## 🐛 Troubleshooting

### Erreur: "Clé API manquante"

```bash
# Vérifier .env
cat backend/.env | grep STABILITY_API_KEY

# Ajouter la clé
echo "STABILITY_API_KEY=sk-your-key" >> backend/.env
```

### Erreur: "Rate limit atteint"

Le système attend automatiquement. Si c'est trop lent :

```javascript
// Réduire le nombre de requêtes ou augmenter la fenêtre
// Dans config/providers.js
rateLimit: { maxRequests: 5, timeWindow: 60000 }
```

### Erreur: "Cannot find module 'sharp'"

```bash
cd backend
npm install sharp
```

### Cache ne fonctionne pas

```bash
# Vérifier le dossier cache
ls -la backend/n8n/cache/

# Nettoyer le cache
node backend/n8n/v2/index.js --cleanup
```

### Images trop grandes

```javascript
// Réduire la qualité ou la taille
const result = await imageGenerator.generateArticleImage(title, subreddit, {
  quality: 70,          // Au lieu de 85
  maxWidth: 1280,       // Au lieu de 1920
  outputFormat: 'webp'  // Plus compressé que PNG
});
```

### Prompts pas assez spécifiques

```javascript
// Ajouter un contexte personnalisé (voir section Configuration)
promptEngine.addCustomContext('my-context', {...});
```

---

## 📊 Métriques & Monitoring

### Afficher les Stats

```bash
node v2/index.js --stats
```

### Stats Disponibles

- **Génération** : Total, réussies, échouées, taux de succès
- **Coûts** : Total, moyen par image
- **Temps** : Total, moyen par génération
- **Cache** : Taille, entrées valides/expirées
- **Rate Limits** : Utilisation par provider
- **Prompts** : Nombre de contextes, catégories

---

## 🔄 Migration depuis V1

### Changements Majeurs

1. **Import différent**
   ```javascript
   // V1
   const generateImage = require('./image-generator-sd3');
   
   // V2
   const { imageGenerator } = require('./v2');
   ```

2. **API améliorée**
   ```javascript
   // V1
   const result = await generateArticleImage(title, subreddit, options);
   
   // V2 (même chose, mais plus de fonctionnalités)
   const result = await imageGenerator.generateArticleImage(title, subreddit, options);
   ```

3. **Résultat enrichi**
   ```javascript
   // V2 renvoie beaucoup plus de metadata
   result.metadata.category
   result.optimization.compressionRatio
   result.prompt.text
   ```

---

## 🚀 Roadmap

- [ ] Support TypeScript
- [ ] Queue system pour générations multiples
- [ ] Webhooks pour notifications
- [ ] Dashboard web de monitoring
- [ ] Tests unitaires avec Jest
- [ ] Support pour plus de providers (Midjourney API)
- [ ] Génération de variantes responsive automatique

---

## 📄 Licence

MIT

---

## 🤝 Support

Pour toute question ou problème :
1. Vérifier ce README
2. Consulter les logs avec `LOG_LEVEL=debug`
3. Tester avec `node v2/index.js --stats`

---

**Créé avec ❤️ pour un workflow N8N → Strapi optimisé**
