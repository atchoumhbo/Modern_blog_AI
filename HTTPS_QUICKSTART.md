# 🚀 Déploiement HTTPS - Quick Start

## ⚡ Déploiement en 3 étapes

### 1️⃣ Créer les clés API OVH (5 minutes)

Rendez-vous sur : **https://eu.api.ovh.com/createToken/**

**Remplissez** :
- Application name : `certbot-blog`
- Validity : `Unlimited`

**Droits nécessaires** :
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

**Notez les 3 clés** :
- Application Key
- Application Secret  
- Consumer Key

### 2️⃣ Configurer le VPS (2 minutes)

```bash
ssh root@173.212.208.181

cat > /root/.ovhapi <<'EOF'
dns_ovh_endpoint = ovh-eu
dns_ovh_application_key = VOTRE_APPLICATION_KEY_ICI
dns_ovh_application_secret = VOTRE_APPLICATION_SECRET_ICI
dns_ovh_consumer_key = VOTRE_CONSUMER_KEY_ICI
EOF

chmod 600 /root/.ovhapi
exit
```

### 3️⃣ Lancer le déploiement (5-10 minutes)

```powershell
cd C:\Devops\blog_strapi
.\deploy-https-ovh.ps1
```

Le script fait **automatiquement** :
- ✅ Vérification DNS et backend
- ✅ Installation Certbot + plugin OVH
- ✅ Génération certificat SSL (+ wildcard)
- ✅ Installation et configuration Nginx
- ✅ Build frontend React Router v7
- ✅ Déploiement frontend sur `/var/www/blog-frontend`
- ✅ Configuration CORS backend
- ✅ Tests HTTPS complets

## ✅ Résultat

Votre blog sera accessible sur :
- 🌐 **Frontend** : https://blog.bh-systems.be
- 🔌 **API** : https://blog.bh-systems.be/api
- 💚 **Health** : https://blog.bh-systems.be/health

**Certificat SSL** :
- Let's Encrypt via OVH DNS Challenge
- Wildcard : `*.blog.bh-systems.be`
- Renouvellement automatique mensuel

## 📚 Documentation complète

| Fichier | Description |
|---------|-------------|
| `SSL_SETUP_OVH.md` | Guide détaillé étape par étape |
| `setup-ssl-ovh.sh` | Script bash SSL (VPS) |
| `deploy-https-ovh.ps1` | Script PowerShell déploiement complet |
| `nginx/blog.bh-systems.be.conf` | Configuration Nginx HTTPS |

## 🔧 Commandes utiles

```bash
# Vérifier certificat
ssh root@173.212.208.181 "certbot certificates"

# Logs Nginx
ssh root@173.212.208.181 "tail -f /var/log/nginx/error.log"

# Logs backend
ssh root@173.212.208.181 "docker logs -f blog-mern-backend-prod"

# Tester renouvellement SSL
ssh root@173.212.208.181 "certbot renew --dry-run"
```

## 🚨 Dépannage

### Erreur API OVH
Vérifiez `/root/.ovhapi` sur le VPS

### Erreur DNS
```bash
nslookup blog.bh-systems.be
# Doit retourner 173.212.208.181
```

### Erreur 502
```bash
# Vérifier backend
ssh root@173.212.208.181 "docker ps"
curl http://173.212.208.181:3001/health
```

---

**Temps total** : ~15 minutes  
**Niveau** : Intermédiaire  
**Prérequis** : DNS configuré, VPS accessible, clés OVH
