#!/usr/bin/env node

/**
 * Debug complet du système N8N
 */

const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function debugN8NSystem() {
  console.log('🔍 DEBUG SYSTÈME N8N COMPLET');
  console.log('============================');
  console.log('');

  // 1. Vérifier les variables d'environnement
  console.log('📋 VARIABLES D\'ENVIRONNEMENT:');
  console.log('   STRAPI_N8N_API_TOKEN:', process.env.STRAPI_N8N_API_TOKEN ? '✅ Configuré' : '❌ Manquant');
  console.log('   OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Configuré' : '❌ Manquant');
  console.log('   PERPLEXITY_API_KEY:', process.env.PERPLEXITY_API_KEY ? '✅ Configuré' : '❌ Manquant');
  console.log('   GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ Configuré' : '❌ Manquant');
  console.log('');

  // 2. Test connectivité Strapi
  console.log('🌐 TEST CONNECTIVITÉ STRAPI:');
  try {
    const strapiClient = axios.create({
      baseURL: 'http://localhost:1337',
      headers: {
        'Authorization': `Bearer ${process.env.STRAPI_N8N_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    // Test simple GET
    console.log('   📡 Test GET /api/articles...');
    const getResponse = await strapiClient.get('/api/articles?pagination[limit]=1');
    console.log('   ✅ Connexion Strapi OK');
    console.log('   📊 Articles existants:', getResponse.data.data.length);
    
    // Test création article
    console.log('   📝 Test POST /api/articles...');
    const testArticle = {
      data: {
        title: `DEBUG Test ${Date.now()}`,
        slug: `debug-test-${Date.now()}`,
        content: '# Test de debug\n\nCeci est un test de debug du système N8N.',
        status: 'published',
        publishedAt: new Date().toISOString()
      }
    };

    const createResponse = await strapiClient.post('/api/articles', testArticle);
    console.log('   ✅ Création article OK');
    console.log('   🆔 ID créé:', createResponse.data.data.id);
    console.log('   📄 Titre:', createResponse.data.data.attributes.title);

  } catch (error) {
    console.log('   ❌ Erreur Strapi:', error.message);
    if (error.response) {
      console.log('   📄 Status:', error.response.status);
      console.log('   📄 Data:', error.response.data);
    }
  }

  console.log('');

  // 3. Test base de données tracking
  console.log('🗄️  TEST BASE DE DONNÉES TRACKING:');
  try {
    const RedditTracker = require('./reddit-tracker');
    const tracker = new RedditTracker();
    
    const stats = await tracker.getStats();
    console.log('   ✅ SQLite tracking OK');
    console.log('   📊 Statistiques:', stats);
    
    tracker.close();
  } catch (error) {
    console.log('   ❌ Erreur tracking DB:', error.message);
  }

  console.log('');
  console.log('🎯 DIAGNOSTIC TERMINÉ');
}

debugN8NSystem();