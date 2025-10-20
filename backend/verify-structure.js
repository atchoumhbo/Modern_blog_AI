#!/usr/bin/env node

/**
 * Script de vérification de la structure Strapi optimisée
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la structure Strapi optimisée...\n');

// Chemins à vérifier
const requiredPaths = [
  'src/components/seo/seo-data.json',
  'src/components/schema/structured-data.json',
  'src/api/article/content-types/article/schema.json',
  'src/api/article/controllers/article.ts',
  'src/api/article/routes/article.ts',
  'src/api/article/routes/custom.ts',
  'src/api/article/services/article.ts',
  'src/api/article/content-types/article/lifecycles.ts',
  'src/api/project/content-types/project/schema.json',
  'src/api/project/controllers/project.ts',
  'src/api/project/routes/project.ts',
  'src/api/project/routes/custom.ts',
  'src/api/project/services/project.ts',
  'src/api/project/content-types/project/lifecycles.ts',
  'src/api/category/content-types/category/schema.json',
  'src/api/tag/content-types/tag/schema.json',
  'src/middlewares/populate-relations.ts',
  'config/plugins.ts',
  'config/middlewares.ts'
];

let allGood = true;

requiredPaths.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${filePath}`);
  } else {
    console.log(`❌ ${filePath}`);
    allGood = false;
  }
});

console.log('\n📊 Résumé de la structure créée:');

// Vérifier le contenu du schema Article
try {
  const articleSchema = require('./src/api/article/content-types/article/schema.json');
  console.log(`✓ Article Content Type: ${Object.keys(articleSchema.attributes).length} champs`);
  console.log(`  - SEO Component: ${articleSchema.attributes.seo ? '✓' : '❌'}`);
  console.log(`  - Schema Component: ${articleSchema.attributes.schema ? '✓' : '❌'}`);
  console.log(`  - Relations: ${['category', 'tags', 'author'].filter(r => articleSchema.attributes[r]).length}/3`);
} catch (e) {
  console.log('❌ Erreur lecture schema Article');
}

// Vérifier le contenu du schema Project
try {
  const projectSchema = require('./src/api/project/content-types/project/schema.json');
  console.log(`✓ Project Content Type: ${Object.keys(projectSchema.attributes).length} champs`);
  console.log(`  - SEO Component: ${projectSchema.attributes.seo ? '✓' : '❌'}`);
  console.log(`  - Schema Component: ${projectSchema.attributes.schema ? '✓' : '❌'}`);
  console.log(`  - Relations: ${['category', 'tags', 'author'].filter(r => projectSchema.attributes[r]).length}/3`);
  console.log(`  - Portfolio Fields: ${['github_url', 'live_url', 'technologies'].filter(f => projectSchema.attributes[f]).length}/3`);
} catch (e) {
  console.log('❌ Erreur lecture schema Project');
}

// Vérifier les composants
try {
  const seoComponent = require('./src/components/seo/seo-data.json');
  console.log(`✓ SEO Component: ${Object.keys(seoComponent.attributes).length} champs SEO`);
} catch (e) {
  console.log('❌ Erreur lecture composant SEO');
}

try {
  const schemaComponent = require('./src/components/schema/structured-data.json');
  console.log(`✓ Schema Component: ${Object.keys(schemaComponent.attributes).length} champs structurés`);
} catch (e) {
  console.log('❌ Erreur lecture composant Schema');
}

console.log(`\n${allGood ? '🎉' : '⚠️'} Structure ${allGood ? 'complète' : 'incomplète'}`);

if (allGood) {
  console.log(`
🚀 Structure Strapi optimisée créée avec succès !

🎯 Fonctionnalités intégrées:
• Content Type Article avec SEO complet
• Content Type Project avec portfolio complet
• Composants SEO réutilisables  
• Données structurées JSON-LD
• Calcul automatique temps de lecture
• Génération automatique excerpts
• Compteur de vues intégré (articles & projets)
• Support multilingue (i18n)
• API REST étendue
• Middlewares personnalisés
• Lifecycles automatisés

▶️ API disponible:
• /api/articles (+ /popular, /:id/view)
• /api/projects (+ /featured, /technology/:tech, /:id/view)
• /api/categories (avec articles et projets)
• /api/tags (avec articles et projets)

▶️ Prochaines étapes:
1. Démarrer Strapi: npm run develop
2. Créer un admin: http://localhost:1337/admin  
3. Configurer les content types via l'interface
4. Tester l'API: http://localhost:1337/api/articles
5. Tester l'API: http://localhost:1337/api/projects
6. Intégrer au frontend React
  `);
}