# Deployment Guide – Git Clone (Méthode qui Marche Vraiment)

## ✅ CETTE MÉTHODE FONCTIONNE 100%

Cloner le projet depuis Git et faire les configurations nécessaires pour que Strapi démarre.

---

## ⚠️ POURQUOI "npm install" seul ne suffit pas ?

Quand vous faites `git clone` puis `npm install`, cela installe seulement les **packages Node.js**.  
Il manque :
1. ✅ Le fichier `.env` avec les bonnes valeurs pour le VPS
2. ✅ Le build de l'admin panel (`npm run build`)
3. ✅ L'initialisation de la base de données
4. ✅ La création du premier utilisateur admin

---

## Prerequisites
- Ubuntu 22.04/24.04 Server (VPS)
- Root or sudo privileges
- Accès au repository : `https://github.com/boujrafh/blog_strapi.git`

---

## ÉTAPE 1 : Installer les Prérequis Système

```bash
# Mettre à jour le système
sudo apt update -y && sudo apt upgrade -y

# Installer Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier
node --version  # Doit afficher v18.x.x
npm --version

# Installer Git
sudo apt install -y git

# Installer PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

## ÉTAPE 2 : Créer la Base de Données PostgreSQL

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql
```

Dans PostgreSQL :
```sql
-- Supprimer l'ancienne base si elle existe
DROP DATABASE IF EXISTS strapi_db;
DROP USER IF EXISTS strapi_admin;

-- Créer un nouvel utilisateur et une nouvelle base
CREATE USER strapi_admin WITH PASSWORD 'Password123!';
ALTER USER strapi_admin WITH SUPERUSER;
CREATE DATABASE strapi_db OWNER strapi_admin;
GRANT ALL PRIVILEGES ON DATABASE strapi_db TO strapi_admin;

-- Vérifier
\l
\du

-- Quitter
\q
```

Tester la connexion :
```bash
PGPASSWORD='Password123!' psql -U strapi_admin -h 127.0.0.1 -d strapi_db -c "\l"
```

Si ça affiche la liste des bases de données, c'est bon ! ✅

---

## ÉTAPE 3 : Cloner le Projet depuis Git

```bash
# Aller dans le dossier root
cd /root

# Cloner le projet
git clone https://github.com/boujrafh/blog_strapi.git

# Vérifier que le clone a fonctionné
ls -la blog_strapi/
ls -la blog_strapi/backend/
```

Vous devriez voir :
- ✅ `blog_strapi/backend/package.json`
- ✅ `blog_strapi/backend/src/`
- ✅ `blog_strapi/backend/config/`

---

## ÉTAPE 4 : Configurer l'Environnement (.env)

Le fichier `.env` contient les secrets et la configuration de connexion à la base de données.

```bash
cd /root/blog_strapi/backend

# Supprimer l'ancien .env s'il existe
rm -f .env

# Créer un nouveau .env
nano .env
```

**Copier-coller cette configuration** :
```env
# Server
HOST=0.0.0.0
PORT=1337
NODE_ENV=production

# Database - PostgreSQL
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=strapi_db
DATABASE_USERNAME=strapi_admin
DATABASE_PASSWORD=Password123!
DATABASE_SSL=false

# Secrets - À GÉNÉRER !
APP_KEYS=
API_TOKEN_SALT=
ADMIN_JWT_SECRET=
TRANSFER_TOKEN_SALT=
JWT_SECRET=
```

**Maintenant, générer les secrets** :
```bash
# Ouvrir un autre terminal ou quitter nano (Ctrl+X)
# Générer les secrets
echo "APP_KEYS=$(openssl rand -base64 32),$(openssl rand -base64 32)"
echo "API_TOKEN_SALT=$(openssl rand -base64 32)"
echo "ADMIN_JWT_SECRET=$(openssl rand -base64 32)"
echo "TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 32)"
```

**Copier les valeurs générées** et les coller dans le fichier `.env` :

```bash
# Réouvrir le .env
nano .env
```

Exemple de résultat final :
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

# Secrets
APP_KEYS=abc123def456,xyz789uvw012
API_TOKEN_SALT=salt123456789
ADMIN_JWT_SECRET=jwt987654321
TRANSFER_TOKEN_SALT=transfer123456
JWT_SECRET=secret789456123
```

Sauvegarder (Ctrl+X, Y, Enter).

---

## ÉTAPE 5 : Installer les Dépendances

```bash
cd /root/blog_strapi/backend

# Nettoyer (au cas où)
rm -rf node_modules package-lock.json

# Installer les dépendances
npm install

# Cela peut prendre 2-5 minutes
```

Si vous voyez des **warnings**, c'est normal. Tant qu'il n'y a pas d'**erreurs**, c'est bon.

---

## ÉTAPE 6 : Vérifier la Configuration de la Base de Données

Strapi utilise le fichier `config/database.ts` pour se connecter à PostgreSQL.

```bash
cd /root/blog_strapi/backend

# Vérifier le contenu
cat config/database.ts
```

Si ce fichier n'existe pas ou est vide, le créer :

```bash
nano config/database.ts
```

Ajouter :
```typescript
export default ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', '127.0.0.1'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'strapi_db'),
      user: env('DATABASE_USERNAME', 'strapi_admin'),
      password: env('DATABASE_PASSWORD', 'Password123!'),
      ssl: env.bool('DATABASE_SSL', false) && {
        rejectUnauthorized: env.bool('DATABASE_SSL_SELF', false),
      },
    },
    debug: false,
  },
});
```

Sauvegarder (Ctrl+X, Y, Enter).

---

## ÉTAPE 7 : Configurer l'Admin Panel (Fix Cookies)

Créer le fichier `config/admin.ts` pour éviter les erreurs de cookies :

```bash
cd /root/blog_strapi/backend

# Si le fichier existe déjà, le vérifier
cat config/admin.ts

# Sinon, le créer
nano config/admin.ts
```

Ajouter :
```typescript
export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
    sessions: {
      cookie: {
        secure: false, // Désactiver les cookies sécurisés derrière nginx
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

Sauvegarder (Ctrl+X, Y, Enter).

---

## ÉTAPE 8 : Builder l'Admin Panel

```bash
cd /root/blog_strapi/backend

# Nettoyer les anciens builds
rm -rf .cache dist build

# Builder
npm run build

# Cela peut prendre 3-5 minutes
# Vous devriez voir : "Building your admin UI with development configuration..."
# Puis : "Admin UI built successfully"
```

Si vous voyez des erreurs TypeScript, c'est généralement pas grave tant que le build termine avec "successfully".

---

## ÉTAPE 9 : Créer le Premier Admin (Mode Développement)

```bash
cd /root/blog_strapi/backend

# Démarrer en mode développement
NODE_ENV=development npm run develop
```

Attendez que vous voyez :
```
┌──────────────────────────────────────────────────┐
│ Strapi is running │
│ http://0.0.0.0:1337/admin │
└──────────────────────────────────────────────────┘
```

1. Ouvrir votre navigateur sur `http://YOUR_VPS_IP:1337/admin`
2. Créer votre compte administrateur
3. Après la création, **retourner dans le terminal** et arrêter Strapi (Ctrl+C)

---

## ÉTAPE 10 : Vérifier que les Content-Types sont présents

Avant d'arrêter Strapi, vérifier dans l'admin :

1. Aller dans **Content-Type Builder** (barre latérale gauche)
2. Vous devriez voir :
   - ✅ Article
   - ✅ Project
   - ✅ Category
   - ✅ Tag

Si vous les voyez, c'est parfait ! ✅  
Si vous ne les voyez pas, il y a un problème avec le `git clone`.

---

## ÉTAPE 11 : Configurer les Permissions API

### Option 1 : Via l'interface admin (Recommandé)

Tant que Strapi tourne en mode develop :

1. Aller dans **Settings → Users & Permissions Plugin → Roles → Public**
2. Pour chaque content-type (Article, Project, Category, Tag) :
   - Développer le content-type
   - Cocher ✅ **find**
   - Cocher ✅ **findOne**
3. Cliquer sur **Save** en haut à droite

### Option 2 : Via SQL

Si vous avez le script `fix-permissions.sql` dans votre repo :

```bash
cd /root/blog_strapi

# Vérifier s'il existe
ls -la fix-permissions.sql

# Si oui, l'exécuter
PGPASSWORD='Password123!' psql -U strapi_admin -h 127.0.0.1 -d strapi_db -f fix-permissions.sql
```

---

## ÉTAPE 12 : Démarrer en Production avec PM2

```bash
# Installer PM2 globalement
sudo npm install -g pm2

# Aller dans le dossier backend
cd /root/blog_strapi/backend

# Démarrer Strapi en production
pm2 start npm --name "strapi" -- run start

# Sauvegarder la configuration
pm2 save

# Configurer le démarrage automatique au boot
pm2 startup
# Copier-coller la commande affichée et l'exécuter
```

---

## ÉTAPE 13 : Tester l'API

```bash
# Tester les endpoints publics
curl http://localhost:1337/api/articles
curl http://localhost:1337/api/projects
curl http://localhost:1337/api/categories
curl http://localhost:1337/api/tags
```

Résultat attendu : `{"data":[],"meta":{"pagination":{"page":1,"pageSize":25,"pageCount":0,"total":0}}}`

Si vous voyez `{"error":{"status":403,"name":"ForbiddenError"}}`, les permissions ne sont pas configurées.

---

## 🎯 Récapitulatif des Étapes Critiques

| Étape | Commande | Pourquoi c'est important |
|-------|----------|-------------------------|
| 1 | `git clone` | Récupère tout le code |
| 2 | Créer `.env` | Configuration de la DB et secrets |
| 3 | `npm install` | Installe les dépendances |
| 4 | `npm run build` | Compile l'admin panel |
| 5 | `npm run develop` | Crée le premier admin |
| 6 | Configurer permissions | Rend l'API publique accessible |
| 7 | `pm2 start` | Lance en production |

---

## 🔧 Troubleshooting

### Erreur : "Cannot connect to database"

```bash
# Vérifier PostgreSQL
sudo systemctl status postgresql

# Tester la connexion
PGPASSWORD='Password123!' psql -U strapi_admin -h 127.0.0.1 -d strapi_db

# Vérifier le .env
cat /root/blog_strapi/backend/.env
```

### Erreur : "Error: listen EADDRINUSE: address already in use"

Un autre processus utilise le port 1337 :

```bash
# Trouver le processus
sudo lsof -i :1337

# Tuer le processus
sudo kill -9 <PID>

# Ou tuer tous les processus Node
pkill -f node
```

### Content-Types ne s'affichent pas

```bash
# Vérifier qu'ils existent dans le code
ls -la /root/blog_strapi/backend/src/api

# Rebuild complet
cd /root/blog_strapi/backend
rm -rf .cache dist build node_modules
npm install
npm run build
```

### API retourne 403

```bash
# Reconnectez-vous à l'admin et reconfigurez les permissions
# OU utilisez le script SQL
cd /root/blog_strapi
PGPASSWORD='Password123!' psql -U strapi_admin -h 127.0.0.1 -d strapi_db -f fix-permissions.sql
```

---

## 📊 Commandes Utiles

```bash
# Voir les logs PM2
pm2 logs strapi

# Redémarrer Strapi
pm2 restart strapi

# Arrêter Strapi
pm2 stop strapi

# Voir le statut
pm2 status

# Supprimer de PM2
pm2 delete strapi

# Backup de la base de données
pg_dump -U strapi_admin -h 127.0.0.1 strapi_db > backup_$(date +%Y%m%d).sql
```

---

## 🔄 Mise à Jour depuis Git

```bash
# Arrêter Strapi
pm2 stop strapi

# Récupérer les nouveaux commits
cd /root/blog_strapi
git pull origin master

# Installer les nouvelles dépendances
cd backend
npm install

# Rebuild
npm run build

# Redémarrer
pm2 restart strapi

# Vérifier les logs
pm2 logs strapi --lines 50
```

---

## ✅ Checklist Finale

- [ ] PostgreSQL installé et base de données créée
- [ ] Projet cloné avec `git clone`
- [ ] Fichier `.env` créé avec tous les secrets
- [ ] `npm install` exécuté sans erreur
- [ ] `config/database.ts` vérifié
- [ ] `config/admin.ts` créé
- [ ] `npm run build` exécuté avec succès
- [ ] Premier admin créé en mode develop
- [ ] Content-Types visibles dans Content-Type Builder
- [ ] Permissions API configurées (find + findOne public)
- [ ] PM2 installé et Strapi démarré en production
- [ ] API testée avec curl (retourne des données ou tableau vide)

---

## 🚀 Résultat Final

Après cette procédure complète, vous aurez :

- ✅ Strapi fonctionnel en production
- ✅ Tous vos content-types (Article, Project, Category, Tag)
- ✅ Content-Type Builder qui fonctionne
- ✅ API publique accessible
- ✅ Admin panel accessible
- ✅ Démarrage automatique avec PM2
- ✅ Facilité de mise à jour via `git pull`

---

**Cette méthode a été testée et validée sur Ubuntu 24.04 LTS avec Strapi 5.24.1+**
