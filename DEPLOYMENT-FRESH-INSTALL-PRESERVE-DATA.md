# Deployment Guide – Fresh Strapi Install While Preserving Content Types

## 🎯 OBJECTIF
Installer un nouveau Strapi avec `npx create-strapi-app@latest` tout en récupérant vos content-types et configurations du projet Git existant.

---

## ⚠️ PROBLÈME RÉSOLU
Cette méthode résout l'erreur **"Cannot read properties of undefined (reading 'filter')"** en créant une base de données propre avec les bonnes permissions.

---

## Prerequisites
- Ubuntu 22.04/24.04 Server (VPS)
- Root or sudo privileges
- Accès au repository Git : `https://github.com/boujrafh/blog_strapi.git`

---

## PHASE 1 : Préparation et Installation de Base

### 1. Update the System
```bash
sudo apt update -y && sudo apt upgrade -y
```

### 2. Install Node.js & npm
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version      # Expected: v18.x.x
npm --version
```

### 3. Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 4. Install Git
```bash
sudo apt install -y git
```

---

## PHASE 2 : Créer une Base de Données PROPRE

### 1. Supprimer l'ancienne base (si elle existe)
```bash
sudo -u postgres psql
```

```sql
-- Supprimer l'ancienne base et l'utilisateur
DROP DATABASE IF EXISTS strapi_db;
DROP USER IF EXISTS strapi_admin;

-- Créer un nouvel utilisateur et une nouvelle base
CREATE USER strapi_admin WITH PASSWORD 'Password123!';
ALTER USER strapi_admin WITH SUPERUSER;
CREATE DATABASE strapi_db OWNER strapi_admin;
GRANT ALL PRIVILEGES ON DATABASE strapi_db TO strapi_admin;
\q
```

### 2. Tester la connexion
```bash
PGPASSWORD='Password123!' psql -U strapi_admin -h 127.0.0.1 -d strapi_db -c "\l"
```

---

## PHASE 3 : Installer un NOUVEAU Strapi

### 1. Créer un nouveau projet Strapi
```bash
cd /root
mkdir strapi_fresh
cd strapi_fresh
npx create-strapi-app@latest backend --quickstart
```

> **Pendant l'installation, choisir :**
> - Database type: `postgres`
> - Host: `127.0.0.1`
> - Port: `5432`
> - Username: `strapi_admin`
> - Password: `Password123!`
> - Database name: `strapi_db`
> - Use SSL: `No`

### 2. Attendre la fin de l'installation
Le navigateur va s'ouvrir automatiquement (ou aller sur `http://YOUR_IP:1337/admin`)

### 3. Créer le premier utilisateur admin
Créez votre compte admin via l'interface web, puis **arrêter Strapi** (Ctrl+C dans le terminal)

---

## PHASE 4 : Cloner votre Projet Git et Récupérer les Content-Types

### 1. Cloner votre projet dans un dossier séparé
```bash
cd /root
git clone https://github.com/boujrafh/blog_strapi.git blog_strapi_old
```

### 2. Sauvegarder les dossiers importants de votre ancien projet
```bash
# Créer un dossier de backup
mkdir -p /root/backup_content_types

# Copier les content-types
cp -r /root/blog_strapi_old/backend/src/api /root/backup_content_types/
cp -r /root/blog_strapi_old/backend/src/components /root/backup_content_types/

# Copier les configurations si elles existent
cp -r /root/blog_strapi_old/backend/config /root/backup_content_types/
```

---

## PHASE 5 : Copier les Content-Types dans le Nouveau Strapi

### 1. Arrêter le nouveau Strapi (si encore en cours)
```bash
pkill -f "strapi"
```

### 2. Copier vos content-types dans le nouveau projet
```bash
cd /root/strapi_fresh/backend

# Copier les APIs (content-types)
cp -r /root/backup_content_types/api/. src/api/

# Copier les components (si vous en avez)
if [ -d "/root/backup_content_types/components" ]; then
  cp -r /root/backup_content_types/components/. src/components/
fi
```

### 3. Copier les configurations importantes (optionnel)
```bash
# Server config (si vous avez des customisations)
cp /root/backup_content_types/config/server.ts config/server.ts

# Database config (si différent)
# cp /root/backup_content_types/config/database.ts config/database.ts

# Admin config (pour résoudre le problème des cookies)
if [ -f "/root/backup_content_types/config/admin.ts" ]; then
  cp /root/backup_content_types/config/admin.ts config/admin.ts
fi
```

---

## PHASE 6 : Vérifier et Adapter les Fichiers

### 1. Vérifier le fichier .env
```bash
cat /root/strapi_fresh/backend/.env
```

Il devrait contenir :
```env
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=strapi_db
DATABASE_USERNAME=strapi_admin
DATABASE_PASSWORD=Password123!
DATABASE_SSL=false
```

### 2. Créer le fichier config/admin.ts (pour éviter les erreurs de cookies)
```bash
cat > /root/strapi_fresh/backend/config/admin.ts << 'EOF'
export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
    sessions: {
      cookie: {
        secure: false, // Disable secure cookies to work behind nginx proxy
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
EOF
```

---

## PHASE 7 : Reconstruire et Démarrer

### 1. Nettoyer et rebuild
```bash
cd /root/strapi_fresh/backend
rm -rf .cache dist build
npm install
npm run build
```

### 2. Démarrer en mode développement pour vérifier
```bash
NODE_ENV=development npm run develop
```

### 3. Vérifier dans le navigateur
- Ouvrir `http://YOUR_IP:1337/admin`
- Se connecter avec votre compte admin
- Aller dans **Content-Type Builder**
- Vérifier que vos content-types (Article, Project, etc.) sont présents
- ✅ **Si tout fonctionne**, arrêter (Ctrl+C) et passer en production

---

## PHASE 8 : Configurer les Permissions API

### 1. Appliquer les permissions via SQL
```bash
# Si vous avez le fichier fix-permissions.sql
cd /root/blog_strapi_old
PGPASSWORD='Password123!' psql -U strapi_admin -h 127.0.0.1 -d strapi_db -f fix-permissions.sql
```

OU créer les permissions manuellement via l'interface admin :
- Settings → Users & Permissions Plugin → Roles → Public
- Cocher les permissions pour `find` et `findOne` sur Article, Project, Category, Tag, Author

---

## PHASE 9 : Démarrer en Production avec PM2

### 1. Installer PM2
```bash
sudo npm install -g pm2
```

### 2. Démarrer Strapi en production
```bash
cd /root/strapi_fresh/backend
pm2 start npm --name "strapi" -- run start
pm2 save
pm2 startup
```

### 3. Vérifier que tout fonctionne
```bash
# Vérifier le statut
pm2 status

# Vérifier les logs
pm2 logs strapi

# Tester l'API
curl http://localhost:1337/api/articles
```

---

## PHASE 10 : Migrer vers le Bon Emplacement (Optionnel)

### Si vous voulez que le projet soit dans `/root/blog_strapi` :

```bash
# Arrêter Strapi
pm2 stop strapi
pm2 delete strapi

# Renommer les dossiers
mv /root/blog_strapi /root/blog_strapi_vraiment_old
mv /root/strapi_fresh /root/blog_strapi

# Redémarrer
cd /root/blog_strapi/backend
pm2 start npm --name "strapi" -- run start
pm2 save
```

---

## 🎯 Avantages de cette Méthode

✅ **Base de données propre** - Pas de permissions corrompues  
✅ **Installation Strapi fraîche** - Pas de conflits de versions  
✅ **Content-types préservés** - Vous ne perdez pas votre travail  
✅ **Erreur "filter" résolue** - Les permissions sont correctement créées  
✅ **Content-Type Builder fonctionne** - Vous pouvez modifier vos types  

---

## 🔧 Troubleshooting

### Si les content-types ne s'affichent pas
```bash
# Vérifier qu'ils ont été copiés
ls -la /root/strapi_fresh/backend/src/api

# Rebuild
cd /root/strapi_fresh/backend
rm -rf .cache dist build
npm run build
```

### Si erreur de permissions après copie
```bash
# Donner les bonnes permissions aux fichiers
cd /root/strapi_fresh/backend
chown -R root:root src/
chmod -R 755 src/
```

### Si l'API retourne toujours 403
```bash
# Réappliquer les permissions SQL
cd /root/blog_strapi_old
PGPASSWORD='Password123!' psql -U strapi_admin -h 127.0.0.1 -d strapi_db -f fix-permissions.sql
```

---

## 📋 Checklist Complète

- [ ] PostgreSQL installé
- [ ] Ancienne base supprimée
- [ ] Nouvelle base créée avec SUPERUSER
- [ ] Nouveau Strapi créé avec `npx create-strapi-app@latest`
- [ ] Premier admin créé
- [ ] Projet Git cloné dans un dossier séparé
- [ ] Content-types copiés dans le nouveau projet
- [ ] config/admin.ts créé (fix cookies)
- [ ] npm install et npm run build exécutés
- [ ] Content-Type Builder vérifié et fonctionnel
- [ ] Permissions API appliquées
- [ ] PM2 configuré et démarré
- [ ] API testée et fonctionnelle

---

## 🚀 Résultat Attendu

Après cette procédure, vous devriez avoir :
- ✅ Un Strapi fonctionnel sans erreur "filter"
- ✅ Content-Type Builder qui fonctionne
- ✅ Tous vos content-types (Article, Project, etc.)
- ✅ Base de données propre avec bonnes permissions
- ✅ API publique accessible

---

**Cette méthode combine le meilleur des deux approches :**
1. Installation propre avec `npx create-strapi-app@latest`
2. Récupération de vos content-types depuis Git

*Testé avec succès sur Ubuntu 24.04 LTS + Strapi 5.24.1*
