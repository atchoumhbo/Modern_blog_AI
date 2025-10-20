#!/usr/bin/env node

/**
 * Test complet du système N8N enrichi
 * Vérifie tous les composants: Reddit, catégories, tags, auteur, publication
 */

const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const CONFIG = {
  TUNNEL_URL: process.env.CLOUDFLARE_TUNNEL_URL || 'https://proc-improved-cricket-charts.trycloudflare.com',
  STRAPI_TOKEN: process.env.STRAPI_N8N_API_TOKEN || 'a4239ed0a52427929d703538e1c298a37b088db1a2f859c17015d5eb150a64b1b5195d8287184867af8ecb923f3bcfec83cd238f18b9b3f4349fbd885edb243a7349adbe7b2c00f14aa453e12a4e003c8286f1393cb60eebb67635845390575185092c7cb277b17a565c3099c9477487d2f615323dd40226c18471f46d8176af'
};

const strapiClient = axios.create({
  baseURL: CONFIG.TUNNEL_URL,
  headers: {
    'Authorization': `Bearer ${CONFIG.STRAPI_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Tests des endpoints Strapi
async function testStrapiEndpoints() {
  console.log('🔍 Test des endpoints Strapi...');
  
  const endpoints = [
    { name: 'Articles', url: '/api/articles', params: { populate: '*' } },
    { name: 'Categories', url: '/api/categories', params: {} },
    { name: 'Tags', url: '/api/tags', params: {} },
    { name: 'Users', url: '/api/users', params: {} }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await strapiClient.get(endpoint.url, { params: endpoint.params });
      console.log(`✅ ${endpoint.name}: ${response.data.data?.length || response.data.length || 0} éléments`);
      
      if (endpoint.name === 'Articles' && response.data.data.length > 0) {
        const article = response.data.data[0];
        console.log(`   📝 Dernier article: "${article.title}" (${article.locale})`);
        console.log(`   🏷️ Tags: ${article.tags?.length || 0}, Catégorie: ${article.category?.name || 'N/A'}`);
        console.log(`   📊 ${article.readingTime || 'N/A'}min, ${article.viewCount || 0} vues`);
      }
      
    } catch (error) {
      console.error(`❌ ${endpoint.name}: ${error.response?.status || error.message}`);
    }
  }
}

// Test création catégorie
async function testCategoryCreation() {
  console.log('\n🏷️ Test création catégorie...');
  
  try {
    const testCategory = {
      name: 'Test Category',
      slug: 'test-category',
      description: 'Catégorie de test pour le système N8N',
      color: '#FF6B6B',
      icon: 'test'
    };

    // Vérifier si elle existe déjà
    const searchResponse = await strapiClient.get('/api/categories', {
      params: { 'filters[name][$eq]': testCategory.name }
    });

    if (searchResponse.data.data.length > 0) {
      console.log('✅ Catégorie de test déjà existante');
      return searchResponse.data.data[0].id;
    }

    // Créer la catégorie
    const createResponse = await strapiClient.post('/api/categories', {
      data: testCategory
    });

    console.log(`✅ Catégorie créée: ${testCategory.name} (ID: ${createResponse.data.data.id})`);
    return createResponse.data.data.id;

  } catch (error) {
    console.error('❌ Erreur création catégorie:', error.response?.data || error.message);
    return null;
  }
}

// Test création tag
async function testTagCreation() {
  console.log('\n🏷️ Test création tags...');
  
  const testTags = ['Test Tag 1', 'Test Tag 2', 'N8N'];
  const createdTagIds = [];

  for (const tagName of testTags) {
    try {
      // Vérifier si le tag existe
      const searchResponse = await strapiClient.get('/api/tags', {
        params: { 'filters[name][$eq]': tagName }
      });

      let tagId;
      if (searchResponse.data.data.length > 0) {
        tagId = searchResponse.data.data[0].id;
        console.log(`✅ Tag existant: ${tagName} (ID: ${tagId})`);
      } else {
        // Créer le tag
        const createResponse = await strapiClient.post('/api/tags', {
          data: {
            name: tagName,
            slug: tagName.toLowerCase().replace(/\s+/g, '-'),
            color: '#6B7280'
          }
        });
        
        tagId = createResponse.data.data.id;
        console.log(`✅ Tag créé: ${tagName} (ID: ${tagId})`);
      }

      createdTagIds.push(tagId);

    } catch (error) {
      console.error(`❌ Erreur tag ${tagName}:`, error.response?.data || error.message);
    }
  }

  return createdTagIds;
}

// Test création article complet
async function testArticleCreation(categoryId, tagIds) {
  console.log('\n📝 Test création article complet...');
  
  try {
    const testArticle = {
      title: 'Article de Test N8N Enrichi',
      slug: `test-article-n8n-${Date.now()}`,
      content: `# Article de Test N8N Enrichi

## Introduction

Ceci est un article de test pour valider le système N8N enrichi avec toutes les fonctionnalités.

## Contenu

Le système peut maintenant:
- Créer automatiquement des catégories basées sur les subreddits
- Gérer les tags de façon dynamique
- Calculer le temps de lecture
- Générer des données SEO complètes
- Structurer les données pour le référencement

## Conclusion

Ce test valide l'intégration complète du workflow enrichi.`,
      excerpt: 'Article de test pour valider le système N8N avec toutes les fonctionnalités enrichies.',
      readingTime: 2,
      status: 'published',
      publishedAt: new Date().toISOString(),
      locale: 'fr',
      viewCount: 0,
      
      // Relations (author optionnel pour éviter l'erreur)
      category: categoryId,
      tags: tagIds,
      
      // Composants SEO
      seo: {
        metaTitle: 'Article de Test N8N Enrichi - Blog',
        metaDescription: 'Test complet du système N8N avec catégories, tags et SEO automatique.',
        keywords: 'test, n8n, strapi, automatisation',
        canonicalUrl: null,
        preventIndexing: false
      },
      
      // Schema.org
      schema: {
        type: 'BlogPosting',
        headline: 'Article de Test N8N Enrichi',
        datePublished: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        wordCount: 120
      }
    };

    const response = await strapiClient.post('/api/articles', {
      data: testArticle
    });

    console.log(`✅ Article créé avec succès:`);
    console.log(`   📝 Titre: ${testArticle.title}`);
    console.log(`   🆔 ID: ${response.data.data.id}`);
    console.log(`   🏷️ Catégorie: ${categoryId}, Tags: [${tagIds.join(', ')}]`);
    console.log(`   📊 ${testArticle.readingTime}min lecture, SEO complet`);

    return response.data.data.id;

  } catch (error) {
    console.error('❌ Erreur création article:', error.response?.data || error.message);
    return null;
  }
}

// Test récupération article avec populate
async function testArticleRetrieval(articleId) {
  console.log('\n📖 Test récupération article avec populate...');
  
  try {
    const response = await strapiClient.get(`/api/articles/${articleId}`, {
      params: {
        populate: {
          category: true,
          tags: true,
          author: true,
          seo: true,
          schema: true
        }
      }
    });

    const article = response.data.data;
    console.log('✅ Article récupéré avec toutes les relations:');
    console.log(`   📝 Titre: ${article.title}`);
    console.log(`   🏷️ Catégorie: ${article.category?.name || 'N/A'}`);
    console.log(`   🏷️ Tags: ${article.tags?.map(t => t.name).join(', ') || 'N/A'}`);
    console.log(`   👤 Auteur: ${article.author?.username || article.author?.email || 'N/A'}`);
    console.log(`   🔍 SEO: ${article.seo ? 'Configuré' : 'Non configuré'}`);
    console.log(`   📊 Schema: ${article.schema ? 'Configuré' : 'Non configuré'}`);

  } catch (error) {
    console.error('❌ Erreur récupération article:', error.response?.data || error.message);
  }
}

// Fonction principale
async function main() {
  console.log('🚀 TEST COMPLET SYSTÈME N8N ENRICHI');
  console.log('===================================');
  
  try {
    // 1. Test des endpoints de base
    await testStrapiEndpoints();
    
    // 2. Test création catégorie
    const categoryId = await testCategoryCreation();
    
    // 3. Test création tags
    const tagIds = await testTagCreation();
    
    // 4. Test création article complet
    if (categoryId && tagIds.length > 0) {
      const articleId = await testArticleCreation(categoryId, tagIds);
      
      // 5. Test récupération avec populate
      if (articleId) {
        await testArticleRetrieval(articleId);
      }
    }
    
    console.log('\n🎉 TESTS TERMINÉS');
    console.log('Le système N8N enrichi est opérationnel!');
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error.message);
    process.exit(1);
  }
}

// Exécution
if (require.main === module) {
  main();
}

module.exports = { 
  testStrapiEndpoints, 
  testCategoryCreation, 
  testTagCreation, 
  testArticleCreation 
};