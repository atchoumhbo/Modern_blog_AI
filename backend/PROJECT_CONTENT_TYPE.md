# 🎯 Structure Project - Content Type Optimisé

## 📋 Vue d'ensemble

Le content type **Project** a été créé pour gérer un portfolio professionnel avec des fonctionnalités avancées de SEO et d'analytics.

## 🏗️ Architecture du Content Type Project

### 🚀 Champs Principaux
```json
{
  "title": "Titre du projet (requis, 5-255 chars)",
  "slug": "URL-friendly automatique",
  "description": "Description riche du projet (requis)",
  "excerpt": "Résumé automatique (200 chars max)",
  "featured_image": "Image principale (1200x630px recommandé)",
  "gallery": "Galerie d'images multiples",
  
  // Statut et Type
  "status": "draft|in-progress|completed|archived",
  "project_type": "web-app|mobile-app|api|library|tool|website|other",
  "featured": "Projet mis en avant (boolean)",
  "priority": "Priorité d'affichage (1-10)",
  
  // Informations Techniques
  "technologies": "Liste JSON des technos ['React', 'Node.js']",
  "github_url": "URL GitHub (validation regex)",
  "live_url": "URL de démonstration",
  "demo_url": "URL de demo alternative",
  
  // Informations Projet
  "start_date": "Date de début",
  "end_date": "Date de fin",
  "client": "Nom du client/organisation",
  "team_size": "Taille équipe (défaut: 1)",
  "role": "Votre rôle dans le projet",
  
  // Sections Détaillées
  "challenges": "Défis techniques rencontrés",
  "achievements": "Réalisations et résultats",
  "lessons_learned": "Leçons apprises",
  
  // Analytics
  "viewCount": "Compteur de vues",
  
  // Relations
  "category": "Relation -> Category",
  "tags": "Relations multiples -> Tags",
  "author": "Relation -> User",
  
  // SEO et Données Structurées
  "seo": "Composant SEO complet",
  "schema": "Données structurées JSON-LD"
}
```

## ⚡ Fonctionnalités Automatisées

### 🤖 Lifecycles (Hooks automatiques)
1. **Avant création projet**:
   - Génération automatique excerpt depuis description
   - Initialisation données structurées
   - Initialisation compteur vues
   - Validation cohérence dates (début < fin)

2. **Avant modification projet**:
   - Mise à jour date de modification
   - Validation dates si modifiées
   - Mise à jour headline dans schema

### 🔄 Services Personnalisés
- **Génération excerpts automatique** depuis description
- **Validation dates cohérentes** (début antérieur à fin)
- **Initialisation données structurées** avec métadonnées appropriées

## 🌐 API REST Étendue

### Endpoints Standard
```bash
GET    /api/projects          # Liste complète avec relations
GET    /api/projects/:id      # Projet spécifique complet
POST   /api/projects          # Créer projet avec automatisations
PUT    /api/projects/:id      # Modifier avec validations
DELETE /api/projects/:id      # Supprimer projet
```

### Endpoints Personnalisés
```bash
PUT /api/projects/:id/view              # Incrémenter compteur vues
GET /api/projects/featured              # Projets en vedette (featured=true, status=completed)
GET /api/projects/technology/:tech      # Projets par technologie
```

### Population Automatique
Toutes les requêtes incluent automatiquement :
- **Catégorie** avec SEO
- **Tags** complets  
- **Auteur** (username, email)
- **Image principale** optimisée
- **Galerie** complète
- **Données SEO** complètes
- **Schema structuré** JSON-LD

## 🎨 Types de Projets Supportés

### 📱 Types Disponibles
- **web-app** : Applications web
- **mobile-app** : Applications mobiles
- **api** : APIs et services web
- **library** : Bibliothèques et packages
- **tool** : Outils et utilitaires
- **website** : Sites web statiques
- **other** : Autres types de projets

### 📊 Status Workflow
- **draft** : Brouillon en cours de rédaction
- **in-progress** : Projet en cours de développement
- **completed** : Projet terminé (seuls ces projets apparaissent dans featured)
- **archived** : Projet archivé

## 🔗 Relations avec Autres Content Types

### 📂 Categories
Les projets peuvent être organisés par catégories :
```json
// Une catégorie peut avoir plusieurs projets
"projects": {
  "relation": "oneToMany",
  "target": "api::project.project"
}
```

### 🏷️ Tags
Les projets peuvent avoir plusieurs tags :
```json
// Tags multiples pour classification fine
"projects": {
  "relation": "manyToMany", 
  "target": "api::project.project"
}
```

## 🎯 Exemples d'Utilisation

### Création Projet via API
```javascript
POST /api/projects
{
  "data": {
    "title": "Blog React Moderne",
    "description": "<p>Application de blog construite avec React, Next.js et Strapi</p>",
    "project_type": "web-app",
    "status": "completed",
    "featured": true,
    "priority": 8,
    "technologies": ["React", "Next.js", "Strapi", "TailwindCSS"],
    "github_url": "https://github.com/user/blog-react",
    "live_url": "https://blog.example.com",
    "start_date": "2025-01-01",
    "end_date": "2025-03-01",
    "team_size": 1,
    "role": "Full Stack Developer",
    "challenges": "Optimisation SEO et performances",
    "achievements": "Score Lighthouse 95+",
    "seo": {
      "metaTitle": "Blog React Moderne - Portfolio",
      "metaDescription": "Découvrez mon projet de blog moderne construit avec React et Next.js"
    }
  }
}
```

### Récupération Projets Featured
```javascript
GET /api/projects/featured
// Retourne projets avec featured=true et status=completed
// Triés par priority DESC
```

### Recherche par Technologie
```javascript
GET /api/projects/technology/React
// Retourne tous les projets utilisant React
```

### Incrémenter Vues
```javascript
PUT /api/projects/123/view
// Incrémente automatiquement le viewCount
```

## 🔧 Configuration Frontend

### Intégration React/Next.js
```javascript
// Récupération projets pour portfolio
const featuredProjects = await fetch('/api/projects/featured');

// Affichage projet avec compteur de vues
const handleViewProject = (projectId) => {
  fetch(`/api/projects/${projectId}/view`, { method: 'PUT' });
};

// Filtrage par technologie
const reactProjects = await fetch('/api/projects/technology/React');
```

### Affichage Responsive
```jsx
const ProjectCard = ({ project }) => (
  <div className="project-card">
    <img src={project.featured_image?.url} alt={project.title} />
    <h3>{project.title}</h3>
    <p>{project.excerpt}</p>
    
    <div className="tech-stack">
      {project.technologies?.map(tech => (
        <span key={tech} className="tech-badge">{tech}</span>
      ))}
    </div>
    
    <div className="project-links">
      {project.github_url && <a href={project.github_url}>Code</a>}
      {project.live_url && <a href={project.live_url}>Demo</a>}
    </div>
    
    <div className="project-meta">
      <span>{project.viewCount} vues</span>
      <span>{project.category?.name}</span>
    </div>
  </div>
);
```

## 🚀 Migration depuis l'Ancien Système

Si vous aviez des projets dans `backend_broken`, voici comment migrer :

### Mapping des Champs
```javascript
// Ancien -> Nouveau
{
  "name" -> "title",
  "description" -> "description", 
  "image" -> "featured_image",
  "tech_stack" -> "technologies", // Convertir en array JSON
  "github" -> "github_url",
  "live" -> "live_url",
  "category" -> "category", // Relation conservée
  "tags" -> "tags" // Relation conservée
}
```

### Script de Migration Exemple
```javascript
// Migration basique depuis ancien format
const migrateProject = (oldProject) => ({
  title: oldProject.name,
  description: oldProject.description,
  project_type: 'web-app', // À adapter
  status: 'completed', // Par défaut
  technologies: oldProject.tech_stack ? oldProject.tech_stack.split(',') : [],
  github_url: oldProject.github,
  live_url: oldProject.live,
  featured_image: oldProject.image,
  category: oldProject.category,
  tags: oldProject.tags
});
```

---

**🔥 Le content type Project offre maintenant une gestion complète de portfolio avec SEO optimisé et analytics avancés !**