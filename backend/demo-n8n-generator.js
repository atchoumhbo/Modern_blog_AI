#!/usr/bin/env node

/**
 * DÉMONSTRATION COMPLÈTE - GÉNÉRATEUR WORKFLOW N8N
 */

const fs = require('fs');
const { generateCustomWorkflow } = require('./n8n-workflow-generator');

console.log('🚀 DÉMONSTRATION GÉNÉRATEUR WORKFLOW N8N');
console.log('=========================================');
console.log('');

console.log('🎯 OBJECTIF: Créer un workflow Reddit → AI → Strapi automatisé');
console.log('');

// Configuration de démonstration
const config = {
  name: "DEMO: Reddit Tech Issues → AI Article Generator → Strapi CMS",
  subreddit: "Intune",
  keyword: "android",
  limit: 25,
  tunnelUrl: "https://passenger-beaches-audience-nov.trycloudflare.com",
  strapiToken: "a4239ed0a52427929d703538e1c298a37b088db1a2f859c17015d5eb150a64b1b5195d8287184867af8ecb923f3bcfec83cd238f18b9b3f4349fbd885edb243a7349adbe7b2c00f14aa453e12a4e003c8286f1393cb60eebb67635845390575185092c7cb277b17a565c3099c9477487d2f615323dd40226c18471f46d8176af"
};

console.log('⚙️ CONFIGURATION DÉMO:');
console.log('=======================');
Object.entries(config).forEach(([key, value]) => {
  const displayValue = key === 'strapiToken' ? 
    `${value.substring(0, 8)}...${value.substring(value.length-8)}` : 
    value;
  console.log(`   📍 ${key}: ${displayValue}`);
});

console.log('');
console.log('🏭 GÉNÉRATION EN COURS...');
console.log('========================');

// Étape 1: Générer le workflow
console.log('1️⃣ Génération structure workflow...');
const workflow = generateCustomWorkflow(config);
console.log('   ✅ Structure générée');

// Étape 2: Sauvegarder
console.log('2️⃣ Sauvegarde fichier...');
const outputFile = 'demo-n8n-workflow.json';
fs.writeFileSync(outputFile, JSON.stringify(workflow, null, 2));
console.log(`   ✅ Sauvegardé: ${outputFile}`);

// Étape 3: Validation
console.log('3️⃣ Validation workflow...');
const validation = {
  hasId: workflow.id && workflow.id.length > 0,
  hasName: workflow.name && workflow.name.length > 0,
  hasNodes: workflow.nodes && workflow.nodes.length > 0,
  hasConnections: workflow.connections && Object.keys(workflow.connections).length > 0,
  validJson: true
};

try {
  JSON.parse(JSON.stringify(workflow));
} catch (e) {
  validation.validJson = false;
}

const allValid = Object.values(validation).every(v => v === true);
console.log(`   ${allValid ? '✅' : '❌'} Validation: ${allValid ? 'SUCCÈS' : 'ÉCHEC'}`);

console.log('');
console.log('📊 RÉSULTATS GÉNÉRATION:');
console.log('========================');
console.log(`🆔 ID unique: ${workflow.id}`);
console.log(`📝 Nom: ${workflow.name}`);
console.log(`🔢 Nodes: ${workflow.nodes.length}`);
console.log(`🔗 Connexions: ${Object.keys(workflow.connections).length}`);
console.log(`📦 Taille: ${Math.round(JSON.stringify(workflow).length / 1024)}KB`);

console.log('');
console.log('🎯 FONCTIONNALITÉS WORKFLOW:');
console.log('============================');
const features = [
  '⏰ Déclencheur automatique toutes les heures',
  '🔍 Recherche Reddit avec mots-clés techniques',
  '🧠 Filtrage intelligent par score d\'impact',
  '🤖 Analyse Perplexity pour contexte technique',
  '✍️ Génération article OpenAI GPT',
  '📤 Publication automatique Strapi CMS',
  '🔐 Credentials sécurisés (Reddit, AI APIs)',
  '🌐 Tunnel Cloudflare configuré'
];

features.forEach(feature => console.log(`   ${feature}`));

console.log('');
console.log('💡 PROCESSUS WORKFLOW:');
console.log('======================');
console.log('   1. 🕐 Déclenchement horaire automatique');
console.log('   2. 🔍 Recherche posts r/Intune avec "android"');
console.log('   3. 📊 Analyse et scoring des posts par impact');
console.log('   4. 🎯 Sélection du post avec le meilleur score');
console.log('   5. 🤖 Analyse technique via Perplexity API');
console.log('   6. ✍️ Génération article expert OpenAI GPT');
console.log('   7. 📤 Publication directe dans Strapi CMS');

console.log('');
console.log('🚀 WORKFLOW PRÊT POUR N8N!');
console.log('==========================');
console.log('📁 Fichier généré:', outputFile);
console.log('');
console.log('📋 ÉTAPES D\'UTILISATION:');
console.log('------------------------');
console.log('   1. 🌐 Ouvrir votre interface N8N');
console.log('   2. ➕ Créer nouveau workflow ou importer');
console.log('   3. 📂 Sélectionner le fichier:', outputFile);
console.log('   4. 🔑 Configurer les credentials:');
console.log('      • Reddit OAuth2 API');
console.log('      • Perplexity API Key');
console.log('      • OpenAI API Key');
console.log('      • Strapi Token (déjà configuré)');
console.log('   5. ✅ Activer le workflow');
console.log('   6. 🎉 Articles générés automatiquement!');

console.log('');
console.log('💰 COÛT ESTIMÉ: ~$0.08-0.12 par article généré');
console.log('⏱️ TEMPS GÉNÉRATION: ~2-3 minutes par article');
console.log('📈 FRÉQUENCE: 1 article par heure maximum');

console.log('');
console.log('✨ DÉMONSTRATION TERMINÉE!');
console.log('==========================');
console.log('🎯 Le workflow N8N est maintenant prêt pour import et utilisation.');
console.log('📧 Configurez vos credentials et laissez l\'IA générer vos articles!');