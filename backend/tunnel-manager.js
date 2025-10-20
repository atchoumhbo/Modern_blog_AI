#!/usr/bin/env node

/**
 * 🌐 GESTIONNAIRE DE TUNNEL CLOUDFLARE POUR N8N
 * Détecte et met à jour automatiquement les URLs de tunnel
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

console.log('🌐 GESTIONNAIRE TUNNEL CLOUDFLARE');
console.log('=================================');
console.log('');

// URLs de test possibles (historique des tunnels utilisés)
const possibleTunnels = [
  'https://passenger-beaches-audience-nov.trycloudflare.com',

];

// Fichiers à mettre à jour avec la nouvelle URL
const filesToUpdate = [
  'n8n-workflow-reproduction.js',
  'generate-n8n-ready.js',
  'test-tunnel.js',
  'reddit-strapi-workflow-ready.json',
  'demo-n8n-workflow.json'
];

async function testTunnelUrl(url) {
  try {
    console.log(`🔍 Test: ${url}`);
    const response = await axios.get(url, {
      timeout: 5000,
      validateStatus: function (status) {
        return status < 500;
      }
    });
    console.log(`   ✅ Accessible (status: ${response.status})`);
    return true;
  } catch (error) {
    console.log(`   ❌ Inaccessible (${error.message})`);
    return false;
  }
}

async function findWorkingTunnel() {
  console.log('🔍 RECHERCHE TUNNEL ACTIF:');
  console.log('==========================');
  
  for (const tunnel of possibleTunnels) {
    const isWorking = await testTunnelUrl(tunnel);
    if (isWorking) {
      console.log(`✅ Tunnel actif trouvé: ${tunnel}`);
      return tunnel;
    }
  }
  
  console.log('❌ Aucun tunnel actif trouvé');
  return null;
}

function updateFileWithNewUrl(filePath, oldUrl, newUrl) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️  Fichier non trouvé: ${filePath}`);
      return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Remplacer toutes les occurrences des anciennes URLs
    let newContent = content;
    possibleTunnels.forEach(oldTunnel => {
      if (oldTunnel !== newUrl && newContent.includes(oldTunnel)) {
        newContent = newContent.replace(new RegExp(oldTunnel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUrl);
        updated = true;
      }
    });
    
    if (updated) {
      fs.writeFileSync(filePath, newContent);
      console.log(`   ✅ Mis à jour: ${filePath}`);
      return true;
    } else {
      console.log(`   ✓ Déjà à jour: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Erreur: ${filePath} - ${error.message}`);
    return false;
  }
}

async function updateAllFiles(newTunnelUrl) {
  console.log('');
  console.log('🔄 MISE À JOUR FICHIERS:');
  console.log('========================');
  
  let updatedCount = 0;
  
  for (const file of filesToUpdate) {
    const updated = updateFileWithNewUrl(file, null, newTunnelUrl);
    if (updated) updatedCount++;
  }
  
  console.log(`✅ ${updatedCount} fichiers mis à jour avec la nouvelle URL`);
  return updatedCount;
}

function createNewTunnelInstructions() {
  console.log('');
  console.log('🚨 AUCUN TUNNEL ACTIF - ACTIONS REQUISES:');
  console.log('=========================================');
  console.log('');
  console.log('📋 ÉTAPES POUR CRÉER UN NOUVEAU TUNNEL:');
  console.log('---------------------------------------');
  console.log('1. 🛑 Arrêter le tunnel actuel (Ctrl+C dans le terminal cloudflared)');
  console.log('2. 🔄 Redémarrer avec:');
  console.log('   cloudflared tunnel --url http://localhost:1337');
  console.log('3. 📋 Copier la nouvelle URL générée (format: https://xxx-xxx-xxx-xxx.trycloudflare.com)');
  console.log('4. 🔧 Relancer ce script avec la nouvelle URL:');
  console.log('   node tunnel-manager.js --update https://nouvelle-url.trycloudflare.com');
  console.log('');
  console.log('💡 Alternative: Utiliser un tunnel permanent avec nom personnalisé');
}

async function manualUpdate(newUrl) {
  console.log(`🔧 MISE À JOUR MANUELLE AVEC: ${newUrl}`);
  console.log('=============================================');
  
  // Valider que l'URL est accessible
  const isWorking = await testTunnelUrl(newUrl);
  if (!isWorking) {
    console.log('❌ URL fournie non accessible. Vérifiez que le tunnel est actif.');
    return false;
  }
  
  // Mettre à jour tous les fichiers
  const updatedCount = await updateAllFiles(newUrl);
  
  console.log('');
  console.log('✅ MISE À JOUR TERMINÉE!');
  console.log('========================');
  console.log(`🌐 Nouvelle URL: ${newUrl}`);
  console.log(`📁 Fichiers mis à jour: ${updatedCount}`);
  console.log('');
  console.log('🚀 Vous pouvez maintenant relancer:');
  console.log('   node run-n8n-workflow.js');
  
  return true;
}

async function main() {
  // Vérifier si une URL manuelle est fournie
  const args = process.argv.slice(2);
  if (args.length >= 2 && args[0] === '--update') {
    const newUrl = args[1];
    await manualUpdate(newUrl);
    return;
  }
  
  // Recherche automatique
  const workingTunnel = await findWorkingTunnel();
  
  if (workingTunnel) {
    console.log('');
    console.log('✅ TUNNEL ACTIF TROUVÉ!');
    console.log('=======================');
    console.log(`🌐 URL: ${workingTunnel}`);
    
    // Mettre à jour les fichiers si nécessaire
    await updateAllFiles(workingTunnel);
    
    console.log('');
    console.log('🚀 Prêt à utiliser! Vous pouvez lancer:');
    console.log('   node run-n8n-workflow.js');
  } else {
    createNewTunnelInstructions();
  }
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
});

main().catch(console.error);