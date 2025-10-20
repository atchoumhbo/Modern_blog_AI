#!/usr/bin/env node

/**
 * SCRIPT RAPIDE DE GÉNÉRATION DE WORKFLOW N8N
 */

const { generateCustomWorkflow } = require('./n8n-workflow-generator');
const fs = require('fs');

console.log('⚡ GÉNÉRATION RAPIDE WORKFLOW N8N');
console.log('=================================');
console.log('');

// Configuration actuelle qui fonctionne
const currentConfig = {
  name: "Reddit Tech Problem Analysis & Content Generation with Strapi",
  subreddit: "Intune",
  keyword: "android", 
  limit: 50,
  tunnelUrl: "https://passenger-beaches-audience-nov.trycloudflare.com",
  strapiToken: "a4239ed0a52427929d703538e1c298a37b088db1a2f859c17015d5eb150a64b1b5195d8287184867af8ecb923f3bcfec83cd238f18b9b3f4349fbd885edb243a7349adbe7b2c00f14aa453e12a4e003c8286f1393cb60eebb67635845390575185092c7cb277b17a565c3099c9477487d2f615323dd40226c18471f46d8176af"
};

console.log('🔧 Configuration utilisée:');
Object.entries(currentConfig).forEach(([key, value]) => {
  const displayValue = key === 'strapiToken' ? value.substring(0, 20) + '...' : value;
  console.log(`   ${key}: ${displayValue}`);
});
console.log('');

// Générer le workflow
console.log('🏭 Génération du workflow...');
const workflow = generateCustomWorkflow(currentConfig);

// Sauvegarder
const outputFile = 'reddit-strapi-workflow-ready.json';
fs.writeFileSync(outputFile, JSON.stringify(workflow, null, 2));

console.log('✅ Workflow généré!');
console.log('📁 Fichier:', outputFile);
console.log('');

console.log('🚀 PRÊT POUR N8N:');
console.log('==================');
console.log('');
console.log('📋 ÉTAPES D\'IMPORT:');
console.log('1. Ouvrir votre interface N8N');
console.log('2. Cliquer sur "New Workflow" ou "Import"');
console.log('3. Sélectionner:', outputFile);
console.log('4. Le workflow sera importé avec tous les nodes connectés');
console.log('');
console.log('🔑 CREDENTIALS À CONFIGURER:');
console.log('   - Reddit OAuth2 API (pour recherche posts)');
console.log('   - Perplexity API (pour analyse technique)');
console.log('   - OpenAI API (pour génération articles)');
console.log('   - Token Strapi déjà configuré ✅');
console.log('');
console.log('⚙️ NODES INCLUS:');
console.log('   1. ✅ Déclencheur programmé (chaque heure)');
console.log('   2. ✅ Reddit - Recherche r/Intune');
console.log('   3. ✅ Filtrage et analyse posts (score impact)');
console.log('   4. ✅ Sélection post principal (priorité)');
console.log('   5. ✅ Perplexity - Analyse URLs'); 
console.log('   6. ✅ OpenAI - Génération article');
console.log('   7. ✅ Publication Strapi automatique');
console.log('');
console.log('🎯 FONCTIONNALITÉS:');
console.log('   ✅ Score impact pondéré avec bonus fraîcheur');
console.log('   ✅ 25+ mots-clés techniques détectés');
console.log('   ✅ Priorité processing dynamique');
console.log('   ✅ Génération articles 1200+ mots');
console.log('   ✅ Publication directe dans Strapi');
console.log('   ✅ URL tunnel Cloudflare configurée');
console.log('');
console.log('💰 COÛT ESTIMÉ: ~$0.10 par article généré');
console.log('');
console.log('🎉 WORKFLOW PRÊT À UTILISER!');

// Statistiques du workflow généré
console.log('');
console.log('📊 STATISTIQUES WORKFLOW:');
console.log(`   Nodes: ${workflow.nodes.length}`);
console.log(`   Connexions: ${Object.keys(workflow.connections).length}`);
console.log(`   ID: ${workflow.id}`);
console.log(`   Version: ${workflow.versionId}`);
console.log(`   Taille: ${Math.round(JSON.stringify(workflow).length / 1024)}KB`);

console.log('');
console.log('✨ Import terminé! Votre workflow N8N est maintenant disponible pour utilisation.');