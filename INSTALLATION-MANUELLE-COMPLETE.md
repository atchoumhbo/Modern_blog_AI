# Installation Manuelle Complète - Blog Strapi

## 📋 Prérequis Système

### 1. Mise à jour du système
```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Installer Node.js (v18.x LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Devrait afficher v18.x.x
npm --version
```

### 3. Installer PostgreSQL 16
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 4. Installer Docker et Docker Compose
```bash
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

### 5. Installer Git
```bash
sudo apt install -y git
```

### 6. Installer PM2 (optionnel, pour gérer Strapi en arrière-plan)
```bash
sudo npm install -g pm2
```

### 7. Installer Nginx (si pas déjà dans Docker)
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 8. Installer Certbot pour SSL
```bash
sudo apt install -y certbot python3-certbot-nginx
```

## 🗄️ Configuration PostgreSQL

### 1. Créer l'utilisateur et la base de données
```bash
sudo -u postgres psql
```

Dans psql :
```sql
CREATE USER strapi WITH PASSWORD 'Str4p1Pr0d_2025!';
CREATE DATABASE blog_strapi OWNER strapi;
GRANT ALL PRIVILEGES ON DATABASE blog_strapi TO strapi;
\q
```

### 2. Configurer PostgreSQL pour accepter les connexions
```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Ajouter cette ligne :
```
local   blog_strapi     strapi                                  md5
host    blog_strapi     strapi          127.0.0.1/32            md5
```

Redémarrer PostgreSQL :
```bash
sudo systemctl restart postgresql
```

### 3. Tester la connexion
```bash
PGPASSWORD='Str4p1Pr0d_2025!' psql -h localhost -U strapi -d blog_strapi
```

## 📦 Dépendances NPM - Backend (Strapi)

### package.json du backend
```json
{
  "name": "blog-strapi-clean",
  "private": true,
  "version": "0.1.0",
  "description": "A Strapi application",
  "scripts": {
    "develop": "strapi develop",
    "start": "strapi start",
    "build": "strapi build",
    "strapi": "strapi"
  },
  "dependencies": {
    "@strapi/strapi": "5.24.1",
    "@strapi/plugin-users-permissions": "5.24.1",
    "@strapi/plugin-i18n": "5.24.1",
    "@strapi/plugin-cloud": "5.24.1",
    "better-sqlite3": "11.8.1",
    "pg": "^8.13.1",
    "redis": "^4.7.0"
  },
  "devDependencies": {
    "@types/node": "22.10.2",
    "typescript": "5.7.2"
  },
  "engines": {
    "node": ">=18.0.0 <=22.x.x",
    "npm": ">=6.0.0"
  }
}
```

### Installation des dépendances backend
```bash
cd /root/blog_strapi/backend
npm install
```

## 📦 Dépendances NPM - Frontend (Remix)

### package.json du frontend
```json
{
  "name": "frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "remix vite:build",
    "dev": "remix vite:dev",
    "start": "remix-serve ./build/server/index.js",
    "typecheck": "tsc"
  },
  "dependencies": {
    "@remix-run/node": "^2.15.1",
    "@remix-run/react": "^2.15.1",
    "@remix-run/serve": "^2.15.1",
    "@tanstack/react-query": "^5.62.7",
    "isbot": "^4.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-markdown": "^9.0.1",
    "remark-gfm": "^4.0.0"
  },
  "devDependencies": {
    "@remix-run/dev": "^2.15.1",
    "@types/react": "^18.2.20",
    "@types/react-dom": "^18.2.7",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.1.6",
    "vite": "^5.1.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Installation des dépendances frontend
```bash
cd /root/blog_strapi/frontend
npm install
```

## 🔧 Configuration Backend Strapi

### 1. Fichier .env (à créer dans /root/blog_strapi/backend/)
```env
HOST=0.0.0.0
PORT=1339

# Database
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=blog_strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=Str4p1Pr0d_2025!
DATABASE_SSL=false

# Secrets (GÉNÉRER DE NOUVELLES CLÉS!)
APP_KEYS=générer_avec_openssl_rand_base64_32
API_TOKEN_SALT=générer_avec_openssl_rand_base64_32
ADMIN_JWT_SECRET=générer_avec_openssl_rand_base64_32
TRANSFER_TOKEN_SALT=générer_avec_openssl_rand_base64_32
JWT_SECRET=générer_avec_openssl_rand_base64_32

# Redis (si utilisé avec Docker)
REDIS_HOST=localhost
REDIS_PORT=6379

# Admin
NODE_ENV=production
```

### 2. Générer les secrets
```bash
echo "APP_KEYS=$(openssl rand -base64 32),$(openssl rand -base64 32)"
echo "API_TOKEN_SALT=$(openssl rand -base64 32)"
echo "ADMIN_JWT_SECRET=$(openssl rand -base64 32)"
echo "TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 32)"
```

### 3. Fichier config/server.ts
```typescript
export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1339),
  proxy: true,
  url: env('PUBLIC_URL', 'https://blog.bh-systems.be'),
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
```

### 4. Fichier config/database.ts
```typescript
export default ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', 'localhost'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'blog_strapi'),
      user: env('DATABASE_USERNAME', 'strapi'),
      password: env('DATABASE_PASSWORD', 'Str4p1Pr0d_2025!'),
      ssl: env.bool('DATABASE_SSL', false),
    },
    debug: false,
  },
});
```

### 5. Fichier config/admin.ts
```typescript
export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
    sessions: {
      cookie: {
        secure: false, // Pour fonctionner derrière Nginx proxy
        sameSite: 'lax',
        httpOnly: true,
      },
    },
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
});
```

## 🐳 Configuration Docker Compose

### docker-compose.yml (pour Nginx, Redis, Frontend)
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: blog-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.vps-hybrid.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    networks:
      - blog-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: blog-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - blog-network
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: blog-frontend
    environment:
      - NODE_ENV=production
      - STRAPI_API_URL=http://172.17.0.1:1339
    ports:
      - "3000:3000"
    networks:
      - blog-network
    restart: unless-stopped

networks:
  blog-network:
    driver: bridge

volumes:
  redis-data:
```

## 🌐 Configuration Nginx

### nginx/nginx.vps-hybrid.conf
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    upstream strapi_backend {
        server 172.17.0.1:1339;  # Strapi sur l'hôte
    }

    upstream frontend {
        server frontend:3000;
    }

    # Redirection HTTP vers HTTPS
    server {
        listen 80;
        server_name blog.bh-systems.be;
        return 301 https://$server_name$request_uri;
    }

    # Configuration HTTPS
    server {
        listen 443 ssl http2;
        server_name blog.bh-systems.be;

        ssl_certificate /etc/letsencrypt/live/blog.bh-systems.be/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/blog.bh-systems.be/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        client_max_body_size 100M;

        # Strapi Admin & API
        location ~ ^/(admin|api|uploads|i18n|users-permissions|content-manager|content-type-builder) {
            proxy_pass http://strapi_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

## 🚀 Démarrage de l'application

### 1. Builder Strapi Admin
```bash
cd /root/blog_strapi/backend
NODE_ENV=production npm run build
```

### 2. Créer le premier utilisateur admin (développement)
```bash
cd /root/blog_strapi/backend
NODE_ENV=development npm run develop
# Ouvrir http://VOTRE_IP:1337/admin et créer le compte admin
# Ctrl+C pour arrêter
```

### 3. Démarrer Strapi en production (PM2)
```bash
cd /root/blog_strapi/backend
pm2 start npm --name "strapi" -- run start
pm2 save
pm2 startup  # Suivre les instructions
```

OU avec nohup :
```bash
cd /root/blog_strapi/backend
NODE_ENV=production nohup npm run start > /root/strapi.log 2>&1 &
```

### 4. Builder le Frontend
```bash
cd /root/blog_strapi/frontend
npm run build
```

### 5. Démarrer Docker Compose
```bash
cd /root/blog_strapi
docker-compose up -d
```

### 6. Vérifier que tout fonctionne
```bash
docker ps  # Vérifier les containers
pm2 status  # Vérifier Strapi
curl http://localhost:1339/api/articles  # Tester l'API
```

## 🔒 Configuration SSL avec Let's Encrypt

```bash
sudo certbot --nginx -d blog.bh-systems.be
sudo systemctl reload nginx
```

Renouvellement automatique :
```bash
sudo certbot renew --dry-run
```

## 🗄️ Fix Permissions API (SQL)

Utilisez le fichier `fix-permissions.sql` :
```bash
cd /root/blog_strapi
PGPASSWORD='Str4p1Pr0d_2025!' psql -h localhost -U strapi -d blog_strapi -f fix-permissions.sql
```

## 📊 Commandes de vérification

```bash
# Vérifier Strapi
curl http://localhost:1339/admin
curl http://localhost:1339/api/articles

# Vérifier Frontend
curl http://localhost:3000

# Vérifier Nginx
curl https://blog.bh-systems.be/api/articles

# Voir les logs Strapi
tail -f /root/strapi.log
# OU
pm2 logs strapi

# Voir les logs Docker
docker-compose logs -f

# Vérifier PostgreSQL
PGPASSWORD='Str4p1Pr0d_2025!' psql -h localhost -U strapi -d blog_strapi -c "SELECT * FROM up_roles;"
```

## 🔄 Redémarrage complet

```bash
# Arrêter tout
pm2 stop strapi
docker-compose down

# Redémarrer
pm2 start strapi
docker-compose up -d
```

## 📝 Checklist finale

- [ ] Node.js v18 installé
- [ ] PostgreSQL 16 installé et configuré
- [ ] Docker et Docker Compose installés
- [ ] Repository cloné dans /root/blog_strapi
- [ ] .env créé avec tous les secrets
- [ ] npm install dans backend/
- [ ] npm install dans frontend/
- [ ] Strapi build exécuté
- [ ] Premier admin créé
- [ ] Permissions SQL appliquées
- [ ] Docker containers démarrés
- [ ] Strapi démarré avec PM2 ou nohup
- [ ] SSL configuré avec Certbot
- [ ] Tests API réussis
- [ ] Frontend accessible

## 🆘 Troubleshooting

### Strapi ne démarre pas
```bash
# Vérifier les logs
tail -100 /root/strapi.log
# Vérifier le port
netstat -tlnp | grep 1339
# Tuer les processus bloquants
pkill -f "strapi start"
```

### Database connection error
```bash
# Vérifier PostgreSQL
sudo systemctl status postgresql
# Tester la connexion
PGPASSWORD='Str4p1Pr0d_2025!' psql -h localhost -U strapi -d blog_strapi
```

### 403 Forbidden sur l'API
```bash
# Ré-appliquer les permissions
cd /root/blog_strapi
PGPASSWORD='Str4p1Pr0d_2025!' psql -h localhost -U strapi -d blog_strapi -f fix-permissions.sql
```

### Cannot send secure cookie
```bash
# Vérifier config/admin.ts - secure doit être à false
# Redémarrer Strapi après modification
pm2 restart strapi
```

Bon courage ! 🚀
