#!/usr/bin/env node

/**
 * Script pour créer/récupérer l'auteur par défaut dans Strapi
 * Utilisé par le système N8N pour s'assurer qu'il y a un utilisateur valide
 */

const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const CONFIG = {
  TUNNEL_URL: process.env.CLOUDFLARE_TUNNEL_URL || 'https://proc-improved-cricket-charts.trycloudflare.com',
  STRAPI_TOKEN: process.env.STRAPI_N8N_API_TOKEN || 'a4239ed0a52427929d703538e1c298a37b088db1a2f859c17015d5eb150a64b1b5195d8287184867af8ecb923f3bcfec83cd238f18b9b3f4349fbd885edb243a7349adbe7b2c00f14aa453e12a4e003c8286f1393cb60eebb67635845390575185092c7cb277b17a565c3099c9477487d2f615323dd40226c18471f46d8176af'
};

const strapiClient = axios.create({
  baseURL: CONFIG.TUNNEL_URL,
  headers: {
    'Authorization': `Bearer ${CONFIG.STRAPI_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function initDefaultAuthor() {
  console.log('🔍 Initialisation auteur par défaut...');
  
  try {
    // Chercher l'utilisateur ai-bot
    const searchResponse = await strapiClient.get('/api/users', {
      params: {
        'filters[username][$eq]': 'ai-bot'
      }
    });

    if (searchResponse.data.length > 0) {
      const author = searchResponse.data[0];
      console.log(`✅ Auteur par défaut trouvé: ${author.username} (ID: ${author.id})`);
      return author.id;
    }

    // Créer l'utilisateur s'il n'existe pas
    console.log('📝 Création de l\'auteur par défaut...');
    
    const createResponse = await strapiClient.post('/api/users', {
      username: 'ai-bot',
      email: 'ai-bot@blog.com',
      confirmed: true,
      blocked: false,
      provider: 'local'
    });

    const author = createResponse.data;
    console.log(`✅ Auteur créé: ${author.username} (ID: ${author.id})`);
    return author.id;

  } catch (error) {
    console.error('❌ Erreur initialisation auteur:', error.response?.data || error.message);
    
    // En cas d'erreur, on retourne l'ID 1 par défaut (premier utilisateur admin)
    console.log('⚠️ Utilisation de l\'ID auteur par défaut: 1');
    return 1;
  }
}

async function listAllUsers() {
  try {
    console.log('\n📋 Liste des utilisateurs existants:');
    const response = await strapiClient.get('/api/users');
    
    response.data.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email}) - ID: ${user.id}`);
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Erreur listing utilisateurs:', error.response?.data || error.message);
    return [];
  }
}

// Fonction principale
async function main() {
  console.log('🚀 INITIALISATION AUTEUR PAR DÉFAUT STRAPI');
  console.log('==========================================');
  
  try {
    // Lister les utilisateurs existants
    await listAllUsers();
    
    // Créer/récupérer l'auteur par défaut
    const authorId = await initDefaultAuthor();
    
    console.log('\n📊 RÉSUMÉ:');
    console.log(`   Auteur par défaut ID: ${authorId}`);
    console.log(`   À utiliser dans CONFIG.DEFAULT_AUTHOR_ID`);
    
    // Mettre à jour le fichier de configuration si nécessaire
    const fs = require('fs');
    const configPath = path.join(__dirname, 'n8n-workflow-reproduction.js');
    
    if (fs.existsSync(configPath)) {
      let content = fs.readFileSync(configPath, 'utf8');
      const oldPattern = /DEFAULT_AUTHOR_ID:\s*\d+/;
      const newValue = `DEFAULT_AUTHOR_ID: ${authorId}`;
      
      if (content.match(oldPattern)) {
        content = content.replace(oldPattern, newValue);
        fs.writeFileSync(configPath, content);
        console.log(`✅ Configuration mise à jour avec l'ID auteur: ${authorId}`);
      }
    }
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error.message);
    process.exit(1);
  }
}

// Exécution
if (require.main === module) {
  main();
}

module.exports = { initDefaultAuthor, listAllUsers };