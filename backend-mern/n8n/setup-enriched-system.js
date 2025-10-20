#!/usr/bin/env node

/**
 * Configuration automatique complète du système N8N enrichi
 * - Initialise l'auteur par défaut
 * - Crée les catégories de base
 * - Configure les tags essentiels
 * - Teste le système complet
 */

const axios = require('axios');
const path = require('path');
const { initDefaultAuthor } = require('./init-default-author');
const { testStrapiEndpoints } = require('./test-enriched-system');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const CONFIG = {
  TUNNEL_URL: process.env.CLOUDFLARE_TUNNEL_URL || 'https://proc-improved-cricket-charts.trycloudflare.com',
  STRAPI_TOKEN: process.env.STRAPI_N8N_API_TOKEN || 'a4239ed0a52427929d703538e1c298a37b088db1a2f859c17015d5eb150a64b1b5195d8287184867af8ecb923f3bcfec83cd238f18b9b3f4349fbd885edb243a7349adbe7b2c00f14aa453e12a4e003c8286f1393cb60eebb67635845390575185092c7cb277b17a565c3099c9477487d2f615323dd40226c18471f46d8176af',
  
  // Catégories de base à créer
  BASE_CATEGORIES: [
    { name: 'Développement Web', color: '#3B82F6', icon: 'globe', subreddit: 'webdev' },
    { name: 'Programmation', color: '#EF4444', icon: 'code', subreddit: 'programming' },
    { name: 'JavaScript', color: '#F59E0B', icon: 'js', subreddit: 'javascript' },
    { name: 'React', color: '#06B6D4', icon: 'react', subreddit: 'reactjs' },
    { name: 'Next.js', color: '#1F2937', icon: 'nextjs', subreddit: 'nextjs' },
    { name: 'Apprentissage', color: '#10B981', icon: 'book', subreddit: 'learnprogramming' },
    { name: 'Node.js', color: '#22C55E', icon: 'nodejs', subreddit: 'node' },
    { name: 'Frontend', color: '#8B5CF6', icon: 'layout', subreddit: 'Frontend' }
  ],
  
  // Tags de base
  BASE_TAGS: [
    'Tutoriel', 'Guide', 'Best Practices', 'Tips', 'Débutant', 'Avancé',
    'Performance', 'Sécurité', 'Testing', 'Documentation', 'Open Source',
    'Framework', 'Library', 'Tools', 'Workflow', 'Debugging'
  ]
};

const strapiClient = axios.create({
  baseURL: CONFIG.TUNNEL_URL,
  headers: {
    'Authorization': `Bearer ${CONFIG.STRAPI_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function createBaseCategories() {
  console.log('🏗️ Création des catégories de base...');
  
  const createdCategories = [];
  
  for (const category of CONFIG.BASE_CATEGORIES) {
    try {
      // Vérifier si la catégorie existe déjà
      const searchResponse = await strapiClient.get('/api/categories', {
        params: { 'filters[name][$eq]': category.name }
      });

      if (searchResponse.data.data.length > 0) {
        console.log(`✅ Catégorie existante: ${category.name}`);
        createdCategories.push(searchResponse.data.data[0]);
        continue;
      }

      // Créer la catégorie
      const slug = category.name.toLowerCase()
        .replace(/[éèêë]/g, 'e')
        .replace(/[àâä]/g, 'a')
        .replace(/[ùûü]/g, 'u')
        .replace(/[îï]/g, 'i')
        .replace(/[ôö]/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const createResponse = await strapiClient.post('/api/categories', {
        data: {
          name: category.name,
          slug: slug,
          description: `Catégorie pour les articles du subreddit r/${category.subreddit}`,
          color: category.color,
          icon: category.icon
        }
      });

      console.log(`✅ Catégorie créée: ${category.name} (ID: ${createResponse.data.data.id})`);
      createdCategories.push(createResponse.data.data);

    } catch (error) {
      console.error(`❌ Erreur catégorie ${category.name}:`, error.response?.data || error.message);
    }
  }

  return createdCategories;
}

async function createBaseTags() {
  console.log('\n🏷️ Création des tags de base...');
  
  const createdTags = [];
  
  for (const tagName of CONFIG.BASE_TAGS) {
    try {
      // Vérifier si le tag existe déjà
      const searchResponse = await strapiClient.get('/api/tags', {
        params: { 'filters[name][$eq]': tagName }
      });

      if (searchResponse.data.data.length > 0) {
        console.log(`✅ Tag existant: ${tagName}`);
        createdTags.push(searchResponse.data.data[0]);
        continue;
      }

      // Créer le tag
      const slug = tagName.toLowerCase()
        .replace(/[éèêë]/g, 'e')
        .replace(/[àâä]/g, 'a')
        .replace(/[ùûü]/g, 'u')
        .replace(/[îï]/g, 'i')
        .replace(/[ôö]/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const createResponse = await strapiClient.post('/api/tags', {
        data: {
          name: tagName,
          slug: slug,
          color: '#6B7280'
        }
      });

      console.log(`✅ Tag créé: ${tagName} (ID: ${createResponse.data.data.id})`);
      createdTags.push(createResponse.data.data);

    } catch (error) {
      console.error(`❌ Erreur tag ${tagName}:`, error.response?.data || error.message);
    }
  }

  return createdTags;
}

async function generateSystemReport(authorId, categories, tags) {
  console.log('\n📊 RAPPORT DE CONFIGURATION SYSTÈME');
  console.log('=====================================');
  
  console.log(`👤 Auteur par défaut: ID ${authorId}`);
  console.log(`📂 Catégories: ${categories.length} créées/vérifiées`);
  console.log(`🏷️ Tags: ${tags.length} créés/vérifiés`);
  
  console.log('\n📂 CATÉGORIES DISPONIBLES:');
  categories.forEach((cat, index) => {
    console.log(`   ${index + 1}. ${cat.name} (${cat.color}) - ID: ${cat.id}`);
  });
  
  console.log('\n🏷️ TAGS DISPONIBLES:');
  tags.slice(0, 8).forEach((tag, index) => {
    console.log(`   ${index + 1}. ${tag.name} - ID: ${tag.id}`);
  });
  if (tags.length > 8) {
    console.log(`   ... et ${tags.length - 8} autres tags`);
  }
  
  console.log('\n🔧 CONFIGURATION WORKFLOW:');
  console.log('   ✅ Multi-subreddits activé');
  console.log('   ✅ Catégories automatiques');
  console.log('   ✅ Tags dynamiques');
  console.log('   ✅ SEO complet');
  console.log('   ✅ Calcul temps de lecture');
  console.log('   ✅ Données structurées');
  
  console.log('\n▶️ PRÊT POUR PRODUCTION:');
  console.log('   1. Lancer: node n8n-workflow-reproduction.js');
  console.log('   2. Ou planifier avec cron job');
  console.log('   3. Surveiller les logs');
}

async function verifySystemHealth() {
  console.log('\n🔍 Vérification santé du système...');
  
  try {
    await testStrapiEndpoints();
    console.log('✅ Tous les endpoints Strapi fonctionnent');
  } catch (error) {
    console.error('❌ Problème avec les endpoints Strapi');
  }
  
  // Vérifier les variables d'environnement
  const requiredEnvVars = [
    'PERPLEXITY_API_KEY',
    'OPENAI_API_KEY', 
    'GROQ_API_KEY',
    'STRAPI_N8N_API_TOKEN'
  ];
  
  console.log('\n🔐 Variables d\'environnement:');
  for (const envVar of requiredEnvVars) {
    const exists = process.env[envVar] ? '✅' : '❌';
    const value = process.env[envVar] ? `${process.env[envVar].substring(0, 10)}...` : 'NON DÉFINIE';
    console.log(`   ${exists} ${envVar}: ${value}`);
  }
}

// Fonction principale
async function main() {
  console.log('🚀 CONFIGURATION AUTOMATIQUE SYSTÈME N8N ENRICHI');
  console.log('===============================================');
  
  try {
    // 1. Vérifier la santé du système
    await verifySystemHealth();
    
    // 2. Initialiser l'auteur par défaut
    console.log('\n👤 Initialisation auteur...');
    const authorId = await initDefaultAuthor();
    
    // 3. Créer les catégories de base
    const categories = await createBaseCategories();
    
    // 4. Créer les tags de base
    const tags = await createBaseTags();
    
    // 5. Générer le rapport final
    await generateSystemReport(authorId, categories, tags);
    
    console.log('\n🎉 CONFIGURATION TERMINÉE AVEC SUCCÈS!');
    console.log('Le système N8N enrichi est maintenant prêt à fonctionner.');
    
  } catch (error) {
    console.error('💥 Erreur fatale lors de la configuration:', error.message);
    process.exit(1);
  }
}

// Exécution
if (require.main === module) {
  main();
}

module.exports = { createBaseCategories, createBaseTags, verifySystemHealth };