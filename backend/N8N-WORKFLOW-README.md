# Workflow N8N Reproduction - Reddit to Strapi Automation

## 📋 Description

Reproduction exacte du workflow N8N "Reddit Tech Problem Analysis & Content Generation with Strapi" sous forme de script Node.js. Ce workflow automatise la création d'articles techniques à partir de posts Reddit.

## 🔄 Processus du Workflow

### Étapes exactes (reproduction fidèle du JSON N8N):

1. **Reddit - Recherche problèmes tech**
   - Recherche sur r/Intune avec keyword "android"
   - Limite: 50 posts
   - Tri par pertinence

2. **Filtrer et analyser les posts**
   - Score d'impact avec pondération
   - Bonus fraîcheur (< 24h)
   - Bonus controverse (upvote_ratio < 0.7)
   - Extraction mots-clés techniques avancés
   - Calcul priorité processing

3. **Sélectionner le post principal**
   - Tri par processing priority
   - Enrichissement métadonnées
   - Niveau de compétition

4. **Perplexity - Analyser et trouver URLs**
   - Modèle: sonar-pro
   - Recherche 5 sources Microsoft Intune
   - Réponse JSON structurée

5. **Extraire les URLs**
   - Validation sources Microsoft
   - Attribution scores autorité
   - Métadonnées validation

6. **Boucle pour chaque URL**
   - Récupération contenu (User-Agent spécifique)
   - Analyse Perplexity technique détaillée
   - Extraction insights structurés

7. **Collecteur et synthétiseur d'analyses**
   - Consolidation insights techniques
   - Déduplication solutions
   - Métriques qualité
   - Brief éditorial

8. **Créer prompt optimisé Lyra**
   - GPT-4 pour prompt structuré
   - Template article 1800 mots
   - Focus Android vs iOS Intune

9. **Générer l'article final**
   - GPT-3.5-turbo pour article
   - 1200 mots minimum
   - Structure technique

10. **Publier dans Strapi**
    - API Articles via tunnel Cloudflare
    - Métadonnées SEO complètes
    - Source tracking Reddit

## 🚀 Installation

```bash
# Cloner et installer dépendances
cd backend
npm install axios dotenv

# Configurer variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés API
```

## ⚙️ Configuration

### Variables d'environnement requises (.env):

```env
# API Keys pour workflow N8N
PERPLEXITY_API_KEY=your-perplexity-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
REDDIT_CLIENT_ID=your-reddit-client-id  # Optionnel
REDDIT_CLIENT_SECRET=your-reddit-client-secret  # Optionnel

# Configuration Strapi (déjà configuré)
STRAPI_N8N_API_TOKEN=a4239ed0a52427929d703538e1c298a37b088db1a2f859c17015d5eb150a64b1b5195d8287184867af8ecb923f3bcfec83cd238f18b9b3f4349fbd885edb243a7349adbe7b2c00f14aa453e12a4e003c8286f1393cb60eebb67635845390575185092c7cb277b17a565c3099c9477487d2f615323dd40226c18471f46d8176af
```

### Obtenir les clés API:

1. **Perplexity AI**: https://perplexity.ai
   - Créer compte
   - Générer API key dans Dashboard

2. **OpenAI**: https://openai.com
   - Créer compte
   - Générer API key dans API section

## 🎯 Utilisation

### Test rapide (données simulées):
```bash
node test-n8n-workflow.js
```

### Workflow complet (production):
```bash
node run-n8n-workflow.js
```

### Script direct:
```bash
node n8n-workflow-reproduction.js
```

## 📊 Résultats

Le workflow génère:

- **Articles techniques** de 1200-1800 mots
- **Métadonnées SEO** complètes
- **Tracking source** Reddit
- **Publication automatique** dans Strapi
- **Analyse coût** et métriques

### Structure article générée:
1. Introduction (200 mots)
2. Vue d'ensemble Intune Android vs iOS (300 mots)
3. Capacités spécifiques Android (500 mots)
4. Capacités spécifiques iOS (300 mots)
5. Comparaison pratique (400 mots)
6. Bonnes pratiques (100 mots)

## 🔧 Prérequis

- **Node.js** 16+
- **Strapi backend** actif
- **Tunnel Cloudflare** configuré
- **Clés API** Perplexity + OpenAI
- **Token Strapi** avec permissions Article

## 📁 Fichiers

- `n8n-workflow-reproduction.js` - Workflow complet reproduction exacte
- `run-n8n-workflow.js` - Script de lancement avec vérifications
- `test-n8n-workflow.js` - Test démo avec données mockées
- `.env` - Configuration variables d'environnement

## ⚡ Fonctionnalités avancées

### Filtrage intelligent:
- Score d'impact pondéré
- Bonus fraîcheur 24h
- Bonus controverse
- 25+ mots-clés techniques
- Priorité processing dynamique

### Analyse technique:
- 5 sources Microsoft par post
- Extraction insights structurés
- Consolidation solutions
- Déduplication automatique
- Métriques qualité

### Publication optimisée:
- SEO metadata complet
- Slug optimisé
- Source tracking
- Status published automatique
- Timestamps précis

## 🐛 Troubleshooting

### Erreurs courantes:

1. **"Variables manquantes"**
   - Vérifier .env avec clés API valides

2. **"Erreur Strapi"**
   - Vérifier tunnel Cloudflare actif
   - Vérifier backend Strapi démarré
   - Vérifier token API permissions

3. **"Erreur Perplexity/OpenAI"**
   - Vérifier clés API valides
   - Vérifier quota API non dépassé
   - Vérifier connexion internet

## 💰 Coûts estimés

- **Perplexity API**: ~$0.05 par workflow
- **OpenAI GPT-4**: ~$0.03 par workflow  
- **OpenAI GPT-3.5**: ~$0.02 par workflow
- **Total**: ~$0.10 par article généré

## 🔄 Automation

Pour automatiser le workflow:

```bash
# Cron job toutes les heures
0 * * * * cd /path/to/backend && node run-n8n-workflow.js

# Ou service systemd pour monitoring continu
```

## 🎉 Résultats attendus

Après exécution réussie:
- ✅ Article publié dans Strapi
- ✅ URL accessible via tunnel
- ✅ Métadonnées SEO complètes
- ✅ Source Reddit trackée
- ✅ Coût workflow calculé

Exemple URL résultat: `https://gage-lewis-shoes-led.trycloudflare.com/api/articles/4`