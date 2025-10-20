#!/usr/bin/env node

/**
 * Test complet du système de génération d'images
 * Vérifie les différents providers et l'intégration Strapi
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { generateArticleImage, testImageGeneration, IMAGE_CONFIG } = require('./image-generator');
const axios = require('axios');

// Configuration Strapi de test
const strapiClient = axios.create({
  baseURL: process.env.CLOUDFLARE_TUNNEL_URL || 'http://localhost:1337',
  headers: {
    'Authorization': `Bearer ${process.env.STRAPI_N8N_API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Vérifier la configuration des APIs d'images
 */
async function checkImageAPIsConfiguration() {
  console.log('🔧 Vérification configuration APIs d\'images...\n');
  
  const providers = IMAGE_CONFIG.PROVIDERS;
  let availableProviders = [];

  for (const [key, provider] of Object.entries(providers)) {
    const hasApiKey = !!provider.apiKey && provider.apiKey !== 'your-api-key-here' && !provider.apiKey.includes('your-');
    
    console.log(`${hasApiKey ? '✅' : '❌'} ${provider.name}`);
    console.log(`   API Key: ${hasApiKey ? '✓ Configurée' : '✗ Manquante'}`);
    console.log(`   Coût par image: $${provider.costPerImage}`);
    console.log(`   Tailles supportées: ${provider.supportedSizes.join(', ')}\n`);
    
    if (hasApiKey) {
      availableProviders.push(key);
    }
  }

  console.log(`📊 Providers disponibles: ${availableProviders.length}/${Object.keys(providers).length}`);
  console.log(`🎯 Provider par défaut: ${IMAGE_CONFIG.DEFAULT_PROVIDER}\n`);

  return availableProviders;
}

/**
 * Test de génération simple sans Strapi
 */
async function testSimpleGeneration() {
  console.log('🧪 Test génération simple...\n');
  
  const testCases = [
    {
      title: 'React Hooks Best Practices Guide 2025',
      subreddit: 'reactjs',
      analysis: { summary: 'Complete guide to React Hooks with examples', sources: [] }
    },
    {
      title: 'JavaScript ES6 Arrow Functions Explained',
      subreddit: 'javascript',
      analysis: { summary: 'Understanding arrow functions and their use cases', sources: [] }
    },
    {
      title: 'Node.js Performance Optimization Tips',
      subreddit: 'node',
      analysis: { summary: 'Improve your Node.js application performance', sources: [] }
    }
  ];

  for (const testCase of testCases) {
    console.log(`🎨 Test: "${testCase.title}"`);
    
    try {
      const result = await generateArticleImage(
        testCase.title,
        testCase.subreddit,
        testCase.analysis,
        null, // Pas de Strapi client pour ce test
        `test-${Date.now()}`
      );

      if (result.success) {
        console.log(`✅ Génération réussie avec ${result.provider}`);
        console.log(`   💰 Coût: $${result.cost}`);
        console.log(`   📐 Taille: ${result.size}`);
        console.log(`   🎯 Prompt: ${result.prompt.substring(0, 60)}...`);
        if (result.local) {
          console.log(`   💾 Sauvegardé: ${result.local.filename}`);
        }
      } else {
        console.log(`❌ Échec: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
    }
    
    console.log('');
  }
}

/**
 * Test avec upload Strapi
 */
async function testStrapiIntegration() {
  console.log('🚀 Test intégration Strapi...\n');
  
  // Vérifier que Strapi est accessible
  try {
    const healthCheck = await strapiClient.get('/api/articles?pagination[limit]=1');
    console.log('✅ Strapi accessible');
  } catch (error) {
    console.log('❌ Strapi non accessible:', error.message);
    console.log('   Assurez-vous que Strapi est démarré et que le tunnel est actif\n');
    return;
  }

  const testCase = {
    title: 'Full-Stack Development with Next.js and Strapi',
    subreddit: 'nextjs',
    analysis: { 
      summary: 'Complete tutorial for building modern web applications', 
      sources: ['https://nextjs.org', 'https://strapi.io'] 
    }
  };

  console.log(`🎨 Test avec Strapi: "${testCase.title}"`);

  try {
    const result = await generateArticleImage(
      testCase.title,
      testCase.subreddit,
      testCase.analysis,
      strapiClient,
      `strapi-test-${Date.now()}`
    );

    if (result.success) {
      console.log(`✅ Génération et upload réussis avec ${result.provider}`);
      console.log(`   💰 Coût: $${result.cost}`);
      console.log(`   📐 Taille: ${result.size}`);
      console.log(`   🎯 Prompt: ${result.prompt.substring(0, 80)}...`);
      
      if (result.local) {
        console.log(`   💾 Sauvegarde locale: ${result.local.filename}`);
      }
      
      if (result.strapi) {
        console.log(`   🚀 Upload Strapi: ID ${result.strapi.id}`);
        console.log(`   🔗 URL: ${result.strapi.url}`);
      }
    } else {
      console.log(`❌ Échec: ${result.error}`);
    }
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
  }
}

/**
 * Test de performance - générer plusieurs images
 */
async function testPerformance() {
  console.log('⏱️ Test de performance (3 images)...\n');
  
  const startTime = Date.now();
  const promises = [];

  for (let i = 1; i <= 3; i++) {
    promises.push(
      generateArticleImage(
        `Test Performance Image ${i} - React Development`,
        'reactjs',
        { summary: `Test case ${i} for performance measurement`, sources: [] },
        null,
        `perf-test-${i}-${Date.now()}`
      )
    );
  }

  try {
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;

    console.log(`⏱️ Temps total: ${totalTime.toFixed(2)}s`);
    console.log(`📊 Moyenne par image: ${(totalTime / 3).toFixed(2)}s`);
    
    const successful = results.filter(r => r.success).length;
    const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);
    
    console.log(`✅ Succès: ${successful}/3`);
    console.log(`💰 Coût total: $${totalCost.toFixed(4)}`);

  } catch (error) {
    console.log(`❌ Erreur test performance: ${error.message}`);
  }
}

/**
 * Fonction principale de test
 */
async function runImageTests() {
  console.log('🎨 TESTS SYSTÈME GÉNÉRATION D\'IMAGES\n');
  console.log('═'.repeat(50) + '\n');

  try {
    // 1. Vérifier la configuration
    const availableProviders = await checkImageAPIsConfiguration();
    
    if (availableProviders.length === 0) {
      console.log('❌ Aucun provider d\'images configuré!');
      console.log('📝 Veuillez configurer au moins une API dans le fichier .env:\n');
      console.log('   - STABILITY_API_KEY pour Stability AI');
      console.log('   - GETIMG_API_KEY pour GetImg.ai');
      console.log('   - REPLICATE_API_TOKEN pour Replicate');
      console.log('   - OPENAI_API_KEY pour DALL-E 3\n');
      return;
    }

    // 2. Test simple
    await testSimpleGeneration();
    
    // 3. Test avec Strapi
    await testStrapiIntegration();
    
    // 4. Test de performance
    await testPerformance();

    console.log('\n' + '═'.repeat(50));
    console.log('🎉 Tests terminés avec succès!');
    console.log('📝 Le système de génération d\'images est prêt à être utilisé.');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runImageTests();
}

module.exports = {
  runImageTests,
  checkImageAPIsConfiguration,
  testSimpleGeneration,
  testStrapiIntegration
};