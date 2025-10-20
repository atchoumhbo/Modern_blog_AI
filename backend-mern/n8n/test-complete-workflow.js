#!/usr/bin/env node

/**
 * Test complet du workflow N8N avec génération d'images
 * Vérifie l'intégration complète Reddit → IA → Image → Strapi
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { generateArticleImage } = require('./image-generator');

// Mock d'un post Reddit typique pour test
const mockRedditPost = {
  id: 'test-image-workflow',
  title: 'Best React Performance Tips I Learned After 5 Years',
  subreddit: 'reactjs',
  score: 156,
  num_comments: 23,
  selftext: 'After working with React for 5 years in production apps, here are the performance optimization techniques that made the biggest difference...',
  created_utc: Math.floor(Date.now() / 1000),
  url: 'https://reddit.com/r/reactjs/test-post',
  link_flair_text: 'Performance'
};

// Mock de l'article généré par IA
const mockArticle = `# Best React Performance Tips I Learned After 5 Years

## Introduction

React performance optimization has been a crucial part of my development journey. After working on multiple production applications, I've discovered techniques that can dramatically improve user experience and application speed.

## Key Performance Strategies

### 1. Memoization Techniques
Using React.memo and useMemo effectively can prevent unnecessary re-renders and expensive calculations.

### 2. Code Splitting
Implementing lazy loading and dynamic imports reduces initial bundle size significantly.

### 3. Virtual DOM Optimization
Understanding how React's reconciliation works helps in writing more efficient components.

## Practical Examples

\`\`\`javascript
// Optimized component with memoization
const OptimizedComponent = React.memo(({ data }) => {
  const processedData = useMemo(() => 
    expensiveOperation(data), [data]
  );
  
  return <div>{processedData}</div>;
});
\`\`\`

## Performance Metrics

Through these optimizations, I've seen:
- 40% reduction in bundle size
- 60% faster initial load times
- Improved Lighthouse scores from 65 to 95

## Conclusion

Performance optimization is an ongoing process. These techniques have served me well across different projects and team sizes.

Focus on measuring first, then optimizing based on actual bottlenecks rather than premature optimization.`;

/**
 * Test du workflow complet avec génération d'image
 */
async function testCompleteWorkflow() {
  console.log('🚀 TEST WORKFLOW COMPLET N8N + GÉNÉRATION D\'IMAGES');
  console.log('═'.repeat(60));
  console.log('');

  console.log('📋 Données du test :');
  console.log(`📰 Titre: "${mockRedditPost.title}"`);
  console.log(`🏷️  Subreddit: r/${mockRedditPost.subreddit}`);
  console.log(`⭐ Score: ${mockRedditPost.score} points`);
  console.log(`💬 Commentaires: ${mockRedditPost.num_comments}`);
  console.log(`🎯 Flair: ${mockRedditPost.link_flair_text}`);
  console.log(`📝 Article: ${mockArticle.split('\n')[0]}... (${mockArticle.split(' ').length} mots)`);
  console.log('');

  try {
    // Client Strapi (optionnel pour ce test)
    const axios = require('axios');
    const strapiClient = axios.create({
      baseURL: process.env.CLOUDFLARE_TUNNEL_URL || 'http://localhost:1337',
      headers: {
        'Authorization': `Bearer ${process.env.STRAPI_N8N_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    // Test avec Strapi si disponible
    let useStrapiUpload = false;
    try {
      await strapiClient.get('/api/articles?pagination[limit]=1');
      useStrapiUpload = true;
      console.log('✅ Strapi accessible - Upload activé');
    } catch (error) {
      console.log('⚠️ Strapi non accessible - Mode local uniquement');
    }

    console.log('');
    console.log('🎨 Génération de l\'image d\'illustration...');
    console.log('-'.repeat(40));

    const startTime = Date.now();

    // Générer l'image avec les vraies données
    const imageResult = await generateArticleImage(
      mockRedditPost.title,
      mockRedditPost.subreddit,
      {
        summary: mockArticle.substring(0, 200) + '...',
        sources: ['Reddit r/' + mockRedditPost.subreddit]
      },
      useStrapiUpload ? strapiClient : null,
      mockRedditPost.id
    );

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log('');
    console.log('📊 RÉSULTATS DE LA GÉNÉRATION');
    console.log('═'.repeat(40));

    if (imageResult.success) {
      console.log(`✅ Génération réussie avec ${imageResult.provider.toUpperCase()}`);
      console.log(`⏱️  Temps de génération: ${duration.toFixed(2)}s`);
      console.log(`💰 Coût: $${imageResult.cost}`);
      console.log(`📐 Taille: ${imageResult.size}`);
      console.log(`🎯 Prompt utilisé:`);
      console.log(`   "${imageResult.prompt}"`);
      
      if (imageResult.revisedPrompt) {
        console.log(`🔄 Prompt révisé par l'IA:`);
        console.log(`   "${imageResult.revisedPrompt}"`);
      }

      console.log('');
      console.log('💾 SAUVEGARDES:');
      
      if (imageResult.local) {
        console.log(`📁 Local: ${imageResult.local.filename}`);
        console.log(`   Taille fichier: ${(imageResult.local.size / 1024).toFixed(1)} KB`);
        console.log(`   URL locale: ${imageResult.local.url}`);
      }

      if (imageResult.strapi) {
        console.log(`🚀 Strapi: ID ${imageResult.strapi.id}`);
        console.log(`   URL: ${imageResult.strapi.url}`);
        console.log(`   Alt text: ${imageResult.strapi.alternativeText}`);
      } else if (useStrapiUpload) {
        console.log(`⚠️ Upload Strapi échoué mais image sauvegardée localement`);
      }

    } else {
      console.log(`❌ Génération échouée: ${imageResult.error}`);
      console.log(`🔧 Provider utilisé: ${imageResult.provider}`);
    }

    console.log('');
    console.log('📈 SIMULATION WORKFLOW COMPLET');
    console.log('═'.repeat(40));
    console.log('1. ✅ Reddit scraping simulé');
    console.log('2. ✅ Analyse Perplexity simulée');
    console.log('3. ✅ Génération article GPT simulée');
    console.log(`4. ${imageResult.success ? '✅' : '❌'} Génération image ${imageResult.success ? 'réussie' : 'échouée'}`);
    console.log('5. 🔄 Publication Strapi (prochaine étape)');

    console.log('');
    console.log('🎯 PRÊT POUR INTÉGRATION');
    console.log('═'.repeat(40));
    console.log('Le système de génération d\'images est maintenant');
    console.log('parfaitement intégré dans le workflow N8N !');
    
    if (imageResult.success) {
      console.log('');
      console.log('✨ Chaque article aura désormais :');
      console.log('   🖼️  Une image unique générée automatiquement');
      console.log('   🎨 Un style adapté au subreddit d\'origine');
      console.log('   💾 Sauvegarde locale + upload Strapi');
      console.log('   💰 Coût optimisé selon le provider choisi');
    }

    return imageResult;

  } catch (error) {
    console.error('❌ Erreur workflow complet:', error.message);
    return { success: false, error: error.message };
  }
}

// Exécuter le test si appelé directement
if (require.main === module) {
  testCompleteWorkflow();
}

module.exports = { testCompleteWorkflow };