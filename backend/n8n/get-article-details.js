#!/usr/bin/env node

/**
 * Récupérer les détails d'un article Strapi créé par N8N
 */

const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function getArticleDetails(articleId) {
  console.log(`📄 RÉCUPÉRATION ARTICLE ID: ${articleId}`);
  console.log('=====================================');
  
  try {
    const strapiClient = axios.create({
      baseURL: 'http://localhost:1337',
      headers: {
        'Authorization': `Bearer ${process.env.STRAPI_N8N_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const response = await strapiClient.get(`/api/articles/${articleId}`);
    const article = response.data.data;
    
    console.log('✅ Article trouvé !');
    console.log('==================');
    console.log('🔍 Structure réponse:', JSON.stringify(article, null, 2));
    console.log('🆔 ID:', article.id);
    console.log('📝 Titre:', article.attributes?.title || 'N/A');
    console.log('🔗 Slug:', article.attributes.slug);
    console.log('🌐 Locale:', article.attributes.locale);
    console.log('📊 Statut:', article.attributes.status);
    console.log('📅 Publié le:', article.attributes.publishedAt);
    console.log('📅 Créé le:', article.attributes.createdAt);
    console.log('📅 Modifié le:', article.attributes.updatedAt);
    
    if (article.attributes.excerpt) {
      console.log('📋 Extrait:', article.attributes.excerpt.substring(0, 200) + '...');
    }
    
    console.log('');
    console.log('📖 CONTENU COMPLET:');
    console.log('===================');
    console.log(article.attributes.content);
    
  } catch (error) {
    console.error('❌ Erreur récupération article:', error.message);
    if (error.response) {
      console.error('📄 Status:', error.response.status);
      console.error('📄 Data:', error.response.data);
    }
  }
}

// Récupérer les derniers articles créés
async function getRecentArticles() {
  console.log('📚 DERNIERS ARTICLES CRÉÉS PAR N8N');
  console.log('==================================');
  
  try {
    const strapiClient = axios.create({
      baseURL: 'http://localhost:1337',
      headers: {
        'Authorization': `Bearer ${process.env.STRAPI_N8N_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const response = await strapiClient.get('/api/articles?sort=createdAt:desc&pagination[limit]=5');
    const articles = response.data.data;
    
    console.log(`📊 ${articles.length} articles récents trouvés:`);
    console.log('');
    
    articles.forEach((article, index) => {
      console.log(`${index + 1}. ID: ${article.id}`);
      console.log(`   📝 ${article.attributes.title}`);
      console.log(`   🔗 ${article.attributes.slug}`);
      console.log(`   🌐 ${article.attributes.locale || 'N/A'}`);
      console.log(`   📅 ${new Date(article.attributes.createdAt).toLocaleString()}`);
      console.log('');
    });
    
    return articles;
    
  } catch (error) {
    console.error('❌ Erreur récupération articles:', error.message);
    return [];
  }
}

async function main() {
  // Récupérer les articles récents d'abord
  const recentArticles = await getRecentArticles();
  
  // Demander quel article afficher en détail
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const articleId = args[0];
    console.log('');
    await getArticleDetails(articleId);
  } else {
    console.log('💡 Pour voir les détails d\'un article :');
    console.log('   node get-article-details.js <ID>');
    console.log('');
    console.log('📋 Exemples basés sur vos articles récents :');
    recentArticles.slice(0, 3).forEach(article => {
      console.log(`   node get-article-details.js ${article.id}`);
    });
  }
}

main();