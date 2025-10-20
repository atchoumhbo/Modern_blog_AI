# Configuration des Environnements

Ce projet supporte **3 environnements différents** avec des configurations adaptées à chaque cas d'usage.

---

## 📋 Vue d'ensemble

| Environnement | Frontend | Backend Strapi | Fichier .env | Commande |
|--------------|----------|----------------|--------------|----------|
| **Dev Local** | http://localhost:5190 | http://localhost:1337 | `.env.development` | `npm run dev` (dans frontend/) |
| **Docker Local** | http://localhost:5173 | http://localhost:1339 | `.env.docker` | `docker-compose -f docker-compose.dev.yml up` |
| **VPS Production** | https://blog.thedevelopers.fr | https://blog.thedevelopers.fr/api | `.env.production` | `docker-compose up -d` |

---

## 🚀 1. Développement Local (sans Docker)

**Quand utiliser :**
- Développement rapide avec hot-reload
- Debugging avec breakpoints dans VSCode
- Tests de features frontend isolées

**Configuration :**
```bash
# Frontend
cd frontend
npm run dev
# → http://localhost:5190

# Backend (terminal séparé)
cd backend  
npm run develop
# → http://localhost:1337
```

**Fichier `.env.development` :**
```env
VITE_STRAPI_URL=http://localhost:1337
VITE_STRAPI_URL_SERVER=http://localhost:1337
VITE_SITE_URL=http://localhost:5190
```

**Avantages :**
- ✅ Rechargement ultra-rapide (Hot Module Replacement)
- ✅ Debugging facile avec DevTools
- ✅ Pas besoin de rebuild Docker à chaque changement
- ✅ Logs directement dans le terminal

**Inconvénients :**
- ❌ Ne teste pas l'environnement de production
- ❌ Nécessite Node.js installé localement

---

## 🐳 2. Docker Local

**Quand utiliser :**
- Tester l'environnement de production en local
- Valider la configuration Docker avant déploiement VPS
- Tester nginx, les volumes, les réseaux Docker
- Reproduire des bugs spécifiques à Docker

**Configuration :**
```bash
# Utiliser le docker-compose de développement
docker-compose -f docker-compose.dev.yml up -d

# Frontend: http://localhost:5173
# Backend: http://localhost:1339
```

**Fichier `.env.docker` :**
```env
VITE_STRAPI_URL=http://localhost:1339
VITE_STRAPI_URL_SERVER=http://strapi:1337  # Communication interne Docker
VITE_SITE_URL=http://localhost:5173
```

**Avantages :**
- ✅ Environnement identique à la production
- ✅ Teste les configurations Docker (Dockerfile, docker-compose)
- ✅ Teste nginx reverse proxy
- ✅ Isolation complète

**Inconvénients :**
- ❌ Plus lent que le dev local (rebuild nécessaire)
- ❌ Debugging plus compliqué
- ❌ Consomme plus de ressources

**Comment utiliser le bon .env :**
```bash
# Copier le fichier .env.docker vers .env avant build
cp frontend/.env.docker frontend/.env
docker-compose -f docker-compose.dev.yml up -d --build
```

---

## 🌍 3. VPS Production

**Quand utiliser :**
- Déploiement final sur le serveur de production
- Site accessible publiquement

**Configuration :**
```bash
# Sur le VPS
cd /var/www/blog_strapi
git pull
cp frontend/.env.production frontend/.env
docker-compose up -d --build
```

**Fichier `.env.production` :**
```env
VITE_STRAPI_URL=https://blog.thedevelopers.fr
VITE_STRAPI_URL_SERVER=http://strapi:1337  # Communication interne Docker
VITE_SITE_URL=https://blog.thedevelopers.fr
```

**Avantages :**
- ✅ SSL/HTTPS automatique via nginx
- ✅ Optimisé pour la performance
- ✅ Accessible publiquement

**Inconvénients :**
- ❌ Impossible de déboguer facilement
- ❌ Risque de downtime pendant le déploiement

---

## 🔧 Résumé des URLs

### Développement Local
```
Frontend:        http://localhost:5190
Backend Admin:   http://localhost:1337/admin
Backend API:     http://localhost:1337/api
```

### Docker Local
```
Frontend:        http://localhost:5173
Backend Admin:   http://localhost:1339/admin
Backend API:     http://localhost:1339/api
```

### VPS Production
```
Frontend:        https://blog.thedevelopers.fr
Backend Admin:   https://blog.thedevelopers.fr/admin
Backend API:     https://blog.thedevelopers.fr/api
```

---

## ⚙️ Variables d'environnement importantes

| Variable | Description | Exemple |
|----------|-------------|---------|
| `VITE_STRAPI_URL` | URL Strapi pour le navigateur (client-side) | `http://localhost:1337` |
| `VITE_STRAPI_URL_SERVER` | URL Strapi pour le SSR (server-side) | `http://strapi:1337` |
| `VITE_SITE_URL` | URL publique du frontend | `http://localhost:5190` |
| `VITE_LOCALES` | Langues supportées | `fr,en` |
| `VITE_DEFAULT_LOCALE` | Langue par défaut | `fr` |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics ID (optionnel) | `G-XXXXXXXXXX` |

---

## 🎯 Workflow recommandé

1. **Développement quotidien** → Dev Local (`npm run dev`)
2. **Avant commit** → Docker Local (tester que tout build correctement)
3. **Déploiement** → VPS Production (`docker-compose up -d`)

---

## 🐛 Troubleshooting

### Erreur `ENOTFOUND strapi`
**Cause :** Le frontend cherche "strapi" (nom Docker) au lieu de localhost  
**Solution :** Vérifier que vous utilisez le bon fichier `.env` :
```bash
# Dev local
cp frontend/.env.development frontend/.env

# Docker local
cp frontend/.env.docker frontend/.env
```

### Footer/Header ne s'affichent pas
**Cause :** Le Layout utilise `export function` au lieu de `export default`  
**Solution :** Déjà corrigé dans le commit `8e796ac`

### Port déjà utilisé
**Cause :** Un serveur tourne déjà sur le même port  
**Solution :**
```bash
# Trouver le processus
netstat -ano | findstr :5190
# Tuer le processus
taskkill /PID <PID> /F
```

---

## 📝 Notes

- Les fichiers `.env` sont dans `.gitignore` pour la sécurité
- Les fichiers `.env.development`, `.env.docker`, `.env.production` sont des **templates** commitables
- Copiez le template vers `.env` selon votre environnement
- Ne committez **JAMAIS** le fichier `.env` (contient des secrets en production)

---

**Dernière mise à jour :** 8 octobre 2025
