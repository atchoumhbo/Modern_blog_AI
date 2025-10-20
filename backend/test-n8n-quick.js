#!/usr/bin/env node

/**
 * Script N8N simplifié pour tests rapides
 */

const axios = require('axios');
require('dotenv').config();

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_N8N_API_TOKEN;

async function quickN8NTest() {
  console.log('⚡ Test N8N Rapide');
  console.log('==================');

  if (!API_TOKEN) {
    console.error('❌ Token manquant');
    return;
  }

  const client = axios.create({
    baseURL: STRAPI_URL,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  try {
    const timestamp = Date.now();
    
    // Article minimal pour N8N
    const minimalArticle = {
      data: {
        title: `N8N Quick Test ${timestamp}`,
        slug: `n8n-test-${timestamp}`,
        content: '# Test rapide N8N\n\nArticle de test minimal.',
        status: 'published',
        publishedAt: new Date().toISOString()
      }
    };

    console.log('📝 Création article minimal...');
    const response = await client.post('/api/articles', minimalArticle);
    
    console.log('✅ SUCCESS!');
    console.log('   ID:', response.data.data.id);
    console.log('   Titre:', response.data.data.attributes.title);
    console.log('   Status:', response.data.data.attributes.status);
    
    console.log('\n🎯 Payload N8N minimal:');
    console.log(JSON.stringify(minimalArticle, null, 2));

  } catch (error) {
    console.error('❌ Erreur:', error.response?.data?.error || error.message);
  }
}

quickN8NTest();