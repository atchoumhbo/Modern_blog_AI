#!/usr/bin/env node

/**
 * Script pour configurer automatiquement les permissions Strapi Docker
 * Usage: node setup-docker-permissions.js
 */

const STRAPI_URL = 'http://localhost:1339';

async function setupPermissions() {
  try {
    console.log('🔧 Configuration des permissions Strapi Docker...');
    
    // Test de la connexion
    const healthResponse = await fetch(`${STRAPI_URL}/_health`);
    if (!healthResponse.ok) {
      throw new Error(`Strapi non accessible: ${healthResponse.status}`);
    }
    
    console.log('✅ Strapi accessible');
    
    // Note: Pour automatiser complètement, il faudrait :
    // 1. Créer un compte admin via API
    // 2. Se connecter et obtenir un JWT
    // 3. Utiliser ce JWT pour configurer les permissions
    
    console.log(`
📋 Configuration manuelle requise:

1. Aller sur: ${STRAPI_URL}/admin
2. Se connecter avec le compte admin
3. Aller dans: Settings > Users & Permissions Plugin > Roles
4. Cliquer sur "Public"
5. Autoriser les permissions suivantes:

   📄 Article:
   - ✅ find (Récupérer plusieurs entrées)
   - ✅ findOne (Récupérer une entrée)

   📂 Category:
   - ✅ find (Récupérer plusieurs entrées)
   - ✅ findOne (Récupérer une entrée)

   🏷️ Tag:
   - ✅ find (Récupérer plusieurs entrées) 
   - ✅ findOne (Récupérer une entrée)

   🚀 Project:
   - ✅ find (Récupérer plusieurs entrées)
   - ✅ findOne (Récupérer une entrée)

6. Cliquer sur "Save"

🔄 Puis rafraîchir la page frontend: http://localhost:5173
    `);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n💡 Vérifiez que Strapi Docker fonctionne:');
    console.log('   docker-compose -f docker-compose.dev.yml ps');
  }
}

setupPermissions();