# Configuration des Permissions Strapi

## Problème actuel
Les API retournent des erreurs 500 "Forbidden access" car les permissions publiques ne sont pas configurées.

```
ForbiddenError: Forbidden access
GET /api/articles?populate[author]=true... (500)
GET /api/projects?populate[author]=true... (500)
```

## Solution : Configurer les permissions publiques

### Étape 1 : Accéder à l'admin Strapi

Votre admin Strapi devrait être accessible à :
- **Via HTTPS** (recommandé) : https://blog.bh-systems.be/admin
- **Via IP directe** : http://173.212.208.181:1339/admin

> **Note** : Le port a changé de 1337 à 1339 dans vos logs Strapi

### Étape 2 : Se connecter ou créer le super admin

Si vous n'avez pas encore créé de compte admin, vous verrez un formulaire d'inscription.
Sinon, connectez-vous avec vos identifiants.

### Étape 3 : Configurer les permissions publiques

1. Dans le menu de gauche, allez à **Settings** (⚙️)
2. Cliquez sur **Users & Permissions Plugin** → **Roles**
3. Cliquez sur le rôle **Public**
4. Développez les sections suivantes et **cochez les permissions** :

#### Pour Article :
- ✅ `find` (Permet GET /api/articles)
- ✅ `findOne` (Permet GET /api/articles/:id)

#### Pour Project :
- ✅ `find` (Permet GET /api/projects)
- ✅ `findOne` (Permet GET /api/projects/:id)

#### Pour Category (si utilisé) :
- ✅ `find`
- ✅ `findOne`

#### Pour Tag (si utilisé) :
- ✅ `find`
- ✅ `findOne`

5. Cliquez sur **Save** en haut à droite

### Étape 4 : Tester

Rafraîchissez votre frontend : https://blog.bh-systems.be/

Les articles et projets devraient maintenant s'afficher correctement.

## Vérification manuelle

Vous pouvez tester les API directement :

```bash
# Test Article API
curl -I https://blog.bh-systems.be/api/articles

# Test Project API
curl -I https://blog.bh-systems.be/api/projects

# Devrait retourner HTTP/2 200 OK (au lieu de 500)
```

## Problèmes secondaires à corriger ensuite

### 1. Favicon manquant (non critique)
Le fichier `favicon.ico` existe dans le backend mais Docker ne le trouve pas.

**Solution** : Vérifier le Dockerfile backend

### 2. Warning docker-compose version
Supprimer la ligne `version: '3.8'` de `docker-compose.yml`

### 3. Warning nginx http2
Modifier nginx.conf ligne 36 :
```nginx
# Avant
listen 443 ssl http2;

# Après
listen 443 ssl;
http2 on;
```

## Si les permissions ne fonctionnent toujours pas

Vérifiez que le super admin est bien créé :
```bash
# Sur le VPS
docker exec blog-strapi cat /opt/app/data/data.db
```

Si la base SQLite est vide ou problématique, vous devrez peut-être la recréer.

## Ports actuels (d'après les logs)

- Strapi interne : **1339** (au lieu de 1337)
- Frontend interne : **3000**
- Nginx public : **443** (HTTPS) et **80** (redirect)

> ⚠️ **Attention** : Les logs montrent que Strapi écoute sur le port 1339, vérifiez votre configuration.
