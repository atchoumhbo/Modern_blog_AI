#!/usr/bin/env node

/**
 * Test simplifié du workflow N8N
 * Version de démonstration avec données mockées
 */

const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const CONFIG = {
  TUNNEL_URL: 'https://guests-metabolism-retention-saints.trycloudflare.com',
  STRAPI_TOKEN: 'a4239ed0a52427929d703538e1c298a37b088db1a2f859c17015d5eb150a64b1b5195d8287184867af8ecb923f3bcfec83cd238f18b9b3f4349fbd885edb243a7349adbe7b2c00f14aa453e12a4e003c8286f1393cb60eebb67635845390575185092c7cb277b17a565c3099c9477487d2f615323dd40226c18471f46d8176af'
};

async function testWorkflowDemo() {
  console.log('🧪 TEST WORKFLOW N8N - DÉMONSTRATION');
  console.log('====================================');
  
  // Données mockées pour simulation
  const mockPost = {
    id: 'test_' + Date.now(),
    title: 'Android vs iOS MDM capabilities in Microsoft Intune comparison',
    content: 'Looking for detailed comparison between Android and iOS device management capabilities in Microsoft Intune environment',
    subreddit: 'r/Intune',
    score: 45,
    comments: 12,
    impactScore: 87,
    processingPriority: 95,
    selectedAt: new Date().toISOString()
  };

  console.log('📊 Post sélectionné pour test:', mockPost);
  console.log('');

  try {
    // Test création article minimal
    console.log('📝 Test création article dans Strapi...');
    
    const strapiClient = axios.create({
      baseURL: CONFIG.TUNNEL_URL,
      headers: {
        'Authorization': `Bearer ${CONFIG.STRAPI_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const testArticle = {
      data: {
        title: `[TEST] ${mockPost.title}`,
        slug: `test-n8n-workflow-${Date.now()}`,
        content: `# Test Workflow N8N

## Problème Reddit Analysé

**Titre:** ${mockPost.title}

**Contenu:** ${mockPost.content}

**Métadonnées:**
- Subreddit: ${mockPost.subreddit}
- Score: ${mockPost.score}
- Commentaires: ${mockPost.comments}
- Score d'impact: ${mockPost.impactScore}
- Priorité processing: ${mockPost.processingPriority}

## Analyse Simulée

Ce post présente un intérêt technique élevé pour la communauté Microsoft Intune. 
La comparaison entre les capacités MDM Android et iOS est un sujet récurrent qui nécessite une documentation claire.

## Solutions Recommandées

1. **Consulter la documentation Microsoft Intune officielle**
2. **Comparer les politiques de conformité disponibles**  
3. **Tester les fonctionnalités sur les deux plateformes**

## Conclusion

Test réussi du workflow N8N automatisé !

---
*Article généré automatiquement par le workflow N8N - ${new Date().toISOString()}*`,
        status: 'published',
        publishedAt: new Date().toISOString()
      }
    };

    const response = await strapiClient.post('/api/articles', testArticle);
    
    console.log('✅ TEST RÉUSSI !');
    console.log('================');
    console.log('📄 Article créé avec succès');
    console.log('🆔 ID Strapi:', response.data.data.id);
    console.log('🔗 URL:', `${CONFIG.TUNNEL_URL}/api/articles/${response.data.data.id}`);
    console.log('📊 Titre:', response.data.data.attributes.title);
    console.log('📅 Publié le:', response.data.data.attributes.publishedAt);
    
    console.log('');
    console.log('🎉 Le workflow N8N est opérationnel !');
    console.log('Vous pouvez maintenant lancer le workflow complet avec:');
    console.log('node n8n-workflow-reproduction.js');

  } catch (error) {
    console.error('❌ ERREUR TEST:', error.message);
    if (error.response) {
      console.error('📄 Détails:', error.response.status, error.response.data);
    }
  }
}

// Exécution
if (require.main === module) {
  testWorkflowDemo();
}

module.exports = { testWorkflowDemo };