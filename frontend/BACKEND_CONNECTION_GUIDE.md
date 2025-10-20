# 🔗 Configuration Frontend pour Backend MERN

## ✅ Configuration Actuelle

Le frontend est **déjà configuré** pour fonctionner avec le backend MERN! Voici ce qui est en place:

### Fichiers Configurés:
- ✅ `app/lib/api-config.ts` - Configuration adaptative Strapi/MERN
- ✅ `app/lib/auth-service.ts` - Service d'authentification unifié
- ✅ `.env.local` - Configuration locale (localhost:3000)
- ✅ `.env.vps` - Configuration VPS (173.212.208.181:3000)

---

## 🚀 Tests Rapides

### Test 1: Backend Local (localhost)

1. **Démarrer le backend localement** (si pas encore fait):
   ```bash
   cd backend-mern
   npm run dev
   ```
   Ou avec Docker:
   ```bash
   cd backend-mern
   docker-compose up -d
   ```

2. **Vérifier que le fichier `.env.local` pointe vers localhost**:
   ```bash
   # .env.local doit contenir:
   VITE_BACKEND_TYPE=mern
   VITE_API_URL=http://localhost:3000/api
   ```

3. **Démarrer le frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

4. **Ouvrir le navigateur**: http://localhost:5173

5. **Tester le login**:
   - Email: `boujraf.hicham@gmail.com`
   - Password: `Admin123!`

---

### Test 2: Backend VPS (173.212.208.181)

1. **Créer un fichier `.env.local.vps`** (déjà créé dans `.env.vps`):
   ```bash
   cp .env.vps .env.local
   ```

2. **Ou éditer `.env.local` manuellement**:
   ```bash
   VITE_BACKEND_TYPE=mern
   VITE_API_URL=http://173.212.208.181:3000/api
   VITE_STRAPI_URL=http://173.212.208.181:3000
   ```

3. **Redémarrer le frontend**:
   ```bash
   # Arrêter (Ctrl+C) puis:
   npm run dev
   ```

4. **Ouvrir le navigateur**: http://localhost:5173

5. **Tester le login** avec les mêmes credentials

---

## 🧪 Tests de l'API

### Test avec curl (depuis Windows PowerShell ou Git Bash)

#### 1. Health Check
```bash
# Local
curl http://localhost:3000/health

# VPS
curl http://173.212.208.181:3000/health
```

#### 2. Login
```bash
# Local
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "boujraf.hicham@gmail.com",
    "password": "Admin123!"
  }'

# VPS
curl -X POST http://173.212.208.181:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "boujraf.hicham@gmail.com",
    "password": "Admin123!"
  }'
```

#### 3. Get Articles
```bash
# Local
curl http://localhost:3000/api/articles

# VPS
curl http://173.212.208.181:3000/api/articles
```

#### 4. Get Categories
```bash
# Local
curl http://localhost:3000/api/categories

# VPS
curl http://173.212.208.181:3000/api/categories
```

---

## 🔧 Configuration CORS

Le backend doit autoriser le frontend. Vérifiez que le backend a bien configuré CORS:

### Sur le VPS, éditer `.env.production`:
```bash
ssh root@173.212.208.181
cd /root/blog_strapi/backend-mern
nano .env.production
```

**Ajouter l'URL du frontend**:
```env
CORS_ORIGINS="http://localhost:5173,http://YOUR_FRONTEND_DOMAIN"
```

**Puis redémarrer le backend**:
```bash
docker-compose -f docker-compose.prod.yml restart backend
```

---

## 📝 Commandes PowerShell Rapides

### Switch vers Backend Local
```powershell
cd C:\Devops\blog_strapi\frontend

# Option 1: Copier le fichier
Copy-Item .env.local.backup .env.local -Force

# Option 2: Éditer directement
notepad .env.local
# Changer: VITE_API_URL=http://localhost:3000/api
```

### Switch vers Backend VPS
```powershell
cd C:\Devops\blog_strapi\frontend

# Option 1: Copier le fichier
Copy-Item .env.vps .env.local -Force

# Option 2: Éditer directement
notepad .env.local
# Changer: VITE_API_URL=http://173.212.208.181:3000/api
```

### Redémarrer le Frontend
```powershell
# Dans le terminal où le frontend tourne, faire Ctrl+C puis:
npm run dev
```

---

## 🎯 Checklist de Test

### Backend Local ✓
- [ ] Backend démarre sans erreur
- [ ] Health check répond: http://localhost:3000/health
- [ ] Login fonctionne avec curl
- [ ] Frontend peut se connecter
- [ ] Articles s'affichent

### Backend VPS ✓
- [ ] Backend accessible depuis votre machine
- [ ] Health check répond: http://173.212.208.181:3000/health
- [ ] Login fonctionne avec curl
- [ ] Frontend peut se connecter au VPS
- [ ] Articles s'affichent depuis le VPS

### CORS Configuration ✓
- [ ] CORS_ORIGINS inclut http://localhost:5173
- [ ] Pas d'erreur CORS dans la console du navigateur
- [ ] Requests passent correctement

---

## 🐛 Dépannage

### Erreur: CORS Policy

**Symptôme**: Console du navigateur affiche "blocked by CORS policy"

**Solution**:
```bash
# Sur le VPS
ssh root@173.212.208.181
cd /root/blog_strapi/backend-mern
nano .env.production

# Ajouter:
CORS_ORIGINS="http://localhost:5173"

# Redémarrer
docker-compose -f docker-compose.prod.yml restart backend
```

### Erreur: Network Error / Connection Refused

**Symptôme**: Frontend ne peut pas se connecter

**Solutions**:
1. Vérifier que le backend tourne: `curl http://173.212.208.181:3000/health`
2. Vérifier l'URL dans `.env.local`
3. Vérifier le firewall du VPS: `ufw status`
4. Tester depuis le VPS: `curl http://localhost:3000/health`

### Erreur: 401 Unauthorized

**Symptôme**: Login échoue avec 401

**Solutions**:
1. Vérifier que la base de données est seedée
2. Tester le login avec curl
3. Vérifier les credentials: `boujraf.hicham@gmail.com` / `Admin123!`

### Erreur: Cannot find user

**Symptôme**: Login échoue avec "User not found"

**Solutions**:
1. Re-seed la base de données:
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend npm run seed:prod
   ```
2. Vérifier que l'admin existe:
   ```bash
   sudo -u postgres psql -d blog_mern -c "SELECT email FROM users WHERE \"isAdmin\" = true;"
   ```

---

## 📊 Structure des Réponses API

### Login Success (MERN):
```json
{
  "user": {
    "id": "uuid-here",
    "email": "boujraf.hicham@gmail.com",
    "username": "admin",
    "isAdmin": true
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### Articles List:
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Getting Started with Modern Blog Leader",
      "slug": "getting-started-with-modern-blog-leader",
      "excerpt": "...",
      "content": "...",
      "coverImage": null,
      "isPublished": true,
      "viewCount": 0,
      "category": { "id": "...", "name": "Technology" },
      "tags": [
        { "id": "...", "name": "javascript" }
      ],
      "author": { "id": "...", "username": "admin" }
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

## 🔐 Tokens & Authentication

### Comment ça marche:

1. **Login**: Reçoit `accessToken` + `refreshToken`
2. **Stockage**: Tokens stockés dans `localStorage`
3. **Requêtes**: `accessToken` envoyé dans header `Authorization: Bearer <token>`
4. **Expiration**: `accessToken` expire en 15 minutes
5. **Refresh**: `refreshToken` utilisé pour obtenir un nouveau `accessToken` (valide 7 jours)

### Vérifier les tokens:
```javascript
// Dans la console du navigateur (DevTools)
console.log('Access Token:', localStorage.getItem('auth_access_token'));
console.log('Refresh Token:', localStorage.getItem('auth_refresh_token'));
console.log('User:', JSON.parse(localStorage.getItem('auth_user')));
```

---

## 🎨 Prochaines Étapes

Une fois que le frontend communique avec le backend:

1. **Tester toutes les fonctionnalités**:
   - [ ] Login / Logout
   - [ ] Affichage des articles
   - [ ] Affichage des projets
   - [ ] Filtrage par catégorie
   - [ ] Filtrage par tag
   - [ ] Recherche

2. **Implémenter les fonctionnalités manquantes**:
   - [ ] CRUD Articles (si admin)
   - [ ] CRUD Projects (si admin)
   - [ ] Upload d'images
   - [ ] Gestion des catégories
   - [ ] Gestion des tags

3. **Optimiser**:
   - [ ] Ajouter pagination
   - [ ] Ajouter loading states
   - [ ] Ajouter error handling
   - [ ] Ajouter caching avec React Query

---

## 📚 Ressources

- **Backend API**: http://173.212.208.181:3000/api
- **Health Check**: http://173.212.208.181:3000/health
- **Frontend Local**: http://localhost:5173
- **Admin Credentials**: boujraf.hicham@gmail.com / Admin123!

---

**Configuration Status**: ✅ Prêt à tester  
**Last Updated**: October 17, 2025
