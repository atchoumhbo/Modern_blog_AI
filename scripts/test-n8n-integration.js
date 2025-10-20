#!/usr/bin/env node

/**
 * Script de test pour l'intégration N8N → Strapi
 * Simule des webhooks N8N pour tester la création de contenu
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_N8N_API_TOKEN || '';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';

class N8NStrapiTester {
  constructor() {
    this.client = axios.create({
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Test de connectivité Strapi
   */
  async testStrapiConnection() {
    console.log('🔍 Test de connectivité Strapi...');
    
    try {
      const response = await this.client.get(`${STRAPI_URL}/api/articles?pagination[limit]=1`);
      console.log('✅ Strapi accessible');
      return true;
    } catch (error) {
      console.error('❌ Erreur connexion Strapi:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Test de création d'article via API Strapi directe
   */
  async testDirectArticleCreation() {
    console.log('📝 Test création article directe...');
    
    const articleData = {
      data: {
        title: `Test Article ${Date.now()}`,
        slug: `test-article-${Date.now()}`,
        excerpt: 'Ceci est un article de test créé directement via API Strapi',
        body: '# Article de Test\\n\\nCe contenu a été créé automatiquement pour tester l\'intégration.',
        date: new Date().toISOString(),
        publishedAt: new Date().toISOString()
      }
    };

    try {
      const response = await this.client.post(`${STRAPI_URL}/api/articles`, articleData);
      console.log('✅ Article créé avec succès:', response.data.data.attributes.title);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur création article:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Test de création de projet via API Strapi directe
   */
  async testDirectProjectCreation() {
    console.log('🚀 Test création projet directe...');
    
    const projectData = {
      data: {
        title: `Test Project ${Date.now()}`,
        slug: `test-project-${Date.now()}`,
        description: 'Ceci est un projet de test créé directement via API Strapi',
        content: '# Projet de Test\\n\\nCe projet a été créé automatiquement pour tester l\\'intégration.',
        status: 'active',
        demoUrl: 'https://example.com/demo',
        githubUrl: 'https://github.com/test/project',
        publishedAt: new Date().toISOString()
      }
    };

    try {
      const response = await this.client.post(`${STRAPI_URL}/api/projects`, projectData);
      console.log('✅ Projet créé avec succès:', response.data.data.attributes.title);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur création projet:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Simule un webhook N8N pour créer un article
   */
  async simulateN8NArticleWebhook() {
    console.log('🎣 Simulation webhook N8N pour article...');
    
    const webhookPayload = {
      title: `Article from N8N ${Date.now()}`,
      slug: `article-n8n-${Date.now()}`,
      excerpt: 'Cet article a été créé via un webhook N8N simulé',
      body: '# Article N8N\\n\\nCet article a été créé automatiquement via N8N pour démontrer l\\'intégration.\\n\\n## Fonctionnalités\\n\\n- Création automatique\\n- Gestion des médias\\n- SEO optimisé',
      date: new Date().toISOString(),
      categorySlug: 'developpement-web',
      tagSlugs: ['automation', 'n8n', 'strapi'],
      publishNow: true,
      seo: {
        metaTitle: 'Article créé via N8N',
        metaDescription: 'Démonstration de création d\\'article automatique',
        keywords: ['n8n', 'automation', 'strapi']
      }
    };

    try {
      // Simule l'appel au webhook N8N
      const response = await axios.post(`${N8N_WEBHOOK_URL}/article-webhook`, webhookPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      console.log('✅ Webhook N8N article simulé avec succès');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur simulation webhook N8N:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Simule un webhook N8N pour créer un projet
   */
  async simulateN8NProjectWebhook() {
    console.log('🎣 Simulation webhook N8N pour projet...');
    
    const webhookPayload = {
      title: `Projet from N8N ${Date.now()}`,
      slug: `projet-n8n-${Date.now()}`,
      description: 'Ce projet a été créé via un webhook N8N simulé pour tester l\\'automation',
      content: '# Projet N8N\\n\\nCe projet démontre les capacités d\\'automation avec N8N.\\n\\n## Technologies\\n\\n- N8N pour l\\'automation\\n- Strapi pour le CMS\\n- React pour le frontend',
      status: 'active',
      categorySlug: 'automation',
      technologySlugs: ['n8n', 'strapi', 'react'],
      demoUrl: 'https://demo-n8n.example.com',
      githubUrl: 'https://github.com/example/n8n-project',
      publishNow: true
    };

    try {
      const response = await axios.post(`${N8N_WEBHOOK_URL}/project-webhook`, webhookPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      console.log('✅ Webhook N8N projet simulé avec succès');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur simulation webhook N8N:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Test de récupération des contenus créés
   */
  async testContentRetrieval() {
    console.log('📖 Test récupération contenus...');
    
    try {
      // Articles
      const articles = await this.client.get(`${STRAPI_URL}/api/articles?pagination[limit]=5&sort[0]=createdAt:desc`);
      console.log(`✅ ${articles.data.data.length} articles récupérés`);
      
      // Projets
      const projects = await this.client.get(`${STRAPI_URL}/api/projects?pagination[limit]=5&sort[0]=createdAt:desc`);
      console.log(`✅ ${projects.data.data.length} projets récupérés`);
      
      return { articles: articles.data.data, projects: projects.data.data };
    } catch (error) {
      console.error('❌ Erreur récupération contenus:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Test de nettoyage (suppression des contenus de test)
   */
  async cleanupTestContent() {
    console.log('🧹 Nettoyage des contenus de test...');
    
    try {
      // Récupérer les contenus de test
      const articles = await this.client.get(`${STRAPI_URL}/api/articles?filters[title][$containsi]=Test`);
      const projects = await this.client.get(`${STRAPI_URL}/api/projects?filters[title][$containsi]=Test`);
      
      // Supprimer les articles de test
      for (const article of articles.data.data) {
        await this.client.delete(`${STRAPI_URL}/api/articles/${article.id}`);
        console.log(`🗑️ Article supprimé: ${article.attributes.title}`);
      }
      
      // Supprimer les projets de test
      for (const project of projects.data.data) {
        await this.client.delete(`${STRAPI_URL}/api/projects/${project.id}`);
        console.log(`🗑️ Projet supprimé: ${project.attributes.title}`);
      }
      
      console.log('✅ Nettoyage terminé');
    } catch (error) {
      console.error('❌ Erreur nettoyage:', error.response?.data || error.message);
    }
  }

  /**
   * Génère un rapport de test
   */
  generateTestReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      strapiConnection: results.strapiConnection,
      directArticle: !!results.directArticle,
      directProject: !!results.directProject,
      n8nArticleWebhook: !!results.n8nArticleWebhook,
      n8nProjectWebhook: !!results.n8nProjectWebhook,
      contentRetrieval: !!results.contentRetrieval,
      summary: {
        total: 6,
        passed: Object.values(results).filter(Boolean).length,
        failed: Object.values(results).filter(r => !r).length
      }
    };

    const reportPath = path.join(__dirname, '../test-reports', `n8n-strapi-test-${Date.now()}.json`);
    
    // Créer le dossier s'il n'existe pas
    const reportsDir = path.dirname(reportPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📊 Rapport sauvegardé: ${reportPath}`);
    
    return report;
  }

  /**
   * Exécute tous les tests
   */
  async runAllTests() {
    console.log('🚀 Démarrage des tests N8N → Strapi Integration');
    console.log('================================================');
    
    const results = {};

    // Test 1: Connectivité Strapi
    results.strapiConnection = await this.testStrapiConnection();
    
    if (!results.strapiConnection) {
      console.log('❌ Tests arrêtés - Strapi inaccessible');
      return results;
    }

    // Test 2: Création directe article
    results.directArticle = await this.testDirectArticleCreation();
    
    // Test 3: Création directe projet
    results.directProject = await this.testDirectProjectCreation();
    
    // Test 4: Webhook N8N article
    results.n8nArticleWebhook = await this.simulateN8NArticleWebhook();
    
    // Test 5: Webhook N8N projet
    results.n8nProjectWebhook = await this.simulateN8NProjectWebhook();
    
    // Test 6: Récupération contenus
    results.contentRetrieval = await this.testContentRetrieval();
    
    // Génération du rapport
    const report = this.generateTestReport(results);
    
    console.log('\\n================================================');
    console.log('📊 RÉSULTATS DES TESTS');
    console.log('================================================');
    console.log(`✅ Tests réussis: ${report.summary.passed}/${report.summary.total}`);
    console.log(`❌ Tests échoués: ${report.summary.failed}/${report.summary.total}`);
    
    if (report.summary.passed === report.summary.total) {
      console.log('🎉 Tous les tests sont passés! L\\'intégration N8N → Strapi fonctionne parfaitement.');
    }
    
    // Proposer le nettoyage
    if (process.argv.includes('--cleanup')) {
      await this.cleanupTestContent();
    } else {
      console.log('\\n💡 Utilisez --cleanup pour supprimer les contenus de test');
    }
    
    return results;
  }
}

// Exécution du script
if (require.main === module) {
  const tester = new N8NStrapiTester();
  
  tester.runAllTests().then((results) => {
    const success = Object.values(results).every(Boolean);
    process.exit(success ? 0 : 1);
  }).catch((error) => {
    console.error('💥 Erreur lors des tests:', error);
    process.exit(1);
  });
}

module.exports = N8NStrapiTester;