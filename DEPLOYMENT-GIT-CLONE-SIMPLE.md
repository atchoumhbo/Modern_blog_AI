# Deployment Guide – Git Clone Simple (Méthode Recommandée)

## ✅ MÉTHODE LA PLUS SIMPLE ET RAPIDE

Cloner directement le projet depuis Git et le démarrer. Pas besoin de copier des fichiers !

---

## Prerequisites
- Ubuntu 22.04/24.04 Server (VPS)
- Root or sudo privileges
- Accès au repository : `https://github.com/boujrafh/blog_strapi.git`

---

## ÉTAPE 1 : Préparer le Système

```bash
# Mettre à jour le système
sudo apt update -y && sudo apt upgrade -y

# Installer Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Doit afficher v18.x.x

# Installer Git
sudo apt install -y git

# Installer PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

## ÉTAPE 2 : Créer la Base de Données

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql
```

Dans PostgreSQL :
```sql
-- Créer l'utilisateur et la base de données
CREATE USER strapi_admin WITH PASSWORD 'Password123!';
ALTER USER strapi_admin WITH SUPERUSER;
CREATE DATABASE strapi_db OWNER strapi_admin;
GRANT ALL PRIVILEGES ON DATABASE strapi_db TO strapi_admin;
\q
```

Tester la connexion :
```bash
PGPASSWORD='Password123!' psql -U strapi_admin -h 127.0.0.1 -d strapi_db -c "\l"
```

---

## ÉTAPE 3 : Cloner le Projet depuis Git

```bash
# Aller dans le dossier root
cd /root

# Cloner le projet
git clone https://github.com/boujrafh/blog_strapi.git

# Entrer dans le dossier backend
cd blog_strapi/backend
```

---

## ÉTAPE 4 : Configurer l'Environnement

```bash
# Créer le fichier .env
nano .env
```

Ajouter cette configuration :
```env
# Server
HOST=0.0.0.0
PORT=1337
NODE_ENV=production

# Database
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=strapi_db
DATABASE_USERNAME=strapi_admin
DATABASE_PASSWORD=Password123!
DATABASE_SSL=false

# Secrets - GÉNÉRER DE NOUVELLES CLÉS !
APP_KEYS=générer_avec_openssl
API_TOKEN_SALT=générer_avec_openssl
ADMIN_JWT_SECRET=générer_avec_openssl
TRANSFER_TOKEN_SALT=générer_avec_openssl
JWT_SECRET=générer_avec_openssl
```

**Générer les secrets** :
```bash
echo "APP_KEYS=$(openssl rand -base64 32),$(openssl rand -base64 32)"
echo "API_TOKEN_SALT=$(openssl rand -base64 32)"
echo "ADMIN_JWT_SECRET=$(openssl rand -base64 32)"
echo "TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 32)"
```

Copier les valeurs générées et les mettre dans le fichier `.env`, puis sauvegarder (Ctrl+X, Y, Enter).

---

## ÉTAPE 5 : Installer les Dépendances

```bash
cd /root/blog_strapi/backend

# Installer les dépendances
npm install

# Cela peut prendre 2-3 minutes
```

---

## ÉTAPE 6 : Builder le Projet

```bash
# Builder l'admin panel
npm run build

# Cela va compiler tous les fichiers TypeScript et créer l'interface admin
```

---

## ÉTAPE 7 : Créer le Premier Admin (Mode Développement)

```bash
# Démarrer en mode développement pour créer l'admin
NODE_ENV=development npm run develop
```

- Ouvrir `http://YOUR_VPS_IP:1337/admin` dans votre navigateur
- Créer votre compte administrateur
- Après création, **arrêter Strapi** (Ctrl+C dans le terminal)

---

## ÉTAPE 8 : Démarrer en Production avec PM2

```bash
# Installer PM2 globalement
sudo npm install -g pm2

# Démarrer Strapi en production
cd /root/blog_strapi/backend
pm2 start npm --name "strapi" -- run start

# Sauvegarder la configuration PM2
pm2 save

# Configurer le démarrage automatique
pm2 startup
# Suivre les instructions affichées
```

---

## ÉTAPE 9 : Configurer les Permissions API

### Option 1 : Via l'interface admin

1. Se connecter à `http://YOUR_VPS_IP:1337/admin`
2. Aller dans **Settings → Users & Permissions Plugin → Roles → Public**
3. Pour chaque content-type (Article, Project, Category, Tag), cocher :
   - ✅ find
   - ✅ findOne
4. Cliquer sur **Save**

### Option 2 : Via SQL (plus rapide)

```bash
cd /root/blog_strapi

# Vérifier si le fichier fix-permissions.sql existe
ls -la fix-permissions.sql

# Si oui, l'exécuter :
PGPASSWORD='Password123!' psql -U strapi_admin -h 127.0.0.1 -d strapi_db -f fix-permissions.sql
```

---

## ÉTAPE 10 : Tester l'API

```bash
# Tester les endpoints
curl http://localhost:1337/api/articles
curl http://localhost:1337/api/projects
curl http://localhost:1337/api/categories
curl http://localhost:1337/api/tags
```

Vous devriez voir `{"data":[],"meta":{}}` au lieu d'une erreur 403.

---

## ÉTAPE 11 : Configurer Nginx (Optionnel)

### Installer Nginx

```bash
sudo apt install -y nginx
```

### Configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/strapi
```

Ajouter :
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Remplacer par votre domaine

    client_max_body_size 100M;

    # Strapi Admin & API
    location / {
        proxy_pass http://localhost:1337;
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
```

Activer le site :
```bash
sudo ln -s /etc/nginx/sites-available/strapi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Installer SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔄 Mises à Jour du Projet

Pour mettre à jour le projet depuis Git :

```bash
# Arrêter Strapi
pm2 stop strapi

# Aller dans le dossier
cd /root/blog_strapi

# Récupérer les dernières modifications
git pull origin master

# Installer les nouvelles dépendances (si package.json a changé)
cd backend
npm install

# Rebuild
npm run build

# Redémarrer
pm2 restart strapi

# Vérifier les logs
pm2 logs strapi
```

---

## 📊 Commandes Utiles

### Gestion PM2

```bash
pm2 status          # Voir l'état de Strapi
pm2 logs strapi     # Voir les logs en temps réel
pm2 restart strapi  # Redémarrer Strapi
pm2 stop strapi     # Arrêter Strapi
pm2 delete strapi   # Supprimer de PM2
```

### Logs

```bash
# Logs PM2
pm2 logs strapi --lines 100

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Base de données

```bash
# Se connecter à la DB
PGPASSWORD='Password123!' psql -U strapi_admin -h 127.0.0.1 -d strapi_db

# Backup de la DB
pg_dump -U strapi_admin -h 127.0.0.1 strapi_db > backup_$(date +%Y%m%d).sql

# Restore de la DB
PGPASSWORD='Password123!' psql -U strapi_admin -h 127.0.0.1 strapi_db < backup_20251016.sql
```

---

## 🔧 Troubleshooting

### Strapi ne démarre pas

```bash
# Vérifier les logs
pm2 logs strapi

# Vérifier le port
netstat -tlnp | grep 1337

# Vérifier les permissions
cd /root/blog_strapi/backend
chown -R root:root .
chmod -R 755 .
```

### Erreur de connexion à la base de données

```bash
# Tester la connexion PostgreSQL
PGPASSWORD='Password123!' psql -U strapi_admin -h 127.0.0.1 -d strapi_db

# Vérifier que PostgreSQL tourne
sudo systemctl status postgresql

# Redémarrer PostgreSQL
sudo systemctl restart postgresql
```

### API retourne 403 Forbidden

```bash
# Vérifier les permissions dans l'admin
# OU réappliquer le script SQL
cd /root/blog_strapi
PGPASSWORD='Password123!' psql -U strapi_admin -h 127.0.0.1 -d strapi_db -f fix-permissions.sql
```

### Content-Type Builder ne charge pas

```bash
# Rebuild complet
cd /root/blog_strapi/backend
pm2 stop strapi
rm -rf .cache dist build
npm install
npm run build
pm2 start strapi
```

---

## ✅ Checklist de Déploiement

- [ ] Node.js 18 installé
- [ ] PostgreSQL installé et configuré
- [ ] Git installé
- [ ] Repository cloné dans `/root/blog_strapi`
- [ ] Fichier `.env` créé avec tous les secrets
- [ ] `npm install` exécuté
- [ ] `npm run build` exécuté
- [ ] Premier admin créé
- [ ] Permissions API configurées
- [ ] PM2 installé et Strapi démarré
- [ ] Nginx configuré (optionnel)
- [ ] SSL installé (optionnel)
- [ ] API testée et fonctionnelle

---

## 🎯 Avantages de cette Méthode

✅ **Simple** - Une seule commande git clone  
✅ **Rapide** - Pas de copie de fichiers  
✅ **Complet** - Tous les fichiers sont présents  
✅ **Maintenable** - Facile à mettre à jour avec git pull  
✅ **Reproductible** - Fonctionne sur n'importe quel serveur  

---

## 🚀 Résultat Final

Après cette procédure, vous aurez :

- ✅ Strapi fonctionnel en production
- ✅ Tous vos content-types (Article, Project, Category, Tag)
- ✅ Content-Type Builder qui fonctionne
- ✅ API publique accessible
- ✅ Admin panel accessible
- ✅ Facilité de mise à jour via Git

---

**C'est la méthode recommandée pour déployer votre projet Strapi existant !**

*Testé avec succès sur Ubuntu 24.04 LTS + Strapi 5.28.0*
