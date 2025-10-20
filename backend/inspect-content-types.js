#!/usr/bin/env node

/**
 * Script pour examiner la structure des Content Types
 */

const axios = require('axios');
require('dotenv').config();

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_N8N_API_TOKEN;

async function inspectContentTypes() {
  console.log('🔍 Inspection des Content Types');
  console.log('=================================');

  const client = axios.create({
    baseURL: STRAPI_URL,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  try {
    // Récupérer un article existant (si il y en a)
    console.log('📋 Récupération des articles existants...');
    const articles = await client.get('/api/articles?pagination[limit]=1');
    
    if (articles.data.data.length > 0) {
      console.log('✅ Structure d\'un article existant:');
      console.log(JSON.stringify(articles.data.data[0].attributes, null, 2));
    } else {
      console.log('⚠️  Aucun article existant pour examiner la structure');
    }

    // Essayer de créer avec différents champs
    console.log('\n🧪 Tests de différents champs...');
    
    const testFields = [
      { name: 'content', data: { data: { title: 'Test', content: 'Test content' } } },
      { name: 'description', data: { data: { title: 'Test', description: 'Test description' } } },
      { name: 'text', data: { data: { title: 'Test', text: 'Test text' } } },
      { name: 'body', data: { data: { title: 'Test', body: 'Test body' } } }
    ];

    for (const field of testFields) {
      try {
        const response = await client.post('/api/articles', field.data);
        console.log(`✅ Champ '${field.name}' accepté!`);
        // Supprimer l'article de test
        await client.delete(`/api/articles/${response.data.data.id}`);
      } catch (error) {
        if (error.response?.data?.error?.message?.includes(`Invalid key ${field.name}`)) {
          console.log(`❌ Champ '${field.name}' n'existe pas`);
        } else {
          console.log(`⚠️  Champ '${field.name}': ${error.response?.data?.error?.message || error.message}`);
        }
      }
    }

    // Essayer juste avec title
    console.log('\n📝 Test avec titre uniquement...');
    try {
      const simpleArticle = await client.post('/api/articles', {
        data: {
          title: `Article Simple ${Date.now()}`,
          publishedAt: new Date().toISOString()
        }
      });
      console.log('✅ Article créé avec titre uniquement!');
      console.log('   Structure créée:', JSON.stringify(simpleArticle.data.data.attributes, null, 2));
    } catch (error) {
      console.log('❌ Erreur avec titre seul:', error.response?.data?.error?.message);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.response?.data || error.message);
  }
}

inspectContentTypes();