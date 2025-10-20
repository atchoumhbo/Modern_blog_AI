#!/usr/bin/env node

/**
 * 🚀 GUIDE DE CONFIGURATION WORKFLOW N8N AVANCÉ
 * Configuration complète de votre système cybersécurité
 */

console.log('🔒 CONFIGURATION WORKFLOW CYBERSÉCURITÉ AVANCÉ');
console.log('==============================================');
console.log('');

console.log('📋 ÉTAPES DE CONFIGURATION:');
console.log('===========================');

const steps = [
  {
    step: 1,
    title: 'Import du workflow dans N8N',
    description: 'Importer reddit-strapi-workflow-advanced-fixed.json dans votre instance N8N',
    action: '• Menu N8N > Import > Sélectionner le fichier JSON'
  },
  {
    step: 2,
    title: 'Configuration Reddit OAuth2',
    description: 'Créer les credentials Reddit pour recherche et commentaires',
    action: '• N8N > Credentials > Reddit OAuth2 API\n• Client ID/Secret depuis https://reddit.com/prefs/apps\n• Scopes: read, submit'
  },
  {
    step: 3,
    title: 'Configuration Perplexity API',
    description: 'Ajouter votre token Perplexity pour analyses multi-sources',
    action: '• N8N > Credentials > Perplexity API\n• Token depuis https://perplexity.ai/settings/api'
  },
  {
    step: 4,
    title: 'Configuration OpenAI API',
    description: 'Token OpenAI pour génération articles cybersécurité',
    action: '• N8N > Credentials > OpenAI API\n• API Key depuis https://platform.openai.com/api-keys'
  },
  {
    step: 5,
    title: 'Configuration Google Sheets',
    description: 'Service Account pour tracking posts et articles',
    action: '• Google Cloud Console > Service Account\n• Activer Google Sheets API\n• Télécharger JSON credentials'
  },
  {
    step: 6,
    title: 'Création Google Sheets de tracking',
    description: 'Créer les feuilles de suivi avec colonnes spécifiques',
    action: '• Feuille "Reddit Posts Tracking"\n• Feuille "Published Articles"\n• Partager avec service account email'
  }
];

steps.forEach(step => {
  console.log(`${step.step}. ✅ ${step.title}`);
  console.log(`   📝 ${step.description}`);
  console.log(`   🔧 ${step.action}`);
  console.log('');
});

console.log('📊 STRUCTURE GOOGLE SHEETS REQUISE:');
console.log('===================================');

console.log('🟦 Feuille "Reddit Posts Tracking":');
const trackingColumns = [
  'Post ID', 'Title', 'Subreddit', 'Score', 'Comments',
  'Impact Score', 'Threat Level', 'Security Category', 'Keywords',
  'Created', 'Processing Priority', 'Status', 'Analyzed At', 'URL'
];
trackingColumns.forEach((col, index) => {
  console.log(`   ${String.fromCharCode(65 + index)}. ${col}`);
});

console.log('');
console.log('🟩 Feuille "Published Articles":');
const articlesColumns = [
  'Article ID', 'Post ID', 'Title', 'Slug', 'Category',
  'Threat Level', 'CVSS Score', 'Analysis Count', 'Confidence',
  'Published At', 'Strapi URL', 'Status'
];
articlesColumns.forEach((col, index) => {
  console.log(`   ${String.fromCharCode(65 + index)}. ${col}`);
});

console.log('');
console.log('🔑 CREDENTIALS À CONFIGURER:');
console.log('============================');

const credentials = [
  {
    name: 'REDDIT_CRED_ID',
    type: 'Reddit OAuth2 API',
    fields: ['Client ID', 'Client Secret', 'Username', 'Password'],
    url: 'https://reddit.com/prefs/apps'
  },
  {
    name: 'PERPLEXITY_CRED_ID',
    type: 'Perplexity API',
    fields: ['API Token'],
    url: 'https://perplexity.ai/settings/api'
  },
  {
    name: 'OPENAI_CRED_ID',
    type: 'OpenAI API',
    fields: ['API Key'],
    url: 'https://platform.openai.com/api-keys'
  },
  {
    name: 'GOOGLE_SHEETS_CRED_ID',
    type: 'Google Sheets OAuth2 API',
    fields: ['Service Account JSON'],
    url: 'https://console.cloud.google.com'
  }
];

credentials.forEach((cred, index) => {
  console.log(`${index + 1}. 🔐 ${cred.name}`);
  console.log(`   Type: ${cred.type}`);
  console.log(`   Champs: ${cred.fields.join(', ')}`);
  console.log(`   URL: ${cred.url}`);
  console.log('');
});

console.log('⚙️ PARAMÈTRES À PERSONNALISER:');
console.log('==============================');

const settings = [
  {
    node: 'Reddit - Recherche Cybersecurity',
    parameter: 'subreddit',
    current: 'Cybersecurity',
    description: 'Subreddit à analyser (cybersecurity, netsec, etc.)'
  },
  {
    node: 'Reddit - Recherche Cybersecurity',
    parameter: 'keyword',
    current: 'vulnerability security',
    description: 'Mots-clés de recherche cybersécurité'
  },
  {
    node: 'Sauvegarder dans Google Sheets',
    parameter: 'documentId',
    current: 'YOUR_GOOGLE_SHEET_ID',
    description: 'ID de votre Google Sheet de tracking'
  },
  {
    node: 'Déclencheur programmé',
    parameter: 'hoursInterval',
    current: '2',
    description: 'Fréquence d\'exécution (heures)'
  }
];

settings.forEach((setting, index) => {
  console.log(`${index + 1}. ⚙️ ${setting.node}`);
  console.log(`   Paramètre: ${setting.parameter}`);
  console.log(`   Valeur actuelle: ${setting.current}`);
  console.log(`   Description: ${setting.description}`);
  console.log('');
});

console.log('🚀 COÛTS ESTIMÉS PAR EXÉCUTION:');
console.log('===============================');
console.log('💰 Perplexity (6 appels): ~$0.18');
console.log('💰 OpenAI GPT-4o-mini: ~$0.06');
console.log('💰 Google Sheets API: Gratuit');
console.log('💰 Reddit API: Gratuit');
console.log('💸 TOTAL: ~$0.24 par article');

console.log('');
console.log('⚡ PERFORMANCES ATTENDUES:');
console.log('=========================');
console.log('⏱️ Temps d\'exécution: 5-8 minutes');
console.log('📝 Articles générés: 1 par exécution');
console.log('🎯 Qualité: Premium (multi-sources)');
console.log('🔄 Automation: 100% automatique');
console.log('📊 Tracking: Complet Google Sheets');

console.log('');
console.log('🔧 COMMANDES DE TEST:');
console.log('====================');
console.log('1. Test manuel workflow: Bouton "Execute Workflow" dans N8N');
console.log('2. Test node individuel: Clic droit > "Execute Node"');
console.log('3. Vérification logs: Panel "Executions" dans N8N');
console.log('4. Vérification Google Sheets: Consulter feuilles tracking');

console.log('');
console.log('🎉 WORKFLOW PRÊT!');
console.log('=================');
console.log('Une fois configuré, votre workflow cybersécurité:');
console.log('• ✅ Recherche automatiquement posts r/Cybersecurity');
console.log('• ✅ Filtre par threat level et impact score');
console.log('• ✅ Sauvegarde candidats dans Google Sheets');
console.log('• ✅ Analyse 5 URLs expertes par Perplexity');
console.log('• ✅ Synthétise toutes les analyses');
console.log('• ✅ Génère article technique OpenAI');
console.log('• ✅ Publie dans Strapi avec métadonnées');
console.log('• ✅ Track article publié Google Sheets');
console.log('• ✅ Commente automatiquement sur Reddit');

console.log('');
console.log('🚨 SYSTÈME DE GÉNÉRATION CYBERSÉCURITÉ NIVEAU ENTREPRISE OPÉRATIONNEL! 🚨');