# Guide : Générer un token API Strapi

## 1. Créer un token API dans Strapi

### Via l'interface admin :
1. Va sur http://localhost:1337/admin
2. Menu **Settings** → **API Tokens**
3. Clic sur **Create new API Token**
4. Remplis :
   - **Name** : `Content Creator Script`
   - **Description** : `Token pour créer du contenu via scripts`
   - **Token duration** : `Unlimited`
   - **Token type** : `Full access`
5. **Save** et copie le token généré

### Via le terminal :
```bash
# Depuis le dossier backend
npm run strapi generate api-token
```

## 2. Utiliser le token

### Option A : Variable d'environnement
```bash
# Ajouter au fichier .env
API_TOKEN=your_generated_token_here

# Utiliser dans le script
const API_TOKEN = process.env.API_TOKEN;
```

### Option B : Remplacer directement dans le script
```javascript
const API_TOKEN = 'ton_token_ici';
```

## 3. Exécuter les scripts

### Script Node.js :
```bash
cd scripts
node create-project.js
```

### Script Python :
```bash
cd scripts
python create-project.py
```

## 4. Autres endpoints utiles

### Créer un post :
```javascript
fetch('http://localhost:1337/api/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_TOKEN}`
  },
  body: JSON.stringify({
    data: {
      title: 'Mon article',
      content: 'Contenu...',
      publishedAt: new Date().toISOString()
    }
  })
})
```

### Lister les projets :
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:1337/api/projects
```

### Uploader une image :
```javascript
const formData = new FormData();
formData.append('files', imageFile);

fetch('http://localhost:1337/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`
  },
  body: formData
})
```