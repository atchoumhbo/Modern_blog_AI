#!/usr/bin/env node

/**
 * Test des filtres de langue côté frontend
 * Simule les appels API que fait le frontend pour vérifier le filtrage par langue
 */

const axios = require('axios');

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const API_URL = `${STRAPI_URL}/api`;

async function testLanguageFiltering() {
  console.log('🧪 === TEST FILTRAGE LANGUE FRONTEND ===\n');
  
  try {
    console.log('📊 Test 1: Récupération de tous les articles...');
    const allArticlesResponse = await axios.get(`${API_URL}/articles`, {
      params: {
        populate: { 
          author: true, 
          category: true,
          tags: true, 
          featured_image: true 
        },
        sort: { publishedAt: "desc" },
        pagination: { page: 1, pageSize: 10 },
        publicationState: "live"
      }
    });
    
    const allArticles = allArticlesResponse.data.data;
    console.log(`✅ Total articles: ${allArticles.length}`);
    
    // Compter par langue
    const languageCount = {};
    allArticles.forEach(article => {
      const lang = article.language || 'undefined';
      languageCount[lang] = (languageCount[lang] || 0) + 1;
    });
    
    console.log('📈 Répartition par langue:');
    Object.entries(languageCount).forEach(([lang, count]) => {
      console.log(`   ${lang}: ${count} articles`);
    });
    
    console.log('\n📊 Test 2: Filtrage articles français...');
    const frArticlesResponse = await axios.get(`${API_URL}/articles`, {
      params: {
        populate: { 
          author: true, 
          category: true,
          tags: true, 
          featured_image: true 
        },
        sort: { publishedAt: "desc" },
        pagination: { page: 1, pageSize: 10 },
        publicationState: "live",
        filters: {
          language: { $eq: 'fr' }
        }
      }
    });
    
    const frArticles = frArticlesResponse.data.data;
    console.log(`✅ Articles français: ${frArticles.length}`);
    frArticles.forEach(article => {
      console.log(`   - "${article.title || 'No title'}" (${article.language || 'undefined'})`);
    });
    
    console.log('\n📊 Test 3: Filtrage articles anglais...');
    const enArticlesResponse = await axios.get(`${API_URL}/articles`, {
      params: {
        populate: { 
          author: true, 
          category: true,
          tags: true, 
          featured_image: true 
        },
        sort: { publishedAt: "desc" },
        pagination: { page: 1, pageSize: 10 },
        publicationState: "live",
        filters: {
          language: { $eq: 'en' }
        }
      }
    });
    
    const enArticles = enArticlesResponse.data.data;
    console.log(`✅ Articles anglais: ${enArticles.length}`);
    enArticles.forEach(article => {
      console.log(`   - "${article.title || 'No title'}" (${article.language || 'undefined'})`);
    });
    
    console.log('\n📊 Test 4: Test des projets...');
    const allProjectsResponse = await axios.get(`${API_URL}/projects`, {
      params: {
        populate: { 
          author: true, 
          featured_image: true,
          technologies: true
        },
        sort: { createdAt: "desc" },
        pagination: { page: 1, pageSize: 10 },
        publicationState: "live"
      }
    });
    
    const allProjects = allProjectsResponse.data.data;
    console.log(`✅ Total projets: ${allProjects.length}`);
    
    // Compter par langue
    const projectLanguageCount = {};
    allProjects.forEach(project => {
      const lang = project.language || 'undefined';
      projectLanguageCount[lang] = (projectLanguageCount[lang] || 0) + 1;
    });
    
    console.log('📈 Répartition projets par langue:');
    Object.entries(projectLanguageCount).forEach(([lang, count]) => {
      console.log(`   ${lang}: ${count} projets`);
    });
    
    console.log('\n🎉 === TESTS TERMINÉS ===');
    console.log('\n📋 Résumé:');
    console.log(`   📝 Articles français: ${frArticles.length}`);
    console.log(`   📝 Articles anglais: ${enArticles.length}`);
    console.log(`   🚀 Total projets: ${allProjects.length}`);
    console.log(`   ✅ Le filtrage par langue est ${(frArticles.length > 0 && enArticles.length > 0) ? 'FONCTIONNEL' : 'À VÉRIFIER'}`);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    if (error.response?.data) {
      console.error('📋 Détails:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Lancer le test
testLanguageFiltering().catch(console.error);