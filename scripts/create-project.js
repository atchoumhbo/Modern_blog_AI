const fs = require('fs');
const path = require('path');

// Configuration
const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = 'YOUR_API_TOKEN_HERE'; // À générer dans Strapi

// Fonction pour créer un projet via l'API Strapi
async function createProject() {
  try {
    // Lire le contenu Markdown
    const markdownPath = path.join(__dirname, '..', 'content-templates', 'projet-vscode-extension.md');
    const content = fs.readFileSync(markdownPath, 'utf8');
    
    // Données du projet
    const projectData = {
      data: {
        title: 'Extension VS Code : React Router v7 DevTools',
        slug: 'vscode-extension-react-router-v7-devtools',
        description: 'Extension VS Code qui améliore l\'expérience de développement avec React Router v7 en fournissant des outils de navigation, génération de code et debugging.',
        short_description: 'Extension VS Code pour améliorer le développement React Router v7',
        content: content,
        technologies: ['VS Code API', 'TypeScript', 'React', 'Node.js', 'AST Parsing'],
        status_at: 'completed',
        start_date: '2025-09-01T00:00:00.000Z',
        end_date: '2025-11-30T00:00:00.000Z',
        github_url: 'https://github.com/username/react-router-v7-devtools',
        demo_url: 'https://marketplace.visualstudio.com/items?itemName=publisher.react-router-v7-devtools',
        meta_title: 'Extension VS Code : React Router v7 DevTools - Projet',
        meta_description: 'Extension VS Code qui révolutionne le développement avec React Router v7. Outils de debugging, génération de code et navigation avancée.',
        meta_keywords: 'VS Code, React Router, extension, TypeScript, developer tools',
        publishedAt: new Date().toISOString()
      }
    };

    // Appel API pour créer le projet
    const response = await fetch(`${STRAPI_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify(projectData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Projet créé avec succès !');
      console.log(`📝 ID: ${result.data.id}`);
      console.log(`🔗 Slug: ${result.data.attributes.slug}`);
      console.log(`🌍 URL: http://localhost:5190/projects/${result.data.attributes.slug}`);
    } else {
      const error = await response.json();
      console.error('❌ Erreur lors de la création:', error);
    }

  } catch (error) {
    console.error('💥 Erreur:', error.message);
  }
}

// Exécuter le script
createProject();