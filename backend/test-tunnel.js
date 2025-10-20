#!/usr/bin/env node

/**
 * Test du tunnel Cloudflare pour N8N
 */

const axios = require('axios');
require('dotenv').config();

const TUNNEL_URL = 'https://passenger-beaches-audience-nov.trycloudflare.com';
const API_TOKEN = process.env.STRAPI_N8N_API_TOKEN;

async function testTunnel() {
  console.log('🌐 Test Tunnel Cloudflare pour N8N');
  console.log('===================================');
  console.log('URL Tunnel:', TUNNEL_URL);
  console.log('Token configuré:', API_TOKEN ? '✅ Oui' : '❌ Non');

  if (!API_TOKEN) {
    console.error('❌ Token manquant dans .env');
    return;
  }

  const client = axios.create({
    baseURL: TUNNEL_URL,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    timeout: 15000
  });

  try {
    // Test 1: Connectivité
    console.log('\n🔍 Test de connectivité...');
    const health = await client.get('/api/articles');
    console.log('✅ Tunnel accessible - Status:', health.status);
    console.log('   Articles via tunnel:', health.data.data.length);

    // Test 2: Création d'article
    console.log('\n📝 Test création via tunnel...');
    const timestamp = Date.now();
    
    const articleData = {
      data: {
        title: `N8N Tunnel Test ${timestamp}`,
        slug: `n8n-tunnel-${timestamp}`,
        content: `# Test via Cloudflare Tunnel

Cet article a été créé via le tunnel Cloudflare pour tester l'intégration N8N.

**URL Tunnel**: ${TUNNEL_URL}
**Timestamp**: ${new Date().toISOString()}

## Configuration N8N

Utilisez cette URL dans votre workflow N8N :
- **URL**: ${TUNNEL_URL}/api/articles
- **Method**: POST
- **Headers**: Authorization: Bearer [TOKEN]`,
        status: 'published',
        publishedAt: new Date().toISOString()
      }
    };

    const response = await client.post('/api/articles', articleData);
    console.log('✅ Article créé via tunnel!');
    console.log('   ID:', response.data.data.id);
    console.log('   Titre:', response.data.data.attributes.title);

    console.log('\n🎯 CONFIGURATION N8N:');
    console.log('   URL:', `${TUNNEL_URL}/api/articles`);
    console.log('   Method: POST');
    console.log('   Authorization: Bearer', API_TOKEN.substring(0, 20) + '...');
    console.log('   Content-Type: application/json');

    console.log('\n✅ TUNNEL CLOUDFLARE OPÉRATIONNEL! 🚀');

  } catch (error) {
    console.error('❌ Erreur tunnel:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔧 Erreur 401 - Vérifiez le token API');
    }
    if (error.code === 'ECONNABORTED') {
      console.log('\n🔧 Timeout - Le tunnel met du temps à répondre');
    }
  }
}

testTunnel();