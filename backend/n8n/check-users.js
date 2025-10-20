#!/usr/bin/env node

const axios = require('axios');

const client = axios.create({
  baseURL: 'https://proc-improved-cricket-charts.trycloudflare.com',
  headers: { 
    'Authorization': 'Bearer a4239ed0a52427929d703538e1c298a37b088db1a2f859c17015d5eb150a64b1b5195d8287184867af8ecb923f3bcfec83cd238f18b9b3f4349fbd885edb243a7349adbe7b2c00f14aa453e12a4e003c8286f1393cb60eebb67635845390575185092c7cb277b17a565c3099c9477487d2f615323dd40226c18471f46d8176af',
    'Content-Type': 'application/json'
  }
});

async function checkUsers() {
  try {
    console.log('🔍 Vérification utilisateurs...');
    const response = await client.get('/api/users');
    console.log('👥 Utilisateurs trouvés:', response.data.length);
    
    if (response.data.length > 0) {
      response.data.forEach((user, i) => {
        console.log(`${i+1}. ${user.username || user.email} (ID: ${user.id})`);
      });
      return response.data[0].id; // Retourner le premier utilisateur
    }
    
    // Essayons de créer un utilisateur via users-permissions
    console.log('\n📝 Tentative création utilisateur...');
    const createResponse = await client.post('/api/auth/local/register', {
      username: 'ai-bot',
      email: 'ai-bot@blog.com', 
      password: 'aibot123!'
    });
    
    console.log('✅ Utilisateur créé:', createResponse.data.user.username, 'ID:', createResponse.data.user.id);
    return createResponse.data.user.id;
    
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    return null;
  }
}

checkUsers().then(userId => {
  if (userId) {
    console.log(`\n✅ ID utilisateur à utiliser: ${userId}`);
  }
});