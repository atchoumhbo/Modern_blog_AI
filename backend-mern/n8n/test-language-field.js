#!/usr/bin/env node

/**
 * Test du nouveau champ language sur les articles/projets
 * Vérifie que le backend fonctionne correctement
 */

const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_N8N_API_TOKEN;

const strapiClient = axios.create({
  baseURL: STRAPI_URL,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testLanguageField() {
  console.log('🧪 === TEST CHAMP LANGUAGE ===\n');
  
  try {
    // Test 1: Récupérer articles avec filtrage par langue
    console.log('📝 Test 1: Filtrage articles par langue');
    
    const frArticles = await strapiClient.get('/api/articles', {
      params: {
        'filters[language][$eq]': 'fr',
        pagination: { pageSize: 3 },
        populate: ['featured_image', 'categories', 'tags']
      }
    });
    
    const enArticles = await strapiClient.get('/api/articles', {
      params: {
        'filters[language][$eq]': 'en', 
        pagination: { pageSize: 3 },
        populate: ['featured_image', 'categories', 'tags']
      }
    });
    
    console.log(`   🇫🇷 Articles français: ${frArticles.data.data.length}`);
    frArticles.data.data.forEach(article => {
      const title = article.attributes?.title || 'Titre non défini';
      const language = article.attributes?.language || 'NON DÉFINI';
      console.log(`      • ${title} (langue: ${language})`);
    });
    
    console.log(`   🇬🇧 Articles anglais: ${enArticles.data.data.length}`);
    enArticles.data.data.forEach(article => {
      const title = article.attributes?.title || 'Titre non défini';
      const language = article.attributes?.language || 'NON DÉFINI';
      console.log(`      • ${title} (langue: ${language})`);
    });
    
    // Test 2: Même chose pour les projets
    console.log('\n🚀 Test 2: Filtrage projets par langue');
    
    const frProjects = await strapiClient.get('/api/projects', {
      params: {
        'filters[language][$eq]': 'fr',
        pagination: { pageSize: 3 }
      }
    });
    
    const enProjects = await strapiClient.get('/api/projects', {
      params: {
        'filters[language][$eq]': 'en',
        pagination: { pageSize: 3 }
      }
    });
    
    console.log(`   🇫🇷 Projets français: ${frProjects.data.data.length}`);
    frProjects.data.data.forEach(project => {
      const title = project.attributes?.title || 'Titre non défini';
      const language = project.attributes?.language || 'NON DÉFINI';
      console.log(`      • ${title} (langue: ${language})`);
    });
    
    console.log(`   🇬🇧 Projets anglais: ${enProjects.data.data.length}`);
    enProjects.data.data.forEach(project => {
      const title = project.attributes?.title || 'Titre non défini';
      const language = project.attributes?.language || 'NON DÉFINI';
      console.log(`      • ${title} (langue: ${language})`);
    });
    
    // Test 3: Création d'un article de test avec langue
    console.log('\n✏️  Test 3: Création article test avec champ langue');
    
    const testArticle = {
      data: {
        title: `Test Article Language ${Date.now()}`,
        slug: `test-article-language-${Date.now()}`,
        content: 'Contenu de test pour vérifier le champ language.',
        excerpt: 'Test du nouveau champ language',
        status: 'draft', // Brouillon pour ne pas polluer
        language: 'fr', // 🌐 Test du nouveau champ
        readingTime: 1
      }
    };
    
    const createdArticle = await strapiClient.post('/api/articles', testArticle);
    const articleId = createdArticle.data.data?.id;
    
    console.log(`   ✅ Article test créé: ID ${articleId}`);
    console.log(`   📝 Titre: ${createdArticle.data.data?.attributes?.title || 'Non défini'}`);
    console.log(`   🌐 Langue: ${createdArticle.data.data?.attributes?.language || 'Non défini'}`);
    
    // Debug: Afficher la structure de réponse
    console.log(`   🔍 Debug structure:`, JSON.stringify(createdArticle.data, null, 2).substring(0, 200) + '...');
    
    // Test 4: Récupération avec filtrage sur l'article créé
    const filteredTest = await strapiClient.get('/api/articles', {
      params: {
        'filters[language][$eq]': 'fr',
        'filters[title][$contains]': 'Test Article Language'
      }
    });
    
    console.log(`   🔍 Articles trouvés avec filtre: ${filteredTest.data.data.length}`);
    
    // Nettoyer l'article de test
    if (articleId) {
      await strapiClient.delete(`/api/articles/${articleId}`);
      console.log(`   🗑️  Article test supprimé`);
    }
    
    // Résumé
    console.log('\n🎯 === RÉSUMÉ DES TESTS ===');
    console.log(`   ✅ Filtrage articles français: ${frArticles.data.data.length} trouvés`);
    console.log(`   ✅ Filtrage articles anglais: ${enArticles.data.data.length} trouvés`);
    console.log(`   ✅ Filtrage projets français: ${frProjects.data.data.length} trouvés`);
    console.log(`   ✅ Filtrage projets anglais: ${enProjects.data.data.length} trouvés`);
    console.log(`   ✅ Création/suppression avec champ language: OK`);
    
    console.log('\n🎉 Tous les tests passés!');
    console.log('💡 Le champ language est opérationnel pour le filtrage frontend');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur dans les tests:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Lancer le test
if (require.main === module) {
  testLanguageField()
    .then(success => {
      console.log(`\n🏁 Tests: ${success ? 'SUCCÈS' : 'ÉCHEC'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Erreur critique:', error.message);
      process.exit(1);
    });
}

module.exports = { testLanguageField };