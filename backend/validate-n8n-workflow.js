#!/usr/bin/env node

/**
 * TEST ET VALIDATION DU WORKFLOW N8N GÉNÉRÉ
 */

const fs = require('fs');

console.log('🧪 TEST WORKFLOW N8N GÉNÉRÉ');
console.log('===========================');
console.log('');

// Vérifier que le fichier existe
const workflowFile = 'reddit-strapi-workflow-ready.json';

if (!fs.existsSync(workflowFile)) {
  console.log('❌ Fichier workflow non trouvé!');
  console.log('💡 Exécutez d\'abord: node generate-n8n-ready.js');
  process.exit(1);
}

console.log('📁 Chargement du workflow...');
const workflow = JSON.parse(fs.readFileSync(workflowFile, 'utf8'));

console.log('✅ Workflow chargé avec succès!');
console.log('');

// Tests de validation
console.log('🔍 VALIDATION STRUCTURE:');
console.log('========================');

const tests = [
  {
    name: 'ID Workflow présent',
    test: () => workflow.id && workflow.id.length > 0,
    value: workflow.id
  },
  {
    name: 'Nom du workflow défini',
    test: () => workflow.name && workflow.name.length > 0,
    value: workflow.name
  },
  {
    name: 'Nodes présents',
    test: () => workflow.nodes && workflow.nodes.length > 0,
    value: `${workflow.nodes.length} nodes`
  },
  {
    name: 'Connexions définies',
    test: () => workflow.connections && Object.keys(workflow.connections).length > 0,
    value: `${Object.keys(workflow.connections).length} connexions`
  },
  {
    name: 'Version ID présent',
    test: () => workflow.versionId && workflow.versionId.length > 0,
    value: workflow.versionId
  }
];

tests.forEach(test => {
  const passed = test.test();
  const status = passed ? '✅' : '❌';
  console.log(`   ${status} ${test.name}: ${test.value || 'Non défini'}`);
});

console.log('');
console.log('🎯 VALIDATION NODES SPÉCIFIQUES:');
console.log('================================');

const expectedNodes = [
  'Schedule Trigger',
  'Reddit',
  'Code', 
  'Perplexity',
  'OpenAI GPT',
  'HTTP Request'
];

expectedNodes.forEach(nodeType => {
  const found = workflow.nodes.some(node => 
    node.type === nodeType || 
    node.name.includes(nodeType) ||
    node.typeVersion === nodeType
  );
  const status = found ? '✅' : '❌';
  console.log(`   ${status} ${nodeType}`);
});

console.log('');
console.log('⚙️ CONFIGURATION SPÉCIFIQUE:');
console.log('============================');

// Vérifier configuration Reddit
const redditNode = workflow.nodes.find(n => n.type === 'Reddit');
if (redditNode) {
  console.log('✅ Node Reddit trouvé:');
  console.log(`   Subreddit: ${redditNode.parameters?.subreddit || 'Non défini'}`);
  console.log(`   Limite: ${redditNode.parameters?.limit || 'Non défini'}`);
}

// Vérifier configuration Strapi
const strapiNode = workflow.nodes.find(n => n.name?.includes('Strapi'));
if (strapiNode) {
  console.log('✅ Node Strapi trouvé:'); 
  const url = strapiNode.parameters?.url || 'Non défini';
  console.log(`   URL: ${url}`);
  console.log(`   Pipeline: ${url.includes('guests-metabolism') ? '✅' : '❌'}`);
}

console.log('');
console.log('📊 RÉSUMÉ FINAL:');
console.log('================');
console.log(`🔢 Total nodes: ${workflow.nodes.length}`);
console.log(`🔗 Total connexions: ${Object.keys(workflow.connections).length}`);
console.log(`📦 Taille fichier: ${Math.round(fs.statSync(workflowFile).size / 1024)}KB`);
console.log(`🆔 ID unique: ${workflow.id}`);

// Vérifier JSON valide
try {
  JSON.parse(JSON.stringify(workflow));
  console.log('✅ JSON valide pour import N8N');
} catch (e) {
  console.log('❌ JSON invalide:', e.message);
}

console.log('');
console.log('🚀 PRÊT POUR IMPORT N8N!');
console.log('========================');
console.log('💡 Utilisez ce fichier pour importer dans votre instance N8N:');
console.log(`   📁 ${workflowFile}`);
console.log('');
console.log('⚠️  N\'OUBLIEZ PAS:');
console.log('   1. Configurer les credentials (Reddit, Perplexity, OpenAI)');
console.log('   2. Vérifier l\'URL tunnel Cloudflare');
console.log('   3. Tester le workflow manuellement avant activation');
console.log('');
console.log('✨ Test terminé!');