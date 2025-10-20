# 🎨 Guide Configuration APIs de Génération d'Images

## 📖 Vue d'ensemble

Le système de génération d'images automatique supporte plusieurs providers pour garantir la flexibilité et optimiser les coûts. Voici comment configurer chaque API.

## 🏆 Providers Recommandés (par ordre de préférence)

### 1. 🥇 Stability AI DreamStudio (RECOMMANDÉ)
- **Avantages** : Meilleur rapport qualité/prix, 100 images gratuites/mois
- **Coût** : ~$0.004 par image
- **Qualité** : Excellente, très flexible

**Configuration :**
1. Aller sur : https://platform.stability.ai/
2. Créer un compte et obtenir votre API key
3. Ajouter dans `.env` :
```bash
STABILITY_API_KEY=sk-your-stability-api-key
IMAGE_PROVIDER=stability-ai
```

### 2. 🥈 GetImg.ai 
- **Avantages** : Excellente documentation, API simple
- **Coût** : $0.01 par image
- **Qualité** : Très bonne

**Configuration :**
1. Aller sur : https://getimg.ai/tools/api
2. Créer un compte et obtenir votre API key
3. Ajouter dans `.env` :
```bash
GETIMG_API_KEY=your-getimg-api-key
IMAGE_PROVIDER=getimg-ai
```

### 3. 🥉 OpenAI DALL-E 3
- **Avantages** : Qualité supérieure, excellente compréhension des prompts
- **Coût** : $0.04 par image (plus cher)
- **Qualité** : Excellent pour le photoréalisme

**Configuration :**
1. Utilise la même clé que GPT (déjà configurée)
2. Changer dans `.env` :
```bash
IMAGE_PROVIDER=openai-dalle
```

### 4. 🔄 Replicate
- **Avantages** : Paiement à l'usage, prix variable
- **Coût** : ~$0.005 par image (variable)
- **Qualité** : Bonne

**Configuration :**
1. Aller sur : https://replicate.com/account/api-tokens
2. Créer un token
3. Ajouter dans `.env` :
```bash
REPLICATE_API_TOKEN=r8_your-replicate-token
IMAGE_PROVIDER=replicate
```

## ⚙️ Configuration Système

### Variables d'environnement (.env)
```bash
# Provider par défaut (recommandé : stability-ai)
IMAGE_PROVIDER=stability-ai

# APIs (configurez au moins une)
STABILITY_API_KEY=sk-your-key
GETIMG_API_KEY=your-key
REPLICATE_API_TOKEN=r8_your-token
# OPENAI_API_KEY déjà configuré pour GPT

# Paramètres optionnels
IMAGE_DEFAULT_SIZE=768x768
IMAGE_SAVE_LOCAL=true
IMAGE_SAVE_STRAPI=true
```

## 🧪 Tests et Validation

### Test rapide de configuration
```bash
cd backend/n8n
node test-image-generation.js
```

### Test d'un provider spécifique
```javascript
// Dans le code
const { testImageGeneration } = require('./image-generator');
await testImageGeneration();
```

## 💡 Optimisation des Coûts

### Stratégie recommandée :
1. **Stability AI** pour usage quotidien (le moins cher)
2. **DALL-E 3** pour articles premium (meilleure qualité)
3. **GetImg.ai** comme backup fiable

### Calcul des coûts :
- **10 articles/jour** avec Stability AI : ~$1.20/mois
- **50 articles/jour** avec Stability AI : ~$6/mois
- Même volume avec DALL-E 3 : ~$60/mois

## 🎯 Prompts et Styles

### Prompts automatiques par subreddit :
- **webdev** : "modern web development, clean interface, code editor"
- **javascript** : "JavaScript logo, modern coding environment, yellow accents"
- **reactjs** : "React.js components, blue theme, modern UI/UX design"
- **nextjs** : "Next.js framework, full-stack development, black and white"

### Personnalisation :
Le système génère automatiquement des prompts optimisés basés sur :
- Le titre de l'article
- Le subreddit d'origine  
- Les mots-clés extraits
- Le style technique approprié

## 🔧 Intégration Workflow

### Dans le workflow N8N :
1. **Récupération** post Reddit
2. **Analyse** avec Perplexity
3. **Génération** contenu avec GPT
4. **🎨 Génération image** automatique
5. **Upload** vers Strapi Media Library
6. **Publication** article avec image

### Gestion des erreurs :
- Fallback automatique entre providers
- Sauvegarde locale en cas d'échec Strapi
- Logs détaillés pour debugging
- Articles publiés même si génération image échoue

## 📊 Monitoring

### Métriques suivies :
- Coût par image générée
- Temps de génération moyen
- Taux de succès par provider
- Qualité des prompts générés

### Logs disponibles :
```bash
# Voir les logs de génération
tail -f logs/image-generation.log

# Stats des coûts
node n8n/image-cost-analyzer.js
```

## 🚨 Dépannage

### Erreurs communes :

**"API Key manquante"**
- Vérifier que la clé est dans `.env`
- Vérifier que `IMAGE_PROVIDER` correspond à une clé configurée

**"Quota exceeded"**
- Stability AI : 100 images gratuites/mois dépassées
- Changer de provider temporairement

**"Upload Strapi échoué"**
- Vérifier que Strapi est accessible
- Vérifier les permissions upload dans Strapi
- Images sauvegardées localement en backup

### Support :
- Documentation Stability AI : https://platform.stability.ai/docs
- Documentation GetImg.ai : https://docs.getimg.ai/
- Documentation DALL-E : https://platform.openai.com/docs/guides/images

## 🎉 Résultats Attendus

Avec la configuration complète, chaque article aura :
- **Image unique** générée automatiquement
- **Style cohérent** selon le subreddit
- **Intégration parfaite** dans Strapi
- **Coût optimisé** selon le provider choisi
- **Fallback robuste** en cas de problème

Le système est maintenant prêt pour la génération automatique d'images de qualité professionnelle ! 🚀