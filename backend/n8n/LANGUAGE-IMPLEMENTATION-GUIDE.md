# 🌐 Guide Implémentation Champ Language

## 📋 Résumé des modifications

### ✅ Backend (Terminé)
1. **Schémas mis à jour** :
   - `Article` : Ajout champ `language` (enum: fr/en, défaut: fr)
   - `Project` : Ajout champ `language` (enum: fr/en, défaut: fr)
   - Champ `required: false` temporairement pour éviter de casser l'existant

2. **Workflow N8N mis à jour** :
   - Articles FR auront `language: 'fr'`
   - Articles EN auront `language: 'en'`
   - Synchronisé avec le champ `locale` i18n

3. **Scripts de migration créés** :
   - `migrate-language-field.js` : Migre les articles/projets existants
   - `test-language-field.js` : Teste le filtrage par langue

## 🚀 Plan d'exécution

### Étape 1: Tester le backend
```bash
# Démarrer Strapi
cd backend
npm run dev

# (Dans un autre terminal)
cd backend/n8n

# Tester les nouveaux champs
node test-language-field.js

# Migrer les données existantes
node migrate-language-field.js
```

### Étape 2: Vérifier le workflow N8N
```bash
# Créer un nouvel article avec le workflow
node n8n-workflow-reproduction.js

# Vérifier que les articles ont le bon champ language
node test-language-field.js
```

### Étape 3: Commit & Push
```bash
git add .
git commit -m "✨ Ajout champ language pour filtrage articles/projets par langue

🔧 Modifications backend:
- Schémas Article/Project: nouveau champ language (fr/en)
- Workflow N8N: génération automatique du champ language
- Scripts migration: mise à jour données existantes
- Tests: validation filtrage par langue

🎯 Objectif: Filtrage frontend par langue (prochaine étape)"

git push
```

### Étape 4: Frontend (À implémenter)
```javascript
// Dans le frontend, utiliser le filtrage:

// Articles français uniquement
const frenchArticles = await fetch('/api/articles?filters[language][$eq]=fr');

// Articles anglais uniquement  
const englishArticles = await fetch('/api/articles?filters[language][$eq]=en');

// Même chose pour les projets
const frenchProjects = await fetch('/api/projects?filters[language][$eq]=fr');
const englishProjects = await fetch('/api/projects?filters[language][$eq]=en');
```

## 🔧 Détails techniques

### Structure du champ
```json
{
  "language": {
    "type": "enumeration",
    "enum": ["fr", "en"],
    "default": "fr",
    "required": false,
    "description": "Langue de l'article/projet (fr/en)"
  }
}
```

### API de filtrage
```javascript
// Tous les articles français
GET /api/articles?filters[language][$eq]=fr

// Tous les projets anglais
GET /api/projects?filters[language][$eq]=en

// Combiné avec d'autres filtres
GET /api/articles?filters[language][$eq]=fr&filters[status][$eq]=published
```

### Migration automatique
Le script `migrate-language-field.js` :
1. Récupère tous les articles/projets existants
2. Détermine la langue basée sur le `locale` i18n
3. Met à jour le champ `language` automatiquement
4. Gère les cas où le locale n'est pas défini

## ⚠️ Points d'attention

### 1. Champ optionnel temporairement
- Le champ est `required: false` pour ne pas casser l'existant
- Après migration réussie, peut être rendu obligatoire

### 2. Double système locale/language
- `locale` : Système i18n de Strapi (technique)
- `language` : Champ métier pour filtrage frontend (business)
- Les deux sont synchronisés mais servent des objectifs différents

### 3. Données existantes
- Script de migration détecte automatiquement la langue
- Basé sur le `locale` i18n existant
- Fallback intelligent par analyse du titre

## 🎯 Bénéfices

### Pour le développement
- Filtrage simple et direct par langue
- Pas de dépendance aux complexités i18n
- API claire et prévisible

### Pour l'utilisateur
- Interface vraiment bilingue
- Pas de mélange de langues
- Performance optimisée (moins de données)

### Pour la maintenance
- Logique métier claire
- Indépendant du système i18n technique
- Facilement extensible (ajout autres langues)

## 🔄 Après implémentation frontend

### Rendre le champ obligatoire
1. Vérifier que tous les articles/projets ont le champ rempli
2. Modifier les schémas: `"required": true`
3. Redémarrer Strapi
4. Tester la création de nouveaux contenus

### Extensions possibles
- Ajout d'autres langues (es, de, it...)
- Filtrage par multiple langues
- Interface d'admin pour changer la langue
- Synchronisation automatique i18n ↔ language