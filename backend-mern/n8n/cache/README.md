# Cache Directory

Ce dossier stocke les résultats de génération d'images en cache.

- **Durée de validité** : 24h par défaut
- **Format** : Fichiers JSON avec hash MD5 comme nom
- **Nettoyage automatique** : `node v2/index.js --cleanup`

## Structure d'un fichier cache

```json
{
  "timestamp": 1696598400000,
  "cacheKey": "abc123def456...",
  "result": {
    "success": true,
    "filename": "article-...",
    "path": "...",
    "url": "/uploads/generated-images/...",
    "provider": "Stability AI SD3",
    "cost": 0.003,
    "generationTime": "3.45",
    "metadata": {...}
  }
}
```

## Maintenance

```bash
# Nettoyer les caches expirés
node backend/n8n/v2/index.js --cleanup

# Vider tout le cache
rm backend/n8n/cache/*.json
```
