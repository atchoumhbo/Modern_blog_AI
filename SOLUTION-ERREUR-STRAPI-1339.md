# 🔧 SOLUTION - Erreur Strapi Admin Panel

## ❌ Problème
Erreur dans l'admin Strapi sur VPS :
```
Cannot read properties of undefined (reading 'filter')
```

## 🔍 Diagnostic
1. **Strapi tourne sur port 1339** (pas 1337)
2. **Strapi s'exécute HORS Docker** (`npm run start` manuel)
3. **Admin panel corrompu** - problème de permissions dans la base de données

## ✅ Solutions

### Solution 1️⃣ : Reconstruire l'Admin (Recommandée)
```powershell
.\rebuild-strapi-admin-vps.ps1
```

**Ce script va :**
- ✅ Arrêter Strapi
- ✅ Nettoyer le cache (`.cache`, `build`, `dist`)
- ✅ Reconstruire complètement l'interface admin
- ✅ Redémarrer Strapi

**Durée :** ~2-3 minutes

### Solution 2️⃣ : Réparer les Permissions
```powershell
.\fix-strapi-permissions-vps.ps1
```

**Ce script va :**
- ✅ Nettoyer les permissions orphelines dans PostgreSQL
- ✅ Réinitialiser l'utilisateur admin
- ✅ Redémarrer Strapi

## 📝 Configuration VPS Actuelle

### Strapi (Manuel - Hors Docker)
- **Port :** 1339
- **Commande :** `npm run start` dans `/root/blog_strapi/backend`
- **Base de données :** PostgreSQL sur localhost:5432
- **Process :** PID visible avec `ps aux | grep strapi`

### Nginx (Dans Docker)
- **Configuration :** `nginx/nginx.vps-hybrid.conf`
- **Upstream :** `host.docker.internal:1339`
- **Proxy :**
  - `/api/` → `http://host.docker.internal:1339/api/`
  - `/admin/` → `http://host.docker.internal:1339/admin/`
  - `/uploads/` → `http://host.docker.internal:1339/uploads/`

### Frontend (Dans Docker)
- **Port :** 3000
- **Container :** `blog-frontend`

## 🚀 Déploiement Nginx Corrigé

Pour déployer la configuration Nginx qui pointe vers le bon port :

```powershell
.\deploy-nginx-port-1339.ps1
```

## 📊 Vérifications

### Vérifier que Strapi tourne
```powershell
ssh root@173.212.208.181 "ps aux | grep strapi | grep -v grep"
```

### Vérifier le port
```powershell
ssh root@173.212.208.181 "lsof -i :1339"
```

### Vérifier les logs Strapi
```powershell
ssh root@173.212.208.181 "tail -f /root/strapi.log"
```

## 🌐 URLs d'Accès

- **Admin :** http://173.212.208.181:1339/admin (direct)
- **Admin HTTPS :** https://blog.bh-systems.be/admin (via Nginx)
- **API :** https://blog.bh-systems.be/api
- **Site :** https://blog.bh-systems.be

## 📋 Fichiers Modifiés (Commit 3889324)

1. ✅ `.env.production` → PORT=1339
2. ✅ `nginx/nginx.vps-hybrid.conf` → Configuration pour Strapi hors Docker
3. ✅ `rebuild-strapi-admin-vps.ps1` → Script de reconstruction
4. ✅ `fix-strapi-permissions-vps.ps1` → Script de réparation
5. ✅ `deploy-nginx-port-1339.ps1` → Script de déploiement
6. ✅ `update-port-to-1339.ps1` → Script utilitaire

## 🔑 Notes Importantes

### .env sur VPS
Le fichier `/root/blog_strapi/backend/.env` sur le VPS est **déjà configuré** avec :
```bash
PORT=1339
DATABASE_HOST=localhost
```

### Différence Docker vs Manuel
- **Docker** : `strapi:1337` (réseau Docker interne)
- **Manuel** : `host.docker.internal:1339` (depuis Nginx dans Docker vers host)

## 🎯 Prochaines Étapes

1. **Exécuter la reconstruction :**
   ```powershell
   .\rebuild-strapi-admin-vps.ps1
   ```

2. **Vérifier l'accès admin :**
   - Ouvrir : http://173.212.208.181:1339/admin
   - Ou via HTTPS : https://blog.bh-systems.be/admin

3. **Si ça ne fonctionne pas, vérifier :**
   ```powershell
   ssh root@173.212.208.181 "cd /root/blog_strapi/backend && npm run strapi -- admin:create-user --firstname=Admin --lastname=User --email=admin@example.com --password=SecurePassword123!"
   ```

## 📞 Support

Si le problème persiste après la reconstruction :
1. Vérifier les logs : `tail -f /root/strapi.log`
2. Vérifier PostgreSQL : `psql -h localhost -U strapi -d blog_strapi`
3. Créer un nouvel utilisateur admin (commande ci-dessus)

---

**Dernière mise à jour :** 15 octobre 2025  
**Commit :** 3889324  
**Statut :** Configuration VPS hybride (Strapi manuel + Docker pour frontend/nginx)
