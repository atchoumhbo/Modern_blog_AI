/**
 * Exemple d'utilisation dans un workflow N8N
 * À intégrer dans un node "Function" ou "Code"
 */

// ═══════════════════════════════════════════════════════════════════════════
// EXEMPLE 1: Utilisation Simple dans N8N
// ═══════════════════════════════════════════════════════════════════════════

// Dans un node "Function" N8N:
const { imageGenerator } = require('./backend/n8n/v2');

// Récupérer les données de l'article depuis l'input N8N
const articleTitle = $input.item.json.title;
const subreddit = $input.item.json.subreddit || 'programming';

// Générer l'image
const result = await imageGenerator.generateArticleImage(articleTitle, subreddit);

// Retourner le résultat pour l'utiliser dans les prochains nodes
return {
  json: {
    imageUrl: result.url,
    imagePath: result.path,
    imageFilename: result.filename,
    provider: result.provider,
    cost: result.cost,
    generationTime: result.generationTime,
    category: result.metadata.category
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// EXEMPLE 2: Avec Options Personnalisées
// ═══════════════════════════════════════════════════════════════════════════

const { imageGenerator } = require('./backend/n8n/v2');

const articleData = $input.item.json;

const result = await imageGenerator.generateArticleImage(
  articleData.title,
  articleData.subreddit || 'programming',
  {
    provider: 'stability-ai',
    aspectRatio: '16:9',
    outputFormat: 'webp',
    quality: 90,
    enableCache: true,
    enableOptimization: true
  }
);

return {
  json: {
    ...articleData,  // Conserver les données originales
    featured_image_url: result.url,
    featured_image_path: result.path,
    image_metadata: result.metadata
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// EXEMPLE 3: Workflow Complet Reddit → Strapi
// ═══════════════════════════════════════════════════════════════════════════

const { imageGenerator } = require('./backend/n8n/v2');
const axios = require('axios');

// Récupérer les données du post Reddit
const redditPost = $input.item.json;

// 1. Générer l'image
const imageResult = await imageGenerator.generateArticleImage(
  redditPost.title,
  redditPost.subreddit,
  {
    provider: 'stability-ai',
    aspectRatio: '16:9',
    outputFormat: 'png',
    quality: 85
  }
);

// 2. Upload de l'image vers Strapi
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_N8N_API_TOKEN;

// Lire le fichier image
const fs = require('fs');
const FormData = require('form-data');
const imageBuffer = fs.readFileSync(imageResult.path);

// Préparer le FormData pour Strapi
const formData = new FormData();
formData.append('files', imageBuffer, {
  filename: imageResult.filename,
  contentType: 'image/png'
});

// Upload vers Strapi
const uploadResponse = await axios.post(
  `${STRAPI_URL}/api/upload`,
  formData,
  {
    headers: {
      'Authorization': `Bearer ${STRAPI_TOKEN}`,
      ...formData.getHeaders()
    }
  }
);

const uploadedImage = uploadResponse.data[0];

// 3. Créer l'article dans Strapi
const articleData = {
  data: {
    title: redditPost.title,
    slug: redditPost.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
    content: redditPost.selftext || redditPost.url,
    excerpt: generateExcerpt(redditPost.selftext, 200),
    featured_image: uploadedImage.id,
    status: 'draft',
    category: detectCategory(imageResult.metadata.category),
    tags: extractTags(redditPost.title),
    readingTime: estimateReadingTime(redditPost.selftext)
  }
};

const articleResponse = await axios.post(
  `${STRAPI_URL}/api/articles`,
  articleData,
  {
    headers: {
      'Authorization': `Bearer ${STRAPI_TOKEN}`,
      'Content-Type': 'application/json'
    }
  }
);

// Retourner le résultat
return {
  json: {
    success: true,
    article: articleResponse.data,
    image: {
      filename: imageResult.filename,
      url: imageResult.url,
      cost: imageResult.cost,
      category: imageResult.metadata.category
    },
    reddit: {
      title: redditPost.title,
      subreddit: redditPost.subreddit,
      url: redditPost.url
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// FONCTIONS HELPER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Générer un excerpt à partir du contenu
 */
function generateExcerpt(content, maxLength = 200) {
  if (!content) return '';
  
  const cleanContent = content
    .replace(/#{1,6}\s/g, '')  // Enlever les headers Markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Enlever les liens Markdown
    .replace(/[*_~`]/g, '')  // Enlever le formatage Markdown
    .trim();

  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }

  return cleanContent.substring(0, maxLength).trim() + '...';
}

/**
 * Détecter la catégorie depuis le contexte d'image
 */
function detectCategory(imageCategory) {
  const categoryMap = {
    'Microsoft 365': 'microsoft',
    'Microsoft Teams': 'microsoft',
    'SharePoint': 'microsoft',
    'Azure': 'cloud',
    'Security': 'security',
    'Vulnerability': 'security',
    'Malware': 'security',
    'Web Development': 'development',
    'JavaScript': 'development',
    'React.js': 'development',
    'Docker': 'devops',
    'Kubernetes': 'devops'
  };

  return categoryMap[imageCategory] || 'technology';
}

/**
 * Extraire les tags depuis le titre
 */
function extractTags(title) {
  const techTags = {
    'react': 'React',
    'javascript': 'JavaScript',
    'node': 'Node.js',
    'docker': 'Docker',
    'kubernetes': 'Kubernetes',
    'azure': 'Azure',
    'teams': 'Microsoft Teams',
    'security': 'Security',
    'cve': 'Security',
    'malware': 'Cybersecurity'
  };

  const titleLower = title.toLowerCase();
  const foundTags = [];

  for (const [keyword, tag] of Object.entries(techTags)) {
    if (titleLower.includes(keyword)) {
      foundTags.push(tag);
    }
  }

  return foundTags.slice(0, 5); // Max 5 tags
}

/**
 * Estimer le temps de lecture
 */
function estimateReadingTime(content) {
  if (!content) return 1;
  
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  
  return Math.max(1, minutes);
}

// ═══════════════════════════════════════════════════════════════════════════
// EXEMPLE 4: Gestion des Erreurs
// ═══════════════════════════════════════════════════════════════════════════

const { imageGenerator } = require('./backend/n8n/v2');

try {
  const result = await imageGenerator.generateArticleImage(
    $input.item.json.title,
    $input.item.json.subreddit
  );

  return {
    json: {
      success: true,
      image: result
    }
  };

} catch (error) {
  console.error('❌ Erreur génération image:', error.message);

  // Retourner une erreur structurée pour N8N
  return {
    json: {
      success: false,
      error: {
        message: error.message,
        type: error.name,
        article: $input.item.json.title
      },
      // Utiliser une image par défaut
      fallback_image: '/uploads/default-article-image.png'
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXEMPLE 5: Statistiques et Monitoring
// ═══════════════════════════════════════════════════════════════════════════

const { imageGenerator, logger } = require('./backend/n8n/v2');

// Générer l'image
const result = await imageGenerator.generateArticleImage(
  $input.item.json.title,
  $input.item.json.subreddit
);

// Obtenir les stats
const stats = imageGenerator.getStats();

// Logger dans N8N
console.log('📊 Stats génération:');
console.log(`   Total générations: ${stats.logger.totalGenerations}`);
console.log(`   Taux succès: ${stats.logger.successRate}%`);
console.log(`   Coût total: $${stats.logger.totalCost.toFixed(4)}`);

// Retourner avec stats
return {
  json: {
    image: result,
    stats: {
      totalCost: stats.logger.totalCost,
      averageTime: stats.logger.averageTime,
      successRate: stats.logger.successRate
    }
  }
};
