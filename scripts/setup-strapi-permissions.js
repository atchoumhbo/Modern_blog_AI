#!/usr/bin/env node

/**
 * Script de configuration automatique des permissions Strapi
 * À exécuter après l'installation de Strapi
 */

const axios = require('axios');
const { STRAPI_CONFIG } = require('../frontend/app/lib/strapi-config');

// Configuration
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const ADMIN_EMAIL = process.env.STRAPI_ADMIN_EMAIL || 'admin@blog.local';
const ADMIN_PASSWORD = process.env.STRAPI_ADMIN_PASSWORD || 'AdminPassword123!';

class StrapiPermissionSetup {
  constructor() {
    this.jwt = null;
    this.client = axios.create({
      baseURL: STRAPI_URL,
      timeout: 10000,
    });
  }

  async authenticate() {
    try {
      console.log('🔐 Authentification admin...');
      const response = await this.client.post('/admin/auth/local', {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      this.jwt = response.data.data.token;
      this.client.defaults.headers.Authorization = `Bearer ${this.jwt}`;
      console.log('✅ Authentification réussie');
    } catch (error) {
      console.error('❌ Erreur d\'authentification:', error.response?.data || error.message);
      throw error;
    }
  }

  async getRoles() {
    try {
      const response = await this.client.get('/admin/users-permissions/roles');
      return response.data.roles;
    } catch (error) {
      console.error('❌ Erreur récupération des rôles:', error.response?.data || error.message);
      throw error;
    }
  }

  async updateRolePermissions(roleId, permissions) {
    try {
      const response = await this.client.put(`/admin/users-permissions/roles/${roleId}`, {
        permissions
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur mise à jour permissions:', error.response?.data || error.message);
      throw error;
    }
  }

  async setupPermissions() {
    console.log('🔧 Configuration des permissions...');
    
    const roles = await this.getRoles();
    const { PERMISSIONS } = STRAPI_CONFIG;

    for (const role of roles) {
      console.log(`📝 Configuration du rôle: ${role.name}`);
      
      const rolePermissions = {};

      // Configure les permissions pour chaque collection
      for (const [collection, collectionPermissions] of Object.entries(PERMISSIONS)) {
        if (collectionPermissions[role.name]) {
          rolePermissions[collection] = {};
          
          for (const action of collectionPermissions[role.name]) {
            rolePermissions[collection][action] = {
              enabled: true,
              policy: ''
            };
          }
        }
      }

      if (Object.keys(rolePermissions).length > 0) {
        await this.updateRolePermissions(role.id, rolePermissions);
        console.log(`✅ Permissions configurées pour ${role.name}`);
      }
    }
  }

  async createWebhookEndpoints() {
    console.log('🎣 Configuration des webhooks...');
    
    const { WEBHOOKS } = STRAPI_CONFIG;
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';

    for (const [event, eventName] of Object.entries(WEBHOOKS)) {
      try {
        const webhook = {
          name: `N8N ${eventName}`,
          url: `${N8N_WEBHOOK_URL}/${eventName}`,
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Source': 'strapi'
          },
          events: [eventName],
          enabled: true
        };

        await this.client.post('/admin/webhooks', webhook);
        console.log(`✅ Webhook créé: ${eventName}`);
      } catch (error) {
        if (error.response?.status === 400) {
          console.log(`⚠️ Webhook déjà existant: ${eventName}`);
        } else {
          console.error(`❌ Erreur création webhook ${eventName}:`, error.response?.data || error.message);
        }
      }
    }
  }

  async createContentTypes() {
    console.log('📋 Vérification des types de contenu...');

    const contentTypes = [
      {
        uid: 'api::article.article',
        displayName: 'Article',
        attributes: {
          title: { type: 'string', required: true },
          slug: { type: 'uid', targetField: 'title', required: true },
          excerpt: { type: 'text' },
          body: { type: 'richtext' },
          date: { type: 'datetime' },
          featuredImage: { type: 'media', multiple: false },
          category: { type: 'relation', relation: 'manyToOne', target: 'api::category.category' },
          tags: { type: 'relation', relation: 'manyToMany', target: 'api::tag.tag' },
          author: { type: 'relation', relation: 'manyToOne', target: 'api::author.author' },
          seo: { type: 'component', component: 'shared.seo', repeatable: false }
        }
      },
      {
        uid: 'api::project.project',
        displayName: 'Project',
        attributes: {
          title: { type: 'string', required: true },
          slug: { type: 'uid', targetField: 'title', required: true },
          description: { type: 'text' },
          content: { type: 'richtext' },
          status: { 
            type: 'enumeration', 
            enum: ['active', 'completed', 'archived', 'on-hold'],
            default: 'active'
          },
          featuredImage: { type: 'media', multiple: false },
          gallery: { type: 'media', multiple: true },
          technologies: { type: 'relation', relation: 'manyToMany', target: 'api::technology.technology' },
          category: { type: 'relation', relation: 'manyToOne', target: 'api::category.category' },
          demoUrl: { type: 'string' },
          githubUrl: { type: 'string' },
          seo: { type: 'component', component: 'shared.seo', repeatable: false }
        }
      }
    ];

    for (const contentType of contentTypes) {
      try {
        await this.client.get(`/content-manager/content-types/${contentType.uid}`);
        console.log(`✅ Type de contenu existant: ${contentType.displayName}`);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`⚠️ Type de contenu manquant: ${contentType.displayName}`);
          console.log('📝 Veuillez créer ce type de contenu manuellement dans l\'admin Strapi');
        }
      }
    }
  }

  async setupDefaultData() {
    console.log('📊 Création des données par défaut...');

    // Catégories par défaut
    const defaultCategories = [
      { name: 'Développement Web', slug: 'developpement-web', description: 'Articles sur le développement web' },
      { name: 'JavaScript', slug: 'javascript', description: 'Articles sur JavaScript et ses frameworks' },
      { name: 'React', slug: 'react', description: 'Articles sur React et l\'écosystème React' },
      { name: 'Node.js', slug: 'nodejs', description: 'Articles sur Node.js et le backend JavaScript' },
      { name: 'DevOps', slug: 'devops', description: 'Articles sur DevOps et l\'automatisation' }
    ];

    for (const category of defaultCategories) {
      try {
        await this.client.post('/api/categories', { data: category });
        console.log(`✅ Catégorie créée: ${category.name}`);
      } catch (error) {
        if (error.response?.status === 400) {
          console.log(`⚠️ Catégorie déjà existante: ${category.name}`);
        } else {
          console.error(`❌ Erreur création catégorie ${category.name}:`, error.response?.data || error.message);
        }
      }
    }

    // Tags par défaut
    const defaultTags = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'MongoDB',
      'PostgreSQL', 'Docker', 'AWS', 'Git', 'Webpack', 'Vite', 'API',
      'REST', 'GraphQL', 'Testing', 'CI/CD', 'Performance', 'Security'
    ];

    for (const tagName of defaultTags) {
      try {
        await this.client.post('/api/tags', { 
          data: { 
            name: tagName, 
            slug: tagName.toLowerCase().replace(/\./g, '-')
          }
        });
        console.log(`✅ Tag créé: ${tagName}`);
      } catch (error) {
        if (error.response?.status === 400) {
          console.log(`⚠️ Tag déjà existant: ${tagName}`);
        }
      }
    }
  }

  async run() {
    try {
      console.log('🚀 Démarrage de la configuration Strapi...');
      console.log(`📍 URL Strapi: ${STRAPI_URL}`);
      
      await this.authenticate();
      await this.createContentTypes();
      await this.setupPermissions();
      await this.createWebhookEndpoints();
      await this.setupDefaultData();
      
      console.log('🎉 Configuration Strapi terminée avec succès!');
    } catch (error) {
      console.error('💥 Erreur lors de la configuration:', error.message);
      process.exit(1);
    }
  }
}

// Exécution du script
if (require.main === module) {
  const setup = new StrapiPermissionSetup();
  setup.run();
}

module.exports = StrapiPermissionSetup;