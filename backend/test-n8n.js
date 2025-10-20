#!/usr/bin/env node

/**
 * Script de test N8N dans le backend Strapi
 */

const axios = require('axios');

// Variables d'environnement du backend
require('dotenv').config();

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_N8N_API_TOKEN;

async function testN8NIntegration() {
  console.log('🚀 Test N8N Integration depuis Backend');
  console.log('======================================');
  console.log('URL Strapi:', STRAPI_URL);
  console.log('Token configuré:', API_TOKEN ? '✅ Oui' : '❌ Non');
  
  if (!API_TOKEN) {
    console.error('❌ STRAPI_N8N_API_TOKEN non configuré dans .env');
    process.exit(1);
  }

  const client = axios.create({
    baseURL: STRAPI_URL,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    timeout: 10000
  });

  try {
    // Test 1: Connectivité
    console.log('\n🔍 Test de connectivité...');
    const health = await client.get('/api/articles?pagination[limit]=1');
    console.log('✅ Strapi accessible - Status:', health.status);
    console.log('   Articles existants:', health.data.data.length);

    // Test 2: Création d'article simple
    console.log('\n📝 Test création d\'article...');
    const timestamp = Date.now();
    
    const articleData = {
      data: {
        title: `Test N8N Article ${timestamp}`,
        slug: `test-n8n-${timestamp}`,
        content: `# Article de test N8N

Cet article a été créé automatiquement par N8N le ${new Date().toLocaleString()}.

## Contenu de test

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

### Fonctionnalités testées:
- Création d'article via API
- Formatage Markdown
- Métadonnées SEO
- Relations avec catégories et tags

**Status**: Article créé avec succès!`,
        excerpt: 'Article de test créé automatiquement par N8N pour valider l\'intégration API',
        status: 'published',
        readingTime: 2,
        viewCount: 0,
        seo: {
          metaTitle: `Test N8N Article ${timestamp}`,
          metaDescription: 'Article de test automatisé créé par N8N',
          keywords: 'n8n, automation, strapi, cms, test'
        },
        schema: {
          type: 'Article',
          headline: `Test N8N Article ${timestamp}`,
          datePublished: new Date().toISOString(),
          dateModified: new Date().toISOString(),
          wordCount: 85
        },
        publishedAt: new Date().toISOString()
      }
    };

    const createResponse = await client.post('/api/articles', articleData);
    console.log('✅ Article créé avec succès!');
    console.log('   ID:', createResponse.data.data.id);
    console.log('   Titre:', createResponse.data.data.attributes.title);
    console.log('   Slug:', createResponse.data.data.attributes.slug);

    // Test 3: Récupération de l'article
    console.log('\n📖 Test récupération...');
    const articleId = createResponse.data.data.id;
    const getResponse = await client.get(`/api/articles/${articleId}`);
    console.log('✅ Article récupéré:', getResponse.data.data.attributes.title);

    // Test 4: Liste des articles
    console.log('\n📋 Test liste des articles...');
    const listResponse = await client.get('/api/articles?pagination[limit]=5&sort=createdAt:desc');
    console.log('✅ Articles listés:', listResponse.data.data.length);
    
    if (listResponse.data.data.length > 0) {
      console.log('   Dernier article:', listResponse.data.data[0].attributes.title);
    }

    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS!');
    console.log('======================================');
    console.log('✅ Votre Strapi est prêt pour N8N!');
    console.log('\n📋 Informations pour N8N:');
    console.log('   URL API:', `${STRAPI_URL}/api/articles`);
    console.log('   Token:', API_TOKEN.substring(0, 20) + '...');
    console.log('   Method: POST');
    console.log('   Headers: Authorization: Bearer [TOKEN]');
    console.log('   Content-Type: application/json');
    
    console.log('\n📝 Exemple payload pour N8N:');
    console.log(JSON.stringify({
      data: {
        title: "Article depuis N8N - {{$now}}",
        slug: "article-n8n-{{$now}}",
        content: "# Contenu de l'article\n\nCeci est un article créé par N8N.\n\n## Détails\n- Date: {{$now}}\n- Source: Automation N8N",
        excerpt: "Article créé automatiquement par workflow N8N",
        status: "published",
        readingTime: 3,
        viewCount: 0,
        metaTitle: "Article N8N - {{$now}}",
        metaDescription: "Article automatisé créé par N8N workflow",
        keywords: "n8n, automation, cms",
        preventIndexing: false,
        seo: {
          metaTitle: "Article N8N - {{$now}}",
          metaDescription: "Article créé automatiquement par N8N",
          keywords: "n8n, automation, strapi"
        },
        schema: {
          type: "Article",
          headline: "Article depuis N8N - {{$now}}",
          datePublished: "{{$now}}",
          dateModified: "{{$now}}",
          wordCount: 50
        },
        publishedAt: "{{$now}}"
      }
    }, null, 2));

    console.log('\n🚀 Prochaine étape:');
    console.log('   Exposer Strapi: cloudflared tunnel --url http://localhost:1337');

  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log('\n🔧 Erreur 400 - Vérifications:');
      console.log('1. Le Content Type Article existe-t-il?');
      console.log('2. Les champs requis sont-ils corrects?');
      console.log('3. Les permissions sont-elles configurées?');
    }
    
    if (error.response?.status === 401) {
      console.log('\n🔧 Erreur 401 - Token invalide:');
      console.log('1. Vérifier STRAPI_N8N_API_TOKEN dans .env');
      console.log('2. Régénérer le token dans l\'admin Strapi');
    }
  }
}

// Exécution
testN8NIntegration();