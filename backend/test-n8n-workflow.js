#!/usr/bin/env node

/**
 * Test simplifié du workflow N8N
 * Version de démonstration avec données mockées
 */

const axios = require('axios');
require('dotenv').config();

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

  console.log('✅ Post sélectionné (MOCK):', mockPost.title);
  console.log('   Impact Score:', mockPost.impactScore);
  console.log('   Processing Priority:', mockPost.processingPriority);
  console.log('');

  // Simulation génération d'article
  const mockArticleContent = `# ${mockPost.title}

## Introduction

Microsoft Intune offre des capacités de gestion des appareils mobiles (MDM) et des applications mobiles (MAM) pour les plateformes Android et iOS. Cette analyse compare les fonctionnalités disponibles sur chaque plateforme.

## Capacités Android

### Avantages Android dans Intune
- **Profils de travail Android**: Séparation claire entre données personnelles et professionnelles
- **Samsung Knox**: Sécurité renforcée au niveau hardware
- **Managed Google Play**: Contrôle granulaire des applications
- **Configuration flexible**: Plus d'options de personnalisation

### Fonctionnalités spécifiques Android
1. **Work Profile Management**
   - Conteneur sécurisé pour les données d'entreprise
   - Isolation complète des applications personnelles
   
2. **Knox Platform for Enterprise**
   - Chiffrement hardware
   - Trusted Boot Process
   - FIPS 140-2 Level 1 certification

3. **Advanced App Management**
   - App wrapping automatique
   - Managed app configuration
   - VPN per-app granulaire

## Capacités iOS

### Avantages iOS dans Intune
- **Apple Business Manager (ABM)**: Intégration native
- **Supervised Mode**: Contrôle administratif complet
- **App Store VPP**: Gestion des licences d'applications
- **Configuration simplifiée**: Déploiement uniforme

### Fonctionnalités spécifiques iOS
1. **Device Enrollment Program (DEP)**
   - Inscription automatique des appareils
   - Configuration zero-touch
   
2. **iOS App Management**
   - Volume Purchase Program (VPP)
   - Managed App Configuration
   - App Store privé d'entreprise

## Comparaison Pratique

| Fonctionnalité | Android | iOS |
|----------------|---------|-----|
| Séparation Work/Personal | ✅ Excellent | ⚠️ Limité |
| Gestion des applications | ✅ Très flexible | ✅ Bonne |
| Sécurité hardware | ✅ Knox | ✅ Secure Enclave |
| Configuration | ✅ Très granulaire | ⚠️ Limitée |
| Support à distance | ✅ Complet | ⚠️ Restreint |

## Bonnes Pratiques

### Pour Android
- Utiliser Samsung Knox pour la sécurité maximale
- Implémenter les profils de travail sur tous les appareils
- Configurer VPN per-app pour les applications critiques

### Pour iOS
- Déployer via Apple Business Manager
- Utiliser le mode supervisé pour le contrôle complet
- Implémenter VPP pour la gestion des licences

## Conclusion

Android offre plus de flexibilité et de contrôle granulaire, particulièrement avec Samsung Knox. iOS excelle dans la simplicité de déploiement et l'intégration native Apple Business Manager.

Le choix dépend des besoins spécifiques:
- **Android**: Environnements nécessitant un contrôle granulaire
- **iOS**: Déploiements simples avec gestion centralisée

---
*Article généré par workflow N8N automation - ${new Date().toLocaleDateString('fr-FR')}*`;

  console.log('✅ Article généré (SIMULATION)');
  console.log('   Longueur:', mockArticleContent.length, 'caractères');
  console.log('');

  // Test de publication dans Strapi
  try {
    console.log('🚀 Test publication Strapi...');
    
    const strapiClient = axios.create({
      baseURL: CONFIG.TUNNEL_URL,
      headers: {
        'Authorization': `Bearer ${CONFIG.STRAPI_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const payload = {
      data: {
        title: `[WORKFLOW TEST] ${mockPost.title}`,
        content: mockArticleContent,
        slug: `workflow-test-${mockPost.id}`,
        excerpt: "Test article généré par le workflow N8N reproduction",
        status: "published",
        publishedAt: new Date().toISOString()
      }
    };

    const response = await strapiClient.post('/api/articles', payload);
    
    console.log('✅ SUCCÈS! Article publié dans Strapi');
    console.log('   ID:', response.data.data.id);
    console.log('   Titre:', response.data.data.attributes?.title || payload.data.title);
    console.log('   URL:', `${CONFIG.TUNNEL_URL}/api/articles/${response.data.data.id}`);
    console.log('');
    
    console.log('🎉 TEST WORKFLOW TERMINÉ AVEC SUCCÈS!');
    console.log('===================================');
    console.log('');
    console.log('📋 RÉSULTATS:');
    console.log('   ✅ Données mockées générées');
    console.log('   ✅ Article simulé créé');
    console.log('   ✅ Publication Strapi réussi');
    console.log('   ✅ Tunnel Cloudflare opérationnel');
    console.log('');
    console.log('🚀 PRÊT POUR LE WORKFLOW COMPLET!');
    console.log('   Utiliser: node run-n8n-workflow.js');
    
  } catch (error) {
    console.error('❌ Erreur publication Strapi:', error.response?.data || error.message);
    console.log('');
    console.log('🔧 VÉRIFICATIONS:');
    console.log('   - Tunnel Cloudflare actif?');
    console.log('   - Backend Strapi démarré?');
    console.log('   - Token API valide?');
  }
}

// Exécution
if (require.main === module) {
  testWorkflowDemo();
}

module.exports = { testWorkflowDemo };