# 🎨 Guide Génération d'Images avec Stability AI SD3

## 📋 Configuration requise

### 1. Clé API Stability AI
```bash
# Dans votre fichier .env
STABILITY_API_KEY=sk-LOXnByBi8s0TORi9FoZg602nZuiwyJCUuTAaO46luyo8eTl9
IMAGE_PROVIDER=stability-ai
```

**Obtenir votre clé** : https://platform.stability.ai/

### 2. Dépendances Node.js
```bash
npm install form-data axios
```

## 🚀 Utilisation

### Test simple
```bash
cd backend/n8n
node test-sd3-images.js
```

### Test workflow complet
```bash
node test-complete-workflow-sd3.js
```

### Intégration manuelle
```javascript
const { generateArticleImage } = require('./image-generator-sd3');

const result = await generateArticleImage(
  "Modern React Hooks Best Practices",
  "reactjs",
  {
    provider: 'stability-ai',
    aspectRatio: '16:9',
    outputFormat: 'png',
    uploadStrapi: true
  }
);
```

## 💰 Coûts

| Provider | Coût par image | Qualité | Vitesse |
|----------|---------------|---------|---------|
| **Stability AI SD3** | **$0.003** | ⭐⭐⭐⭐⭐ | ~11s |
| OpenAI DALL-E 3 | $0.040 | ⭐⭐⭐⭐⭐ | ~6s |
| Économie SD3 | **-92%** | Équivalente | +85% |

## 🎯 Aspect Ratios supportés

- `1:1` - Carré (défaut)
- `16:9` - Widescreen (recommandé articles)
- `9:16` - Portrait mobile
- `3:2` - Photo standard
- `21:9` - Ultra-wide
- `4:5` - Portrait Instagram
- `2:3` - Portrait classique

## 🎨 Styles disponibles

- `digital-art` - Art numérique (défaut)
- `photographic` - Réaliste
- `cinematic` - Style cinéma
- `anime` - Style manga
- `3d-model` - Rendu 3D
- `fantasy-art` - Art fantastique
- `comic-book` - Bande dessinée
- `line-art` - Dessin au trait

## 📁 Structure des fichiers

```
backend/n8n/
├── image-generator-sd3.js       # Nouveau générateur SD3
├── test-sd3-images.js          # Tests unitaires
├── test-complete-workflow-sd3.js # Test workflow complet
└── n8n-workflow-reproduction.js # Workflow principal (mis à jour)

backend/public/uploads/generated-images/ # Images locales
```

## 🔧 Configuration avancée

### Variables d'environnement
```bash
# Provider par défaut
IMAGE_PROVIDER=stability-ai

# Stability AI
STABILITY_API_KEY=your-key-here

# Fallback DALL-E 3
OPENAI_API_KEY=your-openai-key

# Strapi upload
STRAPI_N8N_API_TOKEN=your-strapi-token
```

### Options de génération
```javascript
const options = {
  provider: 'stability-ai',      // ou 'openai-dalle'
  aspectRatio: '16:9',           // Format image
  outputFormat: 'png',           // png, jpeg, webp
  stylePreset: 'digital-art',    // Style SD3
  saveLocal: true,               // Sauvegarde locale
  uploadStrapi: true,            // Upload Strapi
  seed: 12345                    // Reproductibilité
};
```

## 🐛 Dépannage

### Erreur 403 (Content moderation)
```javascript
// Le système retry automatiquement sans negative_prompt
// Si ça persiste, modifiez le prompt pour être moins spécifique
```

### Erreur API Key
```bash
# Vérifiez dans .env
echo $STABILITY_API_KEY

# Testez l'API directement
curl -X POST "https://api.stability.ai/v2beta/stable-image/generate/sd3" \
  -H "authorization: Bearer YOUR-API-KEY" \
  -H "accept: image/*" \
  -F prompt="test image"
```

### Images non uploadées dans Strapi
```javascript
// Vérifiez le token Strapi
console.log(process.env.STRAPI_N8N_API_TOKEN);

// Vérifiez les permissions upload dans Strapi Admin
```

## 🎉 Résultats attendus

### Test unitaire
```
✅ Image générée: stability-sd3-1759493821290.png (11.5s)
💰 Coût estimé: $0.0030
💾 Image sauvée: 1253 KB
```

### Workflow complet
```
🎨 Image SD3 générée et uploadée - ID Strapi: 42
💰 Coût: $0.0030 via stability-sd3
⏱️ Temps: 11.5s
📄 Fichier: stability-sd3-1759493821290.png
💾 Local: 1253 KB
```

## 🚀 Avantages SD3

1. **92% moins cher** que DALL-E 3
2. **Open source** - Possibilité auto-hébergement
3. **Formats flexibles** - PNG, JPEG, WebP
4. **Aspect ratios optimaux** - Parfait pour blog
5. **Styles variés** - Digital art, photo, anime...
6. **API moderne** - multipart/form-data
7. **Qualité équivalente** - Résolution 1.5MP

## 📈 Prochaines améliorations

- [ ] Support Cloudinary pour CDN
- [ ] Cache des images générées
- [ ] Batch generation pour plusieurs articles
- [ ] Optimization automatique SEO des images
- [ ] A/B testing des styles par subreddit