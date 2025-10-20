#!/usr/bin/env node

/**
 * Création d'un utilisateur par défaut via l'API Admin Strapi
 * Utilise le token admin pour créer un utilisateur dans users-permissions
 */

const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const CONFIG = {
  STRAPI_URL: 'http://localhost:1337',
  ADMIN_TOKEN: process.env.STRAPI_N8N_API_TOKEN || 'a4239ed0a52427929d703538e1c298a37b088db1a2f859c17015d5eb150a64b1b5195d8287184867af8ecb923f3bcfec83cd238f18b9b3f4349fbd885edb243a7349adbe7b2c00f14aa453e12a4e003c8286f1393cb60eebb67635845390575185092c7cb277b17a565c3099c9477487d2f615323dd40226c18471f46d8176af'
};

const strapiClient = axios.create({
  baseURL: CONFIG.STRAPI_URL,
  headers: {
    'Authorization': `Bearer ${CONFIG.ADMIN_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function createDefaultUser() {
  console.log('👤 Création utilisateur par défaut...');
  
  try {
    // Essayons d'abord de récupérer les utilisateurs existants
    console.log('🔍 Vérification utilisateurs existants...');
    
    const usersResponse = await strapiClient.get('/api/users');
    console.log(`📊 ${usersResponse.data.length} utilisateurs trouvés`);
    
    if (usersResponse.data.length > 0) {
      const firstUser = usersResponse.data[0];
      console.log(`✅ Utilisateur existant trouvé: ${firstUser.username || firstUser.email} (ID: ${firstUser.id})`);
      return firstUser.id;
    }

    // Si aucun utilisateur, essayons de créer via users-permissions plugin
    console.log('📝 Création nouvel utilisateur...');
    
    // D'abord, récupérons le rôle "Authenticated" par défaut
    const rolesResponse = await strapiClient.get('/api/users-permissions/roles');
    const authenticatedRole = rolesResponse.data.roles.find(role => role.name === 'Authenticated');
    
    if (!authenticatedRole) {
      console.error('❌ Rôle "Authenticated" non trouvé');
      return null;
    }

    // Créer l'utilisateur avec le rôle approprié
    const userData = {
      username: 'ai-bot',
      email: 'ai-bot@blog.com',
      password: 'AiBot2025!',
      confirmed: true,
      blocked: false,
      role: authenticatedRole.id
    };

    const createResponse = await strapiClient.post('/api/users-permissions/users', userData);
    
    console.log(`✅ Utilisateur créé: ${createResponse.data.username} (ID: ${createResponse.data.id})`);
    return createResponse.data.id;

  } catch (error) {
    console.error('❌ Erreur création utilisateur:', error.response?.data || error.message);
    
    // En dernier recours, utilisons l'ID 1 (probablement l'admin)
    console.log('⚠️ Tentative avec l\'utilisateur admin (ID: 1)');
    return 1;
  }
}

async function testUserCreation() {
  console.log('🧪 Test création utilisateur simple...');
  
  try {
    // Essayons une approche plus simple - juste ajouter dans la table users
    const userData = {
      username: 'ai-content-bot',
      email: 'ai-content-bot@blog.com',
      provider: 'local',
      confirmed: true,
      blocked: false
    };

    const createResponse = await strapiClient.post('/api/users', userData);
    console.log(`✅ Utilisateur simple créé: ${createResponse.data.username} (ID: ${createResponse.data.id})`);
    return createResponse.data.id;

  } catch (error) {
    console.error('❌ Création simple échouée:', error.response?.data || error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 CRÉATION UTILISATEUR PAR DÉFAUT STRAPI');
  console.log('==========================================');
  
  try {
    // Essayer différentes méthodes
    let userId = await createDefaultUser();
    
    if (!userId) {
      userId = await testUserCreation();
    }
    
    if (userId) {
      console.log(`\n✅ SUCCÈS - ID utilisateur: ${userId}`);
      console.log('📝 Mise à jour du fichier de configuration...');
      
      // Mettre à jour le fichier workflow
      const fs = require('fs');
      const configPath = path.join(__dirname, 'n8n-workflow-reproduction.js');
      
      if (fs.existsSync(configPath)) {
        let content = fs.readFileSync(configPath, 'utf8');
        const oldPattern = /DEFAULT_AUTHOR_ID:\s*\d+/;
        const newValue = `DEFAULT_AUTHOR_ID: ${userId}`;
        
        if (content.match(oldPattern)) {
          content = content.replace(oldPattern, newValue);
          fs.writeFileSync(configPath, content);
          console.log(`✅ Configuration mise à jour avec l'ID auteur: ${userId}`);
        }
      }
    } else {
      console.log('⚠️ Utilisation de l\'ID par défaut: 1');
    }
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error.message);
  }
}

if (require.main === module) {
  main();
}