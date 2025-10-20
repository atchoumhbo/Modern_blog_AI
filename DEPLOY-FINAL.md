# 🚀 Guide de Déploiement Final - VPS Production

## ✅ État Actuel

**Containers** : Tous démarrés et healthy ✅
- ✅ blog-nginx (HTTPS actif)
- ✅ blog-strapi (SQLite)
- ✅ blog-frontend (React Router)
- ✅ blog-redis (Cache)

**URLs Accessibles** :
- 🌍 Site public : https://blog.bh-systems.be/
- 🔧 Admin Strapi (temp) : http://173.212.208.181:1337/admin

**Corrections Appliquées** :
- ✅ Warning docker-compose `version` supprimé
- ✅ Warning nginx `http2` corrigé
- ✅ Favicon manquant ajouté (favicon.ico)

---

## ❌ Problème Principal à Résoudre

### Erreur 500 "Forbidden access" sur toutes les API

**Symptôme** :
```
blog-strapi | ForbiddenError: Forbidden access
blog-strapi | GET /api/articles?populate[...]... (500)
blog-strapi | GET /api/projects?populate[...]... (500)
```

**Frontend affiche** : Erreur 500 Internal Server Error

**Cause** : Les permissions publiques Strapi ne sont pas configurées.

---

## 🔧 Solution : Configuration Permissions Strapi

### Étape 1 : Déployer les corrections sur le VPS

Sur votre machine locale (PowerShell) :

\`\`\`powershell
# Exécuter le script de déploiement rapide
.\quick-deploy-vps.ps1
\`\`\`

Ou manuellement sur le VPS :

\`\`\`bash
cd /root/blog_strapi
git pull origin master
docker compose down
docker compose up -d
docker compose logs -f
\`\`\`

### Étape 2 : Accéder à l'Admin Strapi

**Option 1** (via HTTPS - Recommandé) :
```
https://blog.bh-systems.be/admin
```

**Option 2** (via IP directe - Temporaire) :
```
http://173.212.208.181:1337/admin
```

### Étape 3 : Créer/Se connecter au Super Admin

- Si premier démarrage : **Remplir le formulaire de création admin**
  - Firstname : Votre prénom
  - Lastname : Votre nom
  - Email : Votre email
  - Password : Mot de passe sécurisé (8+ caractères)
  
- Si admin existe : **Se connecter** avec vos identifiants

### Étape 4 : Configurer les Permissions Publiques ⚠️ **CRITIQUE**

1. Dans le menu gauche → **Settings** ⚙️

2. Cliquez sur **Users & Permissions Plugin** → **Roles**

3. Cliquez sur le rôle **Public** (icône 🌍)

4. **Cochez les permissions suivantes** :

   #### Pour `Article` :
   - ✅ **find** → Permet `GET /api/articles`
   - ✅ **findOne** → Permet `GET /api/articles/:id`

   #### Pour `Project` :
   - ✅ **find** → Permet `GET /api/projects`
   - ✅ **findOne** → Permet `GET /api/projects/:id`

   #### Pour `Category` (si disponible) :
   - ✅ **find**
   - ✅ **findOne**

   #### Pour `Tag` (si disponible) :
   - ✅ **find**
   - ✅ **findOne**

   #### Pour `Upload` (pour les images) :
   - ✅ **find**
   - ✅ **findOne**

5. **Cliquez sur "Save"** en haut à droite ✅

### Étape 5 : Tester le Frontend

Rafraîchissez votre navigateur sur :
```
https://blog.bh-systems.be/
```

**Résultat attendu** :
- ✅ Pas d'erreur 500
- ✅ Les articles/projets s'affichent (s'ils existent)
- ✅ Le frontend charge correctement

---

## 🧪 Tests de Validation

### Test 1 : API Articles (via terminal VPS)

\`\`\`bash
curl -I https://blog.bh-systems.be/api/articles

# Résultat attendu :
# HTTP/2 200 OK (au lieu de 500)
\`\`\`

### Test 2 : API Projects

\`\`\`bash
curl -I https://blog.bh-systems.be/api/projects

# Résultat attendu :
# HTTP/2 200 OK
\`\`\`

### Test 3 : Frontend complet

\`\`\`bash
curl -I https://blog.bh-systems.be/

# Résultat attendu :
# HTTP/2 200 OK
# Pas d'erreur JavaScript dans les logs nginx
\`\`\`

### Test 4 : Vérifier les logs Strapi

\`\`\`bash
docker compose logs -f blog-strapi

# Plus d'erreurs "ForbiddenError: Forbidden access" ✅
# Logs normaux : GET /api/articles (200) ✅
\`\`\`

---

## 📝 Après Configuration des Permissions

### Créer du contenu de test

1. Dans Strapi Admin → **Content Manager**

2. Créer une **Category** :
   - Name : "Tech"
   - Slug : "tech"
   - Description : "Technology articles"

3. Créer un **Article** :
   - Title : "Mon premier article"
   - Slug : "mon-premier-article"
   - Content : "Contenu de test..."
   - Category : Sélectionner "Tech"
   - Featured Image : Upload une image
   - **Publish** ✅

4. Retourner sur le frontend :
   ```
   https://blog.bh-systems.be/blog
   ```
   
   → L'article devrait s'afficher ! 🎉

---

## 🔒 Sécurité Post-Configuration

### Désactiver le port 1337 (après avoir configuré les permissions)

Une fois que tout fonctionne, **sécuriser l'accès admin** :

1. Éditer `docker-compose.yml` (local) :

\`\`\`yaml
# Commenter les lignes 75-76
strapi:
  # ports:  # DÉSACTIVÉ - Admin accessible uniquement via nginx
  #   - "1337:1337"
\`\`\`

2. Commit et déployer :

\`\`\`powershell
git add docker-compose.yml
git commit -m "security: Désactiver port 1337 après configuration admin"
git push origin master
.\quick-deploy-vps.ps1
\`\`\`

3. **Accès admin uniquement via HTTPS** :
   ```
   https://blog.bh-systems.be/admin
   ```

---

## 📊 Monitoring

### Vérifier la santé des containers

\`\`\`bash
# Sur le VPS
docker compose ps

# Tous doivent être "healthy"
# blog-nginx       Healthy
# blog-strapi      Healthy
# blog-frontend    Up
# blog-redis       Healthy
\`\`\`

### Voir les logs en temps réel

\`\`\`bash
# Tous les containers
docker compose logs -f

# Strapi uniquement
docker compose logs -f blog-strapi

# Nginx uniquement
docker compose logs -f blog-nginx
\`\`\`

### Vérifier l'utilisation disque (SQLite)

\`\`\`bash
# Sur le VPS
docker exec blog-strapi ls -lh /opt/app/data/data.db

# Taille de la base SQLite
\`\`\`

---

## 🆘 Dépannage

### Problème : Toujours des erreurs 500 après configuration permissions

**Solution** : Vider le cache Redis

\`\`\`bash
docker exec blog-redis redis-cli FLUSHALL
docker compose restart blog-strapi blog-frontend
\`\`\`

### Problème : "Cannot find module" dans les logs

**Solution** : Rebuild les containers

\`\`\`bash
cd /root/blog_strapi
docker compose down
docker compose up -d --build
\`\`\`

### Problème : Base SQLite corrompue

**Solution** : Recréer la base (⚠️ PERD LES DONNÉES)

\`\`\`bash
docker compose down
docker volume rm blog_strapi_strapi_data
docker compose up -d
# Puis reconfigurer les permissions + recréer le super admin
\`\`\`

### Problème : Nginx ne démarre pas

**Solution** : Vérifier la configuration

\`\`\`bash
docker exec blog-nginx nginx -t
# Devrait afficher : "syntax is ok" et "test is successful"
\`\`\`

---

## ✅ Checklist Finale

- [ ] Déployer les corrections (quick-deploy-vps.ps1)
- [ ] Accéder à l'admin Strapi
- [ ] Créer/Se connecter au super admin
- [ ] Configurer permissions publiques (Article, Project, Category, Tag, Upload)
- [ ] Sauvegarder les permissions (bouton "Save")
- [ ] Tester API : `curl https://blog.bh-systems.be/api/articles`
- [ ] Tester frontend : https://blog.bh-systems.be/
- [ ] Créer du contenu de test
- [ ] Vérifier affichage sur le frontend
- [ ] Désactiver port 1337 (sécurité)
- [ ] Tester accès admin via HTTPS uniquement

---

## 📚 Documentation Complémentaire

- **Permissions Strapi** : `configure-strapi-permissions.md`
- **Déploiement rapide** : `quick-deploy-vps.ps1`
- **Configuration Strapi** : `STRAPI_CONFIG.md`
- **Architecture réseau** : `DEPLOYMENT.md`

---

## 🎯 Prochaines Étapes (Optionnel)

1. **Configurer auto-renewal SSL** (certbot cron)
2. **Optimiser cache nginx** (static assets)
3. **Configurer backups automatiques** (SQLite database)
4. **Ajouter monitoring** (uptime, logs)
5. **Configurer CI/CD** (GitHub Actions)

---

**Bon déploiement ! 🚀**

Si le problème persiste après avoir configuré les permissions, vérifiez les logs détaillés :
\`\`\`bash
docker compose logs blog-strapi | grep -A 5 "Forbidden access"
\`\`\`
