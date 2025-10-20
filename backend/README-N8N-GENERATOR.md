# 🚀 Générateur de Workflow N8N - Reddit → AI → Strapi

Ce système génère automatiquement des workflows N8N pour créer des articles de blog à partir de problèmes techniques Reddit en utilisant l'IA.

## 🎯 Fonctionnalités

- **Génération automatique** de workflows N8N complets
- **Recherche intelligente** sur Reddit avec filtrage par mots-clés
- **Analyse IA** via Perplexity pour contexte technique
- **Génération d'articles** via OpenAI GPT
- **Publication automatique** dans Strapi CMS
- **Configuration paramétrable** (subreddit, mots-clés, etc.)

## 📋 Prérequis

- Node.js installé
- Instance N8N accessible
- Credentials API configurés :
  - Reddit OAuth2
  - Perplexity API
  - OpenAI API
  - Token Strapi

## 🚀 Utilisation Rapide

### 1. Génération Simple
```bash
# Générer avec configuration par défaut
node generate-n8n-ready.js
```

### 2. Génération Personnalisée
```bash
# Générer avec paramètres personnalisés
node n8n-workflow-generator.js --subreddit Intune --keyword "android" --limit 25 --tunnelUrl "https://votre-tunnel.trycloudflare.com"
```

### 3. Démonstration Complète
```bash
# Voir une démonstration avec explications
node demo-n8n-generator.js
```

### 4. Validation
```bash
# Valider le workflow généré
node validate-n8n-workflow.js
```

## 📁 Fichiers Générés

| Fichier | Description |
|---------|-------------|
| `reddit-strapi-workflow-ready.json` | Workflow principal prêt à importer |
| `demo-n8n-workflow.json` | Workflow de démonstration |

## ⚙️ Configuration

### Configuration par défaut (generate-n8n-ready.js)
```javascript
{
  name: "Reddit Tech Problem Analysis & Content Generation with Strapi",
  subreddit: "Intune",
  keyword: "android",
  limit: 50,
  tunnelUrl: "https://guests-metabolism-retention-saints.trycloudflare.com",
  strapiToken: "votre-token-strapi"
}
```

### Configuration CLI (n8n-workflow-generator.js)
```bash
--name "Nom du workflow"
--subreddit "NomSubreddit" 
--keyword "mot-clé"
--limit 25
--tunnelUrl "https://votre-tunnel.com"
--strapiToken "votre-token"
```

## 🔧 Architecture Workflow

Le workflow généré contient 7 nodes connectés :

1. **Déclencheur Programmé** - Exécution toutes les heures
2. **Reddit Search** - Recherche posts avec mots-clés
3. **Code Filter** - Filtrage et scoring par impact
4. **Perplexity Analysis** - Analyse technique contextuelle  
5. **OpenAI Generation** - Génération article expert
6. **Strapi Publication** - Publication automatique CMS
7. **Error Handling** - Gestion d'erreurs robuste

## 📊 Processus de Scoring

Le système évalue les posts Reddit selon :

- **Score original** : Upvotes, commentaires, ratio
- **Mots-clés techniques** : 25+ termes spécialisés détectés
- **Bonus fraîcheur** : Posts récents favorisés
- **Multiplicateur impact** : Calcul score composite final

## 🔑 Configuration Credentials N8N

1. **Reddit OAuth2** :
   - Client ID + Secret
   - Scopes : `read`

2. **Perplexity API** :
   - API Key
   - Model : `llama-3.1-sonar-small-128k-online`

3. **OpenAI API** :
   - API Key  
   - Model : `gpt-4o-mini`

4. **Strapi Token** :
   - Bearer Token (pré-configuré)

## 🌐 URL Tunnel Cloudflare

Le tunnel Cloudflare permet d'exposer votre instance Strapi locale :

- **URL actuelle** : `https://guests-metabolism-retention-saints.trycloudflare.com`
- **Endpoint API** : `/api/articles`
- **Méthode** : POST avec Bearer Auth

## 💰 Coûts Estimés

- **Perplexity API** : ~$0.03 par analyse
- **OpenAI GPT-4o-mini** : ~$0.05 par article
- **Total** : ~$0.08-0.12 par article généré

## ⏱️ Performance

- **Temps génération** : 2-3 minutes par article
- **Fréquence** : 1 article/heure maximum
- **Taille workflow** : ~11-13KB
- **Nodes** : 7 connectés

## 🔍 Débogage

### Validation Workflow
```bash
node validate-n8n-workflow.js
```

### Vérifications importantes :
- ✅ Structure JSON valide
- ✅ IDs uniques générés
- ✅ Connexions entre nodes
- ✅ URLs tunnel configurées
- ✅ Credentials mappés

## 📝 Exemple d'Article Généré

Le workflow produit des articles de 1200+ mots avec :

- **Titre optimisé SEO**
- **Introduction technique**
- **Analyse détaillée du problème**
- **Solutions étape par étape**
- **Ressources complémentaires**
- **Conclusion et perspectives**

## 🚀 Import dans N8N

1. Ouvrir l'interface N8N
2. Cliquer "New Workflow" → "Import"
3. Sélectionner le fichier `.json` généré
4. Configurer les credentials requis
5. Activer le workflow
6. Surveiller l'exécution et les logs

## 🛡️ Bonnes Pratiques

- **Tester manuellement** avant activation automatique
- **Surveiller les coûts** API régulièrement  
- **Mettre à jour** l'URL tunnel périodiquement
- **Sauvegarder** les workflows fonctionnels
- **Monitorer** les publications Strapi

## 🔧 Troubleshooting

### Problèmes fréquents :

1. **URL tunnel expirée** → Mettre à jour dans la config
2. **Credentials manquants** → Configurer dans N8N
3. **Quota API dépassé** → Vérifier limites Perplexity/OpenAI
4. **Posts non trouvés** → Ajuster mots-clés de recherche
5. **Erreur publication** → Vérifier token Strapi

## 📈 Extensions Possibles

- Support multi-subreddits
- Génération images via DALL-E
- Publication multi-plateformes
- Analyse sentiment avancée
- Planification éditoriale
- Metrics et analytics

---

✨ **Workflow prêt à utiliser !** Importez dans N8N et laissez l'IA générer vos articles automatiquement.