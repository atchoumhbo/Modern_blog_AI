#!/usr/bin/env node

/**
 * Script de test N8N pour Strapi - Version adaptée
 */

const axios = require('axios');

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_N8N_API_TOKEN || 'a4239ed0a52427929d703538e1c298a37b088db1a2f859c17015d5eb150a64b1b5195d8287184867af8ecb923f3bcfec83cd238f18b9b3f4349fbd885edb243a7349adbe7b2c00f14aa453e12a4e003c8286f1393cb60eebb67635845390575185092c7cb277b17a565c3099c9477487d2f615323dd40226c18471f46d8176af';

async function testStrapiForN8N() {
  console.log('🚀 Test Strapi pour N8N Integration');
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
    // Test 1: Vérifier la structure du Content Type Article
    console.log('🔍 Analyse du Content Type Article...');
    const articlesList = await client.get('/api/articles?pagination[limit]=1');
    console.log('✅ Content Type Article accessible');

    // Test 2: Création d'article avec champs de base seulement
    console.log('📝 Test création article (champs de base)...');
    
    const timestamp = Date.now();
    const basicArticle = {
      data: {
        title: `Test Article N8N ${timestamp}`,
        slug: `test-article-n8n-${timestamp}`,
        // Testons avec les champs minimaux d'abord
      }
    };

    try {
      const basicResponse = await client.post('/api/articles', basicArticle);
      console.log('✅ Article de base créé avec succès!');
      console.log('   ID:', basicResponse.data.data.id);
      console.log('   Titre:', basicResponse.data.data.attributes.title);
      
      // Récupérer l'article pour voir sa structure
      const createdArticle = await client.get(`/api/articles/${basicResponse.data.data.id}`);
      console.log('📋 Structure de l\'article créé:');
      console.log('   Attributs disponibles:', Object.keys(createdArticle.data.data.attributes));
      
    } catch (createError) {
      console.log('❌ Échec création article de base');
      console.log('Erreur:', createError.response?.data || createError.message);
      
      // Testons avec encore moins de champs
      console.log('🔄 Test avec titre uniquement...');
      const minimalArticle = {
        data: {
          title: `Minimal Test ${timestamp}`
        }
      };
      
      try {
        const minimalResponse = await client.post('/api/articles', minimalArticle);
        console.log('✅ Article minimal créé!');
        console.log('   Structure:', Object.keys(minimalResponse.data.data.attributes));
      } catch (minimalError) {
        console.log('❌ Échec même avec titre uniquement');
        console.log('Détails erreur:', minimalError.response?.data);
        
        // Affichons les informations de debugging
        console.log('\n🔧 Information de debugging:');
        console.log('URL utilisée:', `${STRAPI_URL}/api/articles`);
        console.log('Token (20 premiers chars):', API_TOKEN.substring(0, 20) + '...');
        console.log('Headers utilisés:', {
          'Authorization': `Bearer ${API_TOKEN.substring(0, 20)}...`,
          'Content-Type': 'application/json'
        });
      }
    }

    // Test 3: Vérifier les Content Types disponibles (si possible)
    console.log('\n📊 Test des endpoints disponibles...');
    try {
      // Test d'autres endpoints possibles
      const endpoints = ['/api/posts', '/api/articles', '/api/projects'];
      
      for (const endpoint of endpoints) {
        try {
          const testResponse = await client.get(`${endpoint}?pagination[limit]=1`);
          console.log(`✅ ${endpoint} - Disponible (${testResponse.data.data.length} éléments)`);
        } catch (endpointError) {
          console.log(`❌ ${endpoint} - Non disponible`);
        }
      }
    } catch (error) {
      console.log('Erreur test endpoints:', error.message);
    }

    console.log('\n🎯 RÉSULTATS:');
    console.log('=====================================');
    console.log('✅ Strapi accessible');
    console.log('✅ Token API valide');
    console.log('✅ Content Type Article existe');
    console.log('\n💡 Prochaines étapes pour N8N:');
    console.log('1. Exposer avec: cloudflared tunnel --url http://localhost:1337');
    console.log('2. URL API pour N8N: [URL-TUNNEL]/api/articles');
    console.log('3. Token à utiliser:', API_TOKEN.substring(0, 30) + '...');

  } catch (error) {
    console.error('❌ Erreur générale:', error.response?.data || error.message);
    
    console.log('\n🔧 Vérifications à faire:');
    console.log('1. Strapi est-il démarré? (npm run develop)');
    console.log('2. Content Type Article configuré?');
    console.log('3. Permissions API Token configurées?');
    console.log('4. URL correcte:', STRAPI_URL);
  }
}

// Exécution
testStrapiForN8N();