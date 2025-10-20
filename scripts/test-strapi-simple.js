#!/usr/bin/env node

/**
 * Script de test simple pour N8N → Strapi
 */

const axios = require('axios');

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_N8N_API_TOKEN || 'a4239ed0a52427929d703538e1c298a37b088db1a2f859c17015d5eb150a64b1b5195d8287184867af8ecb923f3bcfec83cd238f18b9b3f4349fbd885edb243a7349adbe7b2c00f14aa453e12a4e003c8286f1393cb60eebb67635845390575185092c7cb277b17a565c3099c9477487d2f615323dd40226c18471f46d8176af';

async function testStrapiAPI() {
  console.log('🚀 Test de l\'API Strapi pour N8N');
  console.log('=====================================');
  
  const client = axios.create({
    baseURL: STRAPI_URL,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    timeout: 10000
  });

  try {
    // Test 1: Connectivité
    console.log('🔍 Test de connectivité...');
    const healthCheck = await client.get('/api/articles?pagination[limit]=1');
    console.log('✅ Strapi accessible - Status:', healthCheck.status);

    // Test 2: Création d'un article
    console.log('📝 Test création d\'article...');
    const articleData = {
      data: {
        title: `Test Article N8N ${Date.now()}`,
        slug: `test-article-n8n-${Date.now()}`,
        excerpt: 'Article de test créé via API pour N8N',
        body: `# Article de Test N8N

Ce contenu a été créé automatiquement pour tester l'intégration N8N.

## Fonctionnalités testées

- Création via API
- Token d'authentification  
- Format des données

Date de création: ${new Date().toISOString()}`,
        date: new Date().toISOString(),
        publishedAt: new Date().toISOString()
      }
    };

    const articleResponse = await client.post('/api/articles', articleData);
    console.log('✅ Article créé avec succès!');
    console.log('   ID:', articleResponse.data.data.id);
    console.log('   Titre:', articleResponse.data.data.attributes.title);
    console.log('   Slug:', articleResponse.data.data.attributes.slug);

    // Test 3: Récupération de l'article
    console.log('📖 Test récupération d\'article...');
    const articleId = articleResponse.data.data.id;
    const getArticle = await client.get(`/api/articles/${articleId}`);
    console.log('✅ Article récupéré:', getArticle.data.data.attributes.title);

    // Test 4: Liste des articles
    console.log('📋 Test liste des articles...');
    const articlesList = await client.get('/api/articles?pagination[limit]=5');
    console.log('✅ Articles listés:', articlesList.data.data.length, 'articles trouvés');

    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS!');
    console.log('=====================================');
    console.log('Votre Strapi est prêt pour N8N! 🚀');
    console.log('\nProchaines étapes:');
    console.log('1. Exposer Strapi avec: cloudflared tunnel --url http://localhost:1337');
    console.log('2. Configurer N8N avec l\'URL publique');
    console.log('3. Utiliser ce token API:', API_TOKEN.substring(0, 20) + '...');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    console.log('\n🔧 Vérifications:');
    console.log('- Strapi est-il démarré? (npm run develop dans backend/)');
    console.log('- Le token API est-il correct?');
    console.log('- Les content types Article existent-ils?');
    process.exit(1);
  }
}

// Exécution
testStrapiAPI();