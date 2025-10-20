# 🔒 Configuration SSL avec OVH DNS Challenge

## 📋 Vue d'ensemble

Cette méthode utilise l'API OVH pour valider le domaine via un challenge DNS. **Avantages** :
- ✅ Génère des certificats **wildcard** (`*.blog.bh-systems.be`)
- ✅ Fonctionne même si le DNS pointe ailleurs temporairement
- ✅ Renouvellement automatique
- ✅ Pas besoin que le serveur soit accessible sur le port 80

## 🚀 Procédure complète

### Étape 1: Créer les accès API OVH

1. **Rendez-vous sur** : https://eu.api.ovh.com/createToken/

2. **Remplissez le formulaire** :
   - **Application name** : `certbot-blog`
   - **Application description** : `Génération certificats SSL Let's Encrypt`
   - **Validity** : `Unlimited` (ou une durée longue)

3. **Définissez les droits** (remplacez `blog.bh-systems.be` par votre domaine) :

```
GET /domain/zone/
GET /domain/zone/blog.bh-systems.be/
GET /domain/zone/blog.bh-systems.be/status
GET /domain/zone/blog.bh-systems.be/record
GET /domain/zone/blog.bh-systems.be/record/*
POST /domain/zone/blog.bh-systems.be/record
POST /domain/zone/blog.bh-systems.be/refresh
DELETE /domain/zone/blog.bh-systems.be/record/*
```

4. **Validez et notez** les 3 clés générées :
   - `Application Key`
   - `Application Secret`
   - `Consumer Key`

### Étape 2: Configurer le VPS

**Connectez-vous au VPS** :

```bash
ssh root@173.212.208.181
```

**Créez le fichier de configuration OVH** :

```bash
cat > /root/.ovhapi <<'EOF'
dns_ovh_endpoint = ovh-eu
dns_ovh_application_key = VOTRE_APPLICATION_KEY_ICI
dns_ovh_application_secret = VOTRE_APPLICATION_SECRET_ICI
dns_ovh_consumer_key = VOTRE_CONSUMER_KEY_ICI
EOF

# Sécuriser le fichier
chmod 600 /root/.ovhapi
```

⚠️ **Remplacez** les valeurs par celles obtenues à l'étape 1 !

### Étape 3: Transférer et exécuter le script

**Depuis votre machine Windows** :

```powershell
# Transférer le script
scp C:\Devops\blog_strapi\setup-ssl-ovh.sh root@173.212.208.181:/root/

# Se connecter au VPS
ssh root@173.212.208.181

# Rendre le script exécutable
chmod +x /root/setup-ssl-ovh.sh

# Exécuter le script
./setup-ssl-ovh.sh
```

Le script va :
1. ✅ Installer Certbot + plugin OVH
2. ✅ Configurer logrotate
3. ✅ Vérifier la config API
4. ✅ Générer le certificat (domaine + wildcard)
5. ✅ Créer le script de renouvellement automatique
6. ✅ Configurer le crontab

### Étape 4: Vérifier le certificat

```bash
# Lister les certificats
certbot certificates

# Vous devriez voir :
# Certificate Name: blog.bh-systems.be
#   Domains: blog.bh-systems.be *.blog.bh-systems.be
#   Expiry Date: [90 jours plus tard]
#   Certificate Path: /etc/letsencrypt/live/blog.bh-systems.be/fullchain.pem
#   Private Key Path: /etc/letsencrypt/live/blog.bh-systems.be/privkey.pem
```

### Étape 5: Configurer Nginx

**Créez le répertoire pour le frontend** :

```bash
mkdir -p /var/www/blog-frontend
chown -R www-data:www-data /var/www/blog-frontend
```

**Transférez la config Nginx** (depuis Windows) :

```powershell
scp C:\Devops\blog_strapi\nginx\blog.bh-systems.be.conf root@173.212.208.181:/etc/nginx/sites-available/
```

**Activez la configuration** (sur le VPS) :

```bash
# Créer le lien symbolique
ln -sf /etc/nginx/sites-available/blog.bh-systems.be.conf /etc/nginx/sites-enabled/

# Supprimer la config par défaut si elle existe
rm -f /etc/nginx/sites-enabled/default

# Tester la configuration
nginx -t

# Si OK, recharger Nginx
systemctl reload nginx
```

### Étape 6: Déployer le frontend

**Depuis Windows** :

```powershell
cd C:\Devops\blog_strapi\frontend

# Vérifier que .env.production est correct
cat .env.production

# Devrait contenir :
# VITE_BACKEND_TYPE=mern
# VITE_API_URL=https://blog.bh-systems.be/api
# VITE_SITE_URL=https://blog.bh-systems.be

# Build production
npm run build

# Transférer vers le VPS
scp -r build/client/* root@173.212.208.181:/var/www/blog-frontend/
```

### Étape 7: Configurer le backend pour HTTPS

**Sur le VPS** :

```bash
cd /root/blog_strapi/backend-mern

# Éditer .env.production
nano .env.production

# Modifier/ajouter ces lignes :
CORS_ORIGINS="https://blog.bh-systems.be,https://*.blog.bh-systems.be,http://localhost:5173"
FRONTEND_URL="https://blog.bh-systems.be"

# Sauvegarder (Ctrl+O, Entrée, Ctrl+X)

# Redémarrer le backend
cd /root/blog_strapi
docker-compose -f docker-compose.mern-prod.yml restart backend
```

### Étape 8: Tests finaux

**Depuis Windows** :

```powershell
# Test HTTPS
Invoke-RestMethod -Uri "https://blog.bh-systems.be/health"

# Test API
Invoke-RestMethod -Uri "https://blog.bh-systems.be/api/categories"

# Ouvrir dans le navigateur
Start-Process "https://blog.bh-systems.be"
```

**Depuis le VPS** :

```bash
# Vérifier les logs Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Vérifier les logs backend
docker logs -f blog-mern-backend-prod
```

## 🔄 Renouvellement automatique

Le certificat se renouvellera automatiquement via le crontab :
- **Fréquence** : Le 5 de chaque mois à 4h22
- **Script** : `/usr/local/sbin/renewCerts.sh`
- **Logs** : `/var/log/cert-renewal.log`

### Test manuel du renouvellement

```bash
# Test sans vraiment renouveler (dry-run)
certbot renew --dry-run

# Ou exécuter le script manuellement
/usr/local/sbin/renewCerts.sh
```

## 📊 Architecture finale

```
┌─────────────────────────────────────────────────────────┐
│                    Internet                              │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
            https://blog.bh-systems.be (443)
                        │
┌───────────────────────┴─────────────────────────────────┐
│                   VPS 173.212.208.181                    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Nginx (Reverse Proxy + SSL Termination)        │   │
│  │  - Certificat SSL OVH (Let's Encrypt)           │   │
│  │  - HTTP → HTTPS redirect                        │   │
│  └────────────┬─────────────────────┬────────────────┘   │
│               │                     │                    │
│               ▼                     ▼                    │
│  ┌─────────────────────┐  ┌──────────────────────┐     │
│  │  Frontend React     │  │  Backend MERN        │     │
│  │  /var/www/blog-...  │  │  Docker :3001        │     │
│  │  React Router v7    │  │  Express + Prisma    │     │
│  └─────────────────────┘  └──────────┬───────────┘     │
│                                       │                  │
│                                       ▼                  │
│                            ┌──────────────────────┐     │
│                            │  PostgreSQL 16       │     │
│                            │  Docker :5432        │     │
│                            └──────────────────────┘     │
└──────────────────────────────────────────────────────────┘
```

## ✅ Checklist complète

- [ ] **DNS OVH** : blog.bh-systems.be → 173.212.208.181 ✅
- [ ] **Clés API OVH** créées sur https://eu.api.ovh.com/createToken/
- [ ] **Fichier ~/.ovhapi** créé sur le VPS avec les bonnes clés
- [ ] **Script setup-ssl-ovh.sh** exécuté avec succès
- [ ] **Certificat SSL** généré (certbot certificates)
- [ ] **Nginx installé** et configuré
- [ ] **Config Nginx** copiée et activée
- [ ] **Frontend buildé** (npm run build)
- [ ] **Frontend déployé** dans /var/www/blog-frontend
- [ ] **Backend CORS** configuré pour HTTPS
- [ ] **Backend redémarré** (docker-compose restart)
- [ ] **Test HTTPS** : https://blog.bh-systems.be fonctionne
- [ ] **Test API** : https://blog.bh-systems.be/api fonctionne
- [ ] **Crontab** configuré pour renouvellement automatique

## 🚨 Dépannage

### Erreur: "Incorrect authorization"

```bash
# Vérifier que les clés API sont correctes
cat /root/.ovhapi

# Vérifier les permissions
ls -la /root/.ovhapi  # Devrait être 600
```

### Erreur: "DNS problem: NXDOMAIN"

```bash
# Vérifier que le DNS est bien configuré
dig blog.bh-systems.be @8.8.8.8
# Devrait retourner 173.212.208.181
```

### Erreur 502 Bad Gateway

```bash
# Vérifier que le backend tourne
docker ps | grep backend

# Tester le backend directement
curl http://localhost:3001/health

# Vérifier les logs
docker logs blog-mern-backend-prod
```

### Erreur CORS

```bash
# Vérifier la config backend
docker exec blog-mern-backend-prod env | grep CORS

# Doit contenir blog.bh-systems.be
```

## 📝 Fichiers importants

| Fichier | Emplacement | Description |
|---------|-------------|-------------|
| **Certificat SSL** | `/etc/letsencrypt/live/blog.bh-systems.be/` | Certificat et clé privée |
| **Config Nginx** | `/etc/nginx/sites-available/blog.bh-systems.be.conf` | Configuration du site |
| **Frontend** | `/var/www/blog-frontend/` | Fichiers statiques React |
| **Config API OVH** | `/root/.ovhapi` | Clés API OVH (chmod 600) |
| **Script renew** | `/usr/local/sbin/renewCerts.sh` | Renouvellement auto |
| **Logs Nginx** | `/var/log/nginx/` | access.log et error.log |
| **Logs Certbot** | `/var/log/letsencrypt/` | Historique des certificats |

---

**Créé le** : 18 octobre 2025  
**Domaine** : blog.bh-systems.be  
**VPS** : 173.212.208.181  
**Méthode** : Certbot + OVH DNS Challenge  
**Wildcard** : Oui (*.blog.bh-systems.be)
