#!/usr/bin/env node

/**
 * Script de lancement du workflow N8N reproduction
 * Version simplifiée pour tests et démonstration
 */

const { runWorkflow } = require('./n8n-workflow-reproduction');

console.log('🚀 LANCEMENT DU WORKFLOW N8N REPRODUCTION');
console.log('=========================================');
console.log('');
console.log('⚠️  VÉRIFICATIONS PRÉREQUIS:');
console.log('   - Variables d\'environnement configurées dans .env');
console.log('   - PERPLEXITY_API_KEY définie');
console.log('   - OPENAI_API_KEY définie');
console.log('   - Tunnel Cloudflare actif');
console.log('   - Strapi backend démarré');
console.log('');

// Vérifier les variables d'environnement
require('dotenv').config();

const requiredEnvVars = [
  'PERPLEXITY_API_KEY',
  'OPENAI_API_KEY'
];

let missingVars = [];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName] || process.env[varName].includes('your-')) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log('❌ VARIABLES MANQUANTES:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('');
  console.log('📝 CONFIGURATION REQUISE:');
  console.log('   1. Créer compte Perplexity AI : https://perplexity.ai');
  console.log('   2. Créer compte OpenAI : https://openai.com');
  console.log('   3. Configurer les clés dans backend/.env');
  console.log('');
  process.exit(1);
}

console.log('✅ Variables d\'environnement configurées');
console.log('');

// Lancer le workflow
runWorkflow().catch(error => {
  console.error('❌ Erreur fatale:', error.message);
  process.exit(1);
});