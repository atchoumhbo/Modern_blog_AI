/**
 * Configuration API pour N8N → Strapi
 * Gestion des tokens et permissions pour l'automation
 */

// Configuration des tokens API N8N
export const N8N_API_CONFIG = {
  // Token API pour N8N (à générer dans l'admin Strapi)
  apiToken: process.env.STRAPI_N8N_API_TOKEN || '',
  
  // URL base Strapi
  strapiUrl: process.env.STRAPI_URL || 'http://localhost:1337',
  
  // Endpoints disponibles pour N8N
  endpoints: {
    articles: '/api/articles',
    projects: '/api/projects',
    categories: '/api/categories',
    tags: '/api/tags',
    upload: '/api/upload/files',
    users: '/api/users',
  },
  
  // Headers requis
  headers: {
    'Authorization': `Bearer ${process.env.STRAPI_N8N_API_TOKEN}`,
    'Content-Type': 'application/json',
  }
} as const;

// Configuration des permissions pour N8N
export const N8N_PERMISSIONS = {
  // Collections que N8N peut modifier
  allowedCollections: [
    'api::article.article',
    'api::project.project', 
    'api::category.category',
    'api::tag.tag'
  ],
  
  // Actions autorisées pour N8N
  allowedActions: [
    'find',
    'findOne', 
    'create',
    'update',
    'delete'
  ],
  
  // Champs que N8N peut modifier
  editableFields: {
    articles: [
      'title',
      'slug', 
      'excerpt',
      'body',
      'date',
      'featuredImage',
      'category',
      'tags',
      'author',
      'seo',
      'publishedAt'
    ],
    projects: [
      'title',
      'slug',
      'description', 
      'content',
      'status',
      'featuredImage',
      'gallery',
      'technologies',
      'category',
      'demoUrl',
      'githubUrl',
      'seo',
      'publishedAt'
    ]
  }
} as const;

// Templates pour N8N workflows
export const N8N_TEMPLATES = {
  // Template pour créer un article
  createArticle: {
    method: 'POST',
    url: '{{STRAPI_URL}}/api/articles',
    headers: {
      'Authorization': 'Bearer {{API_TOKEN}}',
      'Content-Type': 'application/json'
    },
    body: {
      data: {
        title: '{{title}}',
        slug: '{{slug}}',
        excerpt: '{{excerpt}}',
        body: '{{body}}',
        date: '{{date}}',
        category: '{{categoryId}}',
        tags: '{{tagIds}}',
        author: '{{authorId}}',
        publishedAt: '{{publishedAt}}'
      }
    }
  },
  
  // Template pour créer un projet
  createProject: {
    method: 'POST', 
    url: '{{STRAPI_URL}}/api/projects',
    headers: {
      'Authorization': 'Bearer {{API_TOKEN}}',
      'Content-Type': 'application/json'
    },
    body: {
      data: {
        title: '{{title}}',
        slug: '{{slug}}',
        description: '{{description}}',
        content: '{{content}}',
        status: '{{status}}',
        category: '{{categoryId}}',
        technologies: '{{technologyIds}}',
        demoUrl: '{{demoUrl}}',
        githubUrl: '{{githubUrl}}',
        publishedAt: '{{publishedAt}}'
      }
    }
  },
  
  // Template pour upload d'image
  uploadImage: {
    method: 'POST',
    url: '{{STRAPI_URL}}/api/upload',
    headers: {
      'Authorization': 'Bearer {{API_TOKEN}}'
      // Content-Type sera automatique pour multipart/form-data
    },
    body: {
      // FormData avec le fichier
      files: '{{imageFile}}',
      path: '{{uploadPath}}',
      refId: '{{refId}}',
      ref: '{{ref}}',
      field: '{{field}}'
    }
  }
} as const;

// Validation des données pour N8N
export const N8N_VALIDATION = {
  article: {
    required: ['title', 'body'],
    optional: ['slug', 'excerpt', 'date', 'category', 'tags', 'author'],
    validation: {
      title: { minLength: 5, maxLength: 200 },
      slug: { minLength: 3, maxLength: 200, pattern: /^[a-z0-9-]+$/ },
      excerpt: { minLength: 20, maxLength: 500 },
      body: { minLength: 100 }
    }
  },
  
  project: {
    required: ['title', 'description'],
    optional: ['slug', 'content', 'status', 'category', 'technologies', 'demoUrl', 'githubUrl'],
    validation: {
      title: { minLength: 5, maxLength: 200 },
      slug: { minLength: 3, maxLength: 200, pattern: /^[a-z0-9-]+$/ },
      description: { minLength: 20, maxLength: 1000 },
      status: { enum: ['active', 'completed', 'archived', 'on-hold'] }
    }
  }
} as const;

export default {
  N8N_API_CONFIG,
  N8N_PERMISSIONS,
  N8N_TEMPLATES,
  N8N_VALIDATION
};