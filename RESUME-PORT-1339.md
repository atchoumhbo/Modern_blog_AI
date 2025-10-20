# 📊 RÉSUMÉ - Configuration Port 1339

## ✅ Commit Effectué
**Commit:** `3889324`  
**Message:** "fix: Configuration pour port Strapi 1339 au lieu de 1337"  
**Statut:** Poussé vers GitHub ✓

## 📝 Fichiers Modifiés

1. **.env.production** → `PORT=1339`
2. **nginx/nginx.vps-hybrid.conf** → Configuration Nginx pour `host.docker.internal:1339`
3. **rebuild-strapi-admin-vps.ps1** → Script PowerShell de reconstruction
4. **fix-strapi-permissions-vps.ps1** → Script de réparation permissions
5. **deploy-nginx-port-1339.ps1** → Script de déploiement Nginx
6. **update-port-to-1339.ps1** → Script utilitaire

## 🔧 État Actuel du VPS

### Strapi (Manuel - Hors Docker)
- **Port:** 1339
- **Localisation:** `/root/blog_strapi/backend`
- **Commande:** `npm run start`
- **Logs:** `/root/strapi.log`
- **Base de données:** PostgreSQL (localhost:5432)

### Architecture
```
┌─────────────────────────────────────────┐
│         NGINX (Docker)                   │
│         Port 80/443                      │
└─────────┬───────────────────────────────┘
          │
          ├─→ Frontend (Docker:3000)
          │
          └─→ Strapi (Manuel:1339) ← host.docker.internal
              └─→ PostgreSQL (localhost:5432)
```

## 🚨 Problème à Résoudre

**Erreur actuelle:**
```
Cannot read properties of undefined (reading 'filter')
```

**Cause:** Admin panel Strapi corrompu

## 🛠️ Solution à Appliquer

### Option 1: Reconstruction Admin (Recommandée)

**Via SSH manuelle** (voir `COMMANDES-MANUELLES-REPAIR-STRAPI.md`):

```bash
# 1. Se connecter au VPS
ssh root@173.212.208.181

# 2. Arrêter Strapi
pkill -f "strapi start"

# 3. Nettoyer et rebuild
cd /root/blog_strapi/backend
rm -rf .cache build dist
npm install
NODE_ENV=production npm run build

# 4. Redémarrer
nohup npm run start > /root/strapi.log 2>&1 &
```

### Option 2: Créer un Nouveau User Admin

```bash
cd /root/blog_strapi/backend
npm run strapi -- admin:create-user \
  --firstname=Admin \
  --lastname=User \
  --email=admin@example.com \
  --password=SecurePassword123!
```

## 📍 URLs d'Accès

- **Admin Direct:** http://173.212.208.181:1339/admin
- **Admin HTTPS:** https://blog.bh-systems.be/admin (après config Nginx)
- **API:** https://blog.bh-systems.be/api
- **Site:** https://blog.bh-systems.be

## ⚙️ Configuration .env sur VPS

Le fichier `/root/blog_strapi/backend/.env` doit contenir:
```bash
NODE_ENV=production
HOST=0.0.0.0
PORT=1339
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=blog_strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=Str4p1Pr0d_2025!
```

## 🔍 Vérifications

### 1. Strapi tourne-t-il?
```bash
ssh root@173.212.208.181 "ps aux | grep strapi | grep -v grep"
```

### 2. Port 1339 est-il ouvert?
```bash
ssh root@173.212.208.181 "lsof -i :1339"
```

### 3. Logs Strapi
```bash
ssh root@173.212.208.181 "tail -100 /root/strapi.log"
```

## 📦 Prochaines Étapes

1. **Immédiat:** Exécuter les commandes de reconstruction (voir `COMMANDES-MANUELLES-REPAIR-STRAPI.md`)
2. **Après reconstruction:** Vérifier l'accès à l'admin
3. **Si fonctionne:** Déployer la config Nginx avec `deploy-nginx-port-1339.ps1`
4. **Optionnel:** Configurer PM2 pour auto-restart de Strapi

## 🔐 Sécurité

⚠️ **Le fichier `.env` contient des secrets et n'est PAS commité dans Git**  
✓ Seul `.env.production` (sans secrets réels) est versionné  
✓ Le `.env` sur le VPS est configuré manuellement avec les vrais secrets

## 📞 Support

Si le problème persiste:
1. Vérifier `/root/strapi.log`
2. Vérifier la connexion PostgreSQL
3. Régénérer complètement la base de données si nécessaire

---

**Dernière mise à jour:** 15 octobre 2025  
**Commit:** 3889324  
**Branches:** master → origin/master ✓
