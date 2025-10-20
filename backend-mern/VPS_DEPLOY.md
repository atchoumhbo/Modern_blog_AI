# 🚀 Déploiement VPS - Modern Blog Leader Backend

Guide complet pour déployer sur votre VPS **173.212.208.181**

---

## 📋 Prérequis VPS

```bash
# Se connecter au VPS
ssh root@173.212.208.181

# Vérifier les installations
docker --version          # ✅ Docker installé
docker-compose --version  # ✅ Docker Compose installé
git --version            # ✅ Git installé
```

---

## 🎯 Déploiement étape par étape

### 1. Préparer le VPS

```bash
# Créer le dossier projet
cd /root/blog_strapi
mkdir -p backend-mern
cd backend-mern

# Ou cloner depuis Git si poussé
git clone https://github.com/boujrafh/blog_strapi.git
cd blog_strapi/backend-mern
```

### 2. Configuration .env

```bash
# Créer .env depuis votre machine locale
# Copier backend-mern/.env vers le VPS

# OU créer directement sur le VPS
nano .env
```

**Contenu .env PRODUCTION :**

```bash
# Environnement
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Base de données PostgreSQL
DATABASE_URL="postgresql://postgres:Str4p1Pr0d_2025!@postgres:5432/blog_mern?schema=public"

# JWT Secrets (GÉNÉRER DE NOUVELLES VALEURS !)
# Commande: openssl rand -base64 32
JWT_SECRET=NOUVELLE_VALEUR_SECURISEE_ICI
JWT_REFRESH_SECRET=AUTRE_VALEUR_SECURISEE_ICI
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API Keys Salt
API_KEY_SALT=VALEUR_SALT_SECURISEE_ICI

# CORS Origins (vos domaines)
CORS_ORIGINS=https://blog.bh-systems.be,http://173.212.208.181:5173

# Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=/app/uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logs
LOG_LEVEL=info
```

**⚠️ IMPORTANT : Générer de vrais secrets !**

```bash
# Sur le VPS
openssl rand -base64 32  # Pour JWT_SECRET
openssl rand -base64 32  # Pour JWT_REFRESH_SECRET
openssl rand -base64 32  # Pour API_KEY_SALT
```

### 3. Build et démarrage

```bash
# Build les images Docker
docker-compose build

# Démarrer PostgreSQL
docker-compose up -d postgres

# Attendre que PostgreSQL soit prêt
sleep 30

# Vérifier PostgreSQL
docker-compose ps
docker-compose logs postgres

# Appliquer les migrations
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE blog_mern;"
# OU laisser Prisma le créer

# Démarrer le backend
docker-compose up -d backend

# Vérifier les logs
docker-compose logs -f backend
```

### 4. Initialiser la base de données

```bash
# Appliquer les migrations Prisma
docker-compose exec backend npx prisma migrate deploy

# Seed les données initiales (admin, categories, tags)
docker-compose exec backend npm run seed

# Vérifier
docker-compose exec postgres psql -U postgres -d blog_mern -c "SELECT email FROM users;"
```

### 5. Vérifications

```bash
# Health check
curl http://localhost:3000/health

# Devrait retourner:
# {"status":"ok","timestamp":"...","uptime":...,"environment":"production"}

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"boujraf.hicham@gmail.com","password":"Admin123!"}'

# Devrait retourner un accessToken
```

---

## 🌐 Configuration Nginx

### Créer le fichier de configuration

```bash
nano /etc/nginx/sites-available/blog-api
```

**Contenu :**

```nginx
# Backend API
server {
    listen 80;
    server_name blog.bh-systems.be api.bh-systems.be;

    # Logs
    access_log /var/log/nginx/blog-api-access.log;
    error_log /var/log/nginx/blog-api-error.log;

    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://localhost:3000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering off;
    }

    # Uploads
    location /uploads {
        proxy_pass http://localhost:3000/uploads;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        
        # Cache pour les images
        proxy_cache_valid 200 1d;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # Rate limiting pour API
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;
}
```

### Activer et tester

```bash
# Créer le lien symbolique
ln -s /etc/nginx/sites-available/blog-api /etc/nginx/sites-enabled/

# Tester la configuration
nginx -t

# Recharger Nginx
systemctl reload nginx

# Tester depuis l'extérieur
curl http://173.212.208.181/health
curl http://173.212.208.181/api
```

---

## 🔒 SSL avec Let's Encrypt

```bash
# Installer Certbot
apt install certbot python3-certbot-nginx -y

# Obtenir le certificat
certbot --nginx -d blog.bh-systems.be -d api.bh-systems.be

# Vérifier le renouvellement automatique
certbot renew --dry-run

# Auto-renewal est configuré dans cron
systemctl status certbot.timer
```

---

## 🔐 Créer la première API Key pour N8N

```bash
# 1. Login pour obtenir JWT
JWT=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"boujraf.hicham@gmail.com","password":"Admin123!"}' \
  | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

echo "JWT Token: $JWT"

# 2. Créer l'API Key
curl -X POST http://localhost:3000/api/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "name": "N8N Production",
    "expiresInDays": 365,
    "canRead": true,
    "canWrite": true,
    "canDelete": false,
    "rateLimit": 2000
  }'

# ⚠️ SAUVEGARDER LA CLÉ RETOURNÉE IMMÉDIATEMENT !
```

---

## 🔄 Mises à jour et maintenance

### Update du code

```bash
cd /root/blog_strapi/backend-mern

# Pull les derniers changements
git pull origin master

# Rebuild et redémarrage
docker-compose down
docker-compose build
docker-compose up -d

# Appliquer les nouvelles migrations si nécessaire
docker-compose exec backend npx prisma migrate deploy
```

### Backup de la base de données

```bash
# Créer un backup
docker-compose exec postgres pg_dump -U postgres blog_mern > backup_$(date +%Y%m%d_%H%M%S).sql

# Ou avec un script automatisé
cat << 'EOF' > /root/scripts/backup-blog-db.sh
#!/bin/bash
BACKUP_DIR="/root/backups/blog"
mkdir -p $BACKUP_DIR
cd /root/blog_strapi/backend-mern
docker-compose exec -T postgres pg_dump -U postgres blog_mern | gzip > $BACKUP_DIR/blog_$(date +%Y%m%d_%H%M%S).sql.gz
# Garder seulement les 30 derniers jours
find $BACKUP_DIR -name "blog_*.sql.gz" -mtime +30 -delete
EOF

chmod +x /root/scripts/backup-blog-db.sh

# Ajouter au cron (tous les jours à 2h du matin)
echo "0 2 * * * /root/scripts/backup-blog-db.sh" | crontab -
```

### Logs

```bash
# Voir les logs du backend
docker-compose logs -f backend

# Logs PostgreSQL
docker-compose logs -f postgres

# Logs Nginx
tail -f /var/log/nginx/blog-api-access.log
tail -f /var/log/nginx/blog-api-error.log

# Logs système Docker
journalctl -u docker -f
```

### Monitoring

```bash
# Ressources utilisées
docker stats

# Espace disque
df -h

# Vérifier les containers
docker-compose ps

# Restart si nécessaire
docker-compose restart backend
```

---

## 🐛 Troubleshooting

### Backend ne démarre pas

```bash
# Vérifier les logs
docker-compose logs backend

# Erreur commune: PostgreSQL pas prêt
# Solution: Attendre 30s et redémarrer
docker-compose restart backend
```

### Erreur de connexion PostgreSQL

```bash
# Vérifier que PostgreSQL tourne
docker-compose ps postgres

# Tester la connexion
docker-compose exec postgres psql -U postgres -c "SELECT 1;"

# Vérifier les credentials dans .env
cat .env | grep DATABASE_URL
```

### 502 Bad Gateway (Nginx)

```bash
# Vérifier que le backend tourne
curl http://localhost:3000/health

# Vérifier les logs Nginx
tail -f /var/log/nginx/blog-api-error.log

# Redémarrer Nginx
systemctl restart nginx
```

### Rate limiting trop strict

```bash
# Augmenter les limites dans Nginx
nano /etc/nginx/sites-available/blog-api

# Modifier:
# limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;

nginx -t && systemctl reload nginx
```

---

## 📊 Monitoring et alertes

### Script de health check

```bash
cat << 'EOF' > /root/scripts/check-api-health.sh
#!/bin/bash
HEALTH_URL="http://localhost:3000/health"
ALERT_EMAIL="boujraf.hicham@gmail.com"

if ! curl -sf "$HEALTH_URL" > /dev/null; then
    echo "API is DOWN! Restarting..." | mail -s "Blog API Down" "$ALERT_EMAIL"
    cd /root/blog_strapi/backend-mern
    docker-compose restart backend
fi
EOF

chmod +x /root/scripts/check-api-health.sh

# Ajouter au cron (toutes les 5 minutes)
echo "*/5 * * * * /root/scripts/check-api-health.sh" | crontab -
```

---

## 🎯 Checklist finale

- [ ] .env configuré avec secrets sécurisés
- [ ] PostgreSQL démarré et accessible
- [ ] Backend démarré et health check OK
- [ ] Migrations Prisma appliquées
- [ ] Seed exécuté (admin créé)
- [ ] Nginx configuré et SSL activé
- [ ] API Key créée pour N8N
- [ ] Backup automatique configuré
- [ ] Monitoring activé
- [ ] Tests API passés

---

## 📚 Commandes utiles

```bash
# Redémarrage complet
docker-compose down && docker-compose up -d

# Voir les processus
docker-compose ps

# Shell dans le container backend
docker-compose exec backend sh

# Shell dans PostgreSQL
docker-compose exec postgres psql -U postgres -d blog_mern

# Nettoyer Docker
docker system prune -a

# Sauvegarder .env
cp .env .env.backup.$(date +%Y%m%d)
```

---

**Votre backend MERN est maintenant déployé et sécurisé ! 🎉**

**Prochaines étapes :**
1. Créer l'API Key pour N8N
2. Tester l'intégration N8N
3. Configurer le frontend pour pointer vers l'API
4. Implémenter les controllers restants si nécessaire

---

**Made with ❤️ for Modern Blog Leader**
