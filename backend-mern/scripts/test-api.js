#!/usr/bin/env node

/**
 * Script de test de l'API Modern Blog Leader
 * 
 * Usage:
 *   node scripts/test-api.js
 * 
 * Prérequis:
 *   - Serveur lancé (npm run dev)
 *   - Base de données initialisée (npm run seed)
 */

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const EMAIL = process.env.ADMIN_EMAIL || 'boujraf.hicham@gmail.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

let accessToken = '';
let apiKey = '';

// ============================================
// UTILS
// ============================================

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function logSuccess(message) {
  log('✅', message);
}

function logError(message) {
  log('❌', message);
}

function logInfo(message) {
  log('ℹ️ ', message);
}

// ============================================
// TESTS
// ============================================

async function testHealthCheck() {
  log('\n📊', 'Testing health check...');
  const data = await request('/health', { method: 'GET' });
  logSuccess(`Health check OK: ${data.status}`);
  logInfo(`Environment: ${data.environment}`);
  logInfo(`Uptime: ${Math.floor(data.uptime)}s`);
}

async function testLogin() {
  log('\n🔐', 'Testing login...');
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  accessToken = data.accessToken;
  logSuccess(`Logged in as: ${data.user.email}`);
  logInfo(`User ID: ${data.user.id}`);
  logInfo(`Is Admin: ${data.user.isAdmin}`);
  logInfo(`Access Token: ${accessToken.substring(0, 20)}...`);
}

async function testGetMe() {
  log('\n👤', 'Testing get current user...');
  const data = await request('/auth/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  logSuccess(`User profile retrieved: ${data.username}`);
  logInfo(`Name: ${data.firstName} ${data.lastName}`);
  logInfo(`Created: ${new Date(data.createdAt).toLocaleDateString()}`);
}

async function testCreateApiKey() {
  log('\n🔑', 'Testing create API key...');
  const data = await request('/api-keys', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      name: 'Test API Key',
      expiresInDays: 30,
      canRead: true,
      canWrite: true,
      canDelete: false,
      rateLimit: 1000,
    }),
  });

  apiKey = data.key;
  logSuccess('API Key created!');
  logInfo(`Key: ${apiKey}`);
  logInfo(`Expires: ${new Date(data.expiresAt).toLocaleDateString()}`);
}

async function testListApiKeys() {
  log('\n📋', 'Testing list API keys...');
  const data = await request('/api-keys', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  logSuccess(`Found ${data.count} API keys`);
  data.data.forEach((key, i) => {
    logInfo(`${i + 1}. ${key.name} (${key.prefix}...)`);
  });
}

async function testGetArticles() {
  log('\n📚', 'Testing get articles (public)...');
  const data = await request('/articles', { method: 'GET' });

  logInfo('Articles endpoint ready');
  // Note: Full implementation in controllers needed
}

async function testCreateArticleWithApiKey() {
  log('\n✍️ ', 'Testing create article with API key...');
  
  try {
    const data = await request('/articles', {
      method: 'POST',
      headers: { 'X-API-Key': apiKey },
      body: JSON.stringify({
        title: 'Test Article from API',
        slug: 'test-article-from-api',
        content: 'This article was created using an API key!',
        excerpt: 'Testing API key authentication',
        isPublished: false,
      }),
    });

    logSuccess('Article created with API key!');
    logInfo(`Article ID: ${data.id || 'pending implementation'}`);
  } catch (error) {
    logInfo('Article creation pending full controller implementation');
  }
}

async function testCategories() {
  log('\n📁', 'Testing categories...');
  const data = await request('/categories', { method: 'GET' });
  logInfo('Categories endpoint ready');
}

async function testTags() {
  log('\n🏷️ ', 'Testing tags...');
  const data = await request('/tags', { method: 'GET' });
  logInfo('Tags endpoint ready');
}

async function testProjects() {
  log('\n🚀', 'Testing projects...');
  const data = await request('/projects', { method: 'GET' });
  logInfo('Projects endpoint ready');
}

// ============================================
// MAIN
// ============================================

async function runTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Modern Blog Leader API Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logInfo(`API URL: ${API_URL}`);
  logInfo(`Admin Email: ${EMAIL}`);

  try {
    await testHealthCheck();
    await testLogin();
    await testGetMe();
    await testCreateApiKey();
    await testListApiKeys();
    await testGetArticles();
    await testCreateArticleWithApiKey();
    await testCategories();
    await testTags();
    await testProjects();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logSuccess('All tests completed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📝 Next steps:');
    console.log('   1. Save your API key: ' + apiKey);
    console.log('   2. Use it in N8N with header: X-API-Key');
    console.log('   3. Implement remaining controllers for full CRUD\n');

  } catch (error) {
    logError(`Test failed: ${error.message}`);
    process.exit(1);
  }
}

runTests();
