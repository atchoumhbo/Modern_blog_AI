# 🌐 Configuration HTTPS pour blog.bh-systems.be

## 📋 Prérequis

1. **DNS configuré**: `blog.bh-systems.be` → `173.212.208.181`
2. **Ports ouverts**: 80 (HTTP), 443 (HTTPS)
3. **Nginx installé** sur le VPS
4. **Certbot installé** pour Let's Encrypt

## 🚀 Guide de déploiement HTTPS

### Étape 1: Vérifier le DNS

```bash
# Sur votre machine locale
nslookup blog.bh-systems.be
# Devrait retourner: 173.212.208.181
```

### Étape 2: Installer Nginx et Certbot sur le VPS

```bash
ssh root@173.212.208.181

# Installer Nginx
apt update
apt install -y nginx

# Installer Certbot
apt install -y certbot python3-certbot-nginx

# Vérifier Nginx
nginx -v
systemctl status nginx
```

### Étape 3: Créer le répertoire pour Certbot

```bash
# Sur le VPS
mkdir -p /var/www/certbot
chown -R www-data:www-data /var/www/certbot
```

### Étape 4: Configuration Nginx temporaire (HTTP seulement)

```bash
# Copier la config
scp C:\Devops\blog_strapi\nginx\blog.bh-systems.be.conf root@173.212.208.181:/etc/nginx/sites-available/

# Sur le VPS
cd /etc/nginx/sites-available

# Créer une version temporaire HTTP pour Certbot
cat > blog.bh-systems.be-temp.conf <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name blog.bh-systems.be;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location /health {
        proxy_pass http://localhost:3000/health;
    }
    
    location / {
        return 200 "Blog backend is running. SSL setup in progress...";
        add_header Content-Type text/plain;
    }
}
EOF

# Activer la config temporaire
ln -s /etc/nginx/sites-available/blog.bh-systems.be-temp.conf /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # Supprimer config par défaut

# Tester et recharger
nginx -t
systemctl reload nginx
```

### Étape 5: Obtenir le certificat SSL

```bash
# Sur le VPS
certbot --nginx -d blog.bh-systems.be

# Suivre les instructions:
# 1. Entrer votre email
# 2. Accepter les ToS
# 3. Choisir si partager l'email (optionnel)
# 4. Certbot configurera automatiquement Nginx

# Ou en mode standalone:
certbot certonly --standalone -d blog.bh-systems.be
```

### Étape 6: Installer la configuration finale

```bash
# Sur le VPS
rm /etc/nginx/sites-enabled/blog.bh-systems.be-temp.conf

# Copier la vraie config (depuis votre machine)
scp C:\Devops\blog_strapi\nginx\blog.bh-systems.be.conf root@173.212.208.181:/etc/nginx/sites-available/

# Sur le VPS
ln -s /etc/nginx/sites-available/blog.bh-systems.be.conf /etc/nginx/sites-enabled/

# Tester et recharger
nginx -t
systemctl reload nginx
```

### Étape 7: Build et déployer le frontend

```powershell
# Sur votre machine locale
cd C:\Devops\blog_strapi\frontend

# Créer .env.production
@"
VITE_BACKEND_TYPE=mern
VITE_API_URL=https://blog.bh-systems.be/api
VITE_STRAPI_URL=https://blog.bh-systems.be
VITE_SITE_URL=https://blog.bh-systems.be
"@ | Out-File -FilePath .env.production -Encoding UTF8

# Build production
npm run build

# Le dossier dist/ sera créé

# Transférer vers le VPS
scp -r dist/* root@173.212.208.181:/var/www/blog-frontend/
```

### Étape 8: Configurer CORS sur le backend

```bash
# Sur le VPS
ssh root@173.212.208.181

# Éditer .env.production du backend
cd /root/blog_strapi/backend-mern
nano .env.production

# Ajouter/modifier:
CORS_ORIGINS="https://blog.bh-systems.be,http://localhost:5173"
FRONTEND_URL="https://blog.bh-systems.be"

# Redémarrer le backend
docker-compose -f docker-compose.prod.yml restart backend
```

### Étape 9: Tester

```powershell
# Test health check
curl https://blog.bh-systems.be/health

# Test API
curl https://blog.bh-systems.be/api/categories

# Test frontend
Start-Process "https://blog.bh-systems.be"
```

## 🔒 Renouvellement automatique SSL

```bash
# Sur le VPS
# Certbot crée automatiquement un cron job pour le renouvellement
# Vérifier:
systemctl list-timers | grep certbot

# Test manuel du renouvellement:
certbot renew --dry-run

# Le certificat sera renouvelé automatiquement 30 jours avant expiration
```

## 🛡️ Sécurité supplémentaire (optionnel)

```bash
# Sur le VPS

# Firewall UFW
apt install -y ufw
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

# Fail2Ban pour protection SSH
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

## 📊 Architecture finale

```
Internet
    ↓
blog.bh-systems.be (HTTPS:443)
    ↓
Nginx (Reverse Proxy + SSL Termination)
    ↓
    ├─→ Frontend (React SPA) - /var/www/blog-frontend
    └─→ Backend (Docker) - http://localhost:3000/api
            ↓
        PostgreSQL (Docker) - localhost:5432
```

## ✅ Checklist de déploiement

- [ ] DNS configuré (blog.bh-systems.be → 173.212.208.181)
- [ ] Nginx installé sur VPS
- [ ] Certbot installé
- [ ] Configuration Nginx temporaire active
- [ ] Certificat SSL obtenu
- [ ] Configuration Nginx finale active
- [ ] Frontend build en production
- [ ] Frontend déployé sur VPS (/var/www/blog-frontend)
- [ ] CORS configuré sur backend
- [ ] Backend redémarré
- [ ] Tests HTTPS réussis
- [ ] Renouvellement SSL automatique configuré

## 🚨 Troubleshooting

### Erreur: "Connection refused"
```bash
# Vérifier Nginx
systemctl status nginx
nginx -t

# Vérifier les logs
tail -f /var/log/nginx/error.log
```

### Erreur: CORS
```bash
# Vérifier la config backend
docker-compose -f docker-compose.prod.yml exec backend env | grep CORS

# Redémarrer
docker-compose -f docker-compose.prod.yml restart backend
```

### Erreur: 502 Bad Gateway
```bash
# Vérifier que le backend tourne
docker ps
curl http://localhost:3000/health

# Vérifier les logs backend
docker logs blog-mern-backend
```

## 📝 Notes

- Le certificat Let's Encrypt est valide 90 jours
- Le renouvellement automatique se fait 30 jours avant expiration
- Les logs Nginx: `/var/log/nginx/`
- Les certificats SSL: `/etc/letsencrypt/live/blog.bh-systems.be/`

---

**Créé le**: 2025-01-18  
**Domaine**: blog.bh-systems.be  
**IP VPS**: 173.212.208.181  
**Backend**: MERN (Node.js + PostgreSQL)  
**Frontend**: React Router v7
