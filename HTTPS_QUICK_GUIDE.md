# 🚀 Guide Rapide - Déploiement HTTPS blog.bh-systems.be

## ✅ Prérequis

1. **DNS configuré** : `blog.bh-systems.be` → `173.212.208.181`
2. **Ports ouverts** : 80 (HTTP) et 443 (HTTPS)
3. **Git pushé** : Dernières modifications sur GitHub

## 🎯 Déploiement en 1 commande

```powershell
.\deploy-https-complete.ps1
```

Ce script va :
1. ✅ Vérifier le DNS
2. ✅ Pull le code depuis GitHub
3. ✅ Installer Certbot (si nécessaire)
4. ✅ Obtenir le certificat SSL Let's Encrypt
5. ✅ Build les images Docker (backend + frontend)
6. ✅ Démarrer tous les services (postgres + backend + frontend + nginx)
7. ✅ Tester HTTPS (redirect, health, API, frontend)
8. ✅ Ouvrir le navigateur sur https://blog.bh-systems.be

## 📊 Architecture

```
Internet (HTTPS 443)
         ↓
    Nginx Container
    ├── SSL Termination (Let's Encrypt)
    ├── / → Frontend Container (React Router v7)
    ├── /api → Backend Container (Node.js + Prisma)
    └── /health → Backend Container
         ↓
    Backend Container (3000)
         ↓
    PostgreSQL Container (5432)
```

## 🔧 Services Docker

| Container | Service | Port | Description |
|-----------|---------|------|-------------|
| `blog-postgres-prod` | PostgreSQL 16 | 5432 | Base de données |
| `blog-mern-backend-https` | Node.js + Express | 3000 | API REST |
| `blog-frontend-https` | React Router v7 | 80 | SPA Frontend |
| `blog-nginx-https` | Nginx 1.25 | 80, 443 | Reverse Proxy + SSL |

## 🌐 URLs

- **Frontend** : https://blog.bh-systems.be
- **API** : https://blog.bh-systems.be/api
- **Health** : https://blog.bh-systems.be/health

## 🔐 Certificat SSL

- **Émetteur** : Let's Encrypt
- **Validité** : 90 jours (renouvellement automatique)
- **Algorithme** : RSA 2048 bits
- **Protocoles** : TLS 1.2, TLS 1.3

### Renouveler manuellement

```bash
ssh root@173.212.208.181 "certbot renew"
```

## 🛠️ Commandes Utiles

### Voir les logs

```powershell
# Tous les services
ssh root@173.212.208.181 "cd /root/blog_strapi && docker-compose -f docker-compose.https-prod.yml logs -f"

# Backend seulement
ssh root@173.212.208.181 "docker logs -f blog-mern-backend-https"

# Nginx seulement
ssh root@173.212.208.181 "docker logs -f blog-nginx-https"
```

### Redémarrer

```powershell
# Tout redémarrer
ssh root@173.212.208.181 "cd /root/blog_strapi && docker-compose -f docker-compose.https-prod.yml restart"

# Backend seulement
ssh root@173.212.208.181 "cd /root/blog_strapi && docker-compose -f docker-compose.https-prod.yml restart backend"
```

### Status

```powershell
ssh root@173.212.208.181 "cd /root/blog_strapi && docker-compose -f docker-compose.https-prod.yml ps"
```

### Arrêter

```powershell
ssh root@173.212.208.181 "cd /root/blog_strapi && docker-compose -f docker-compose.https-prod.yml down"
```

## 🧪 Tests

```powershell
# Test redirect HTTP → HTTPS
curl -I http://blog.bh-systems.be

# Test HTTPS health
Invoke-RestMethod https://blog.bh-systems.be/health -SkipCertificateCheck

# Test API
Invoke-RestMethod https://blog.bh-systems.be/api/categories -SkipCertificateCheck

# Test frontend
Start-Process https://blog.bh-systems.be
```

## 🐛 Dépannage

### Certificat SSL non obtenu

```bash
# Vérifier DNS
nslookup blog.bh-systems.be

# Vérifier ports
ssh root@173.212.208.181 "netstat -tlnp | grep ':80\|:443'"

# Forcer renouvellement
ssh root@173.212.208.181 "certbot certonly --standalone -d blog.bh-systems.be --force-renewal"
```

### Frontend ne charge pas

```bash
# Vérifier le build
ssh root@173.212.208.181 "docker logs blog-frontend-https"

# Rebuild
ssh root@173.212.208.181 "cd /root/blog_strapi && docker-compose -f docker-compose.https-prod.yml build frontend"
```

### API ne répond pas

```bash
# Vérifier backend
ssh root@173.212.208.181 "docker logs blog-mern-backend-https"

# Vérifier PostgreSQL
ssh root@173.212.208.181 "docker logs blog-postgres-prod"
```

### Nginx erreurs

```bash
# Tester config
ssh root@173.212.208.181 "docker exec blog-nginx-https nginx -t"

# Voir logs
ssh root@173.212.208.181 "docker logs blog-nginx-https"
```

## 📝 Variables d'environnement

Créer `.env` à la racine :

```env
# Database
DB_PASSWORD=BlogSecurePass2024!

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production_minimum_32_characters
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production_min_32_chars

# Domain
DOMAIN=blog.bh-systems.be
```

## 🔄 Redeploiement

Après modification du code :

```powershell
# 1. Commit et push
git add .
git commit -m "feat: My changes"
git push origin master

# 2. Redéployer
.\deploy-https-complete.ps1
```

## ✅ Checklist de déploiement

- [ ] DNS configuré et vérifié
- [ ] Ports 80 et 443 ouverts
- [ ] Code pushé sur GitHub
- [ ] `.env` configuré (optionnel)
- [ ] `deploy-https-complete.ps1` exécuté
- [ ] Tests HTTPS passés
- [ ] Frontend accessible
- [ ] API répond correctement
- [ ] Login fonctionne

## 📞 Support

En cas de problème :
1. Vérifier les logs des containers
2. Tester les endpoints individuellement
3. Vérifier la configuration Nginx
4. Vérifier le certificat SSL
