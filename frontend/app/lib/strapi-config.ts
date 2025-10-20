/**
 * Configuration des permissions et rôles pour Strapi
 */

// Configuration des rôles utilisateur
export const STRAPI_ROLES = {
  PUBLIC: 'public',
  AUTHENTICATED: 'authenticated',
  ADMIN: 'admin',
  EDITOR: 'editor',
  AUTHOR: 'author',
} as const;

// Configuration des permissions par collection
export const STRAPI_PERMISSIONS = {
  articles: {
    [STRAPI_ROLES.PUBLIC]: ['find', 'findOne'],
    [STRAPI_ROLES.AUTHENTICATED]: ['find', 'findOne'],
    [STRAPI_ROLES.AUTHOR]: ['find', 'findOne', 'create', 'update'],
    [STRAPI_ROLES.EDITOR]: ['find', 'findOne', 'create', 'update', 'delete'],
    [STRAPI_ROLES.ADMIN]: ['find', 'findOne', 'create', 'update', 'delete'],
  },
  projects: {
    [STRAPI_ROLES.PUBLIC]: ['find', 'findOne'],
    [STRAPI_ROLES.AUTHENTICATED]: ['find', 'findOne'],
    [STRAPI_ROLES.AUTHOR]: ['find', 'findOne', 'create', 'update'],
    [STRAPI_ROLES.EDITOR]: ['find', 'findOne', 'create', 'update', 'delete'],
    [STRAPI_ROLES.ADMIN]: ['find', 'findOne', 'create', 'update', 'delete'],
  },
  categories: {
    [STRAPI_ROLES.PUBLIC]: ['find', 'findOne'],
    [STRAPI_ROLES.AUTHENTICATED]: ['find', 'findOne'],
    [STRAPI_ROLES.AUTHOR]: ['find', 'findOne'],
    [STRAPI_ROLES.EDITOR]: ['find', 'findOne', 'create', 'update', 'delete'],
    [STRAPI_ROLES.ADMIN]: ['find', 'findOne', 'create', 'update', 'delete'],
  },
  tags: {
    [STRAPI_ROLES.PUBLIC]: ['find', 'findOne'],
    [STRAPI_ROLES.AUTHENTICATED]: ['find', 'findOne'],
    [STRAPI_ROLES.AUTHOR]: ['find', 'findOne'],
    [STRAPI_ROLES.EDITOR]: ['find', 'findOne', 'create', 'update', 'delete'],
    [STRAPI_ROLES.ADMIN]: ['find', 'findOne', 'create', 'update', 'delete'],
  },
  'upload.upload': {
    [STRAPI_ROLES.PUBLIC]: [],
    [STRAPI_ROLES.AUTHENTICATED]: ['upload'],
    [STRAPI_ROLES.AUTHOR]: ['upload'],
    [STRAPI_ROLES.EDITOR]: ['upload', 'destroy'],
    [STRAPI_ROLES.ADMIN]: ['upload', 'destroy'],
  },
} as const;

// Configuration des webhooks N8N
export const N8N_WEBHOOKS = {
  ARTICLE_CREATED: 'article-created',
  ARTICLE_UPDATED: 'article-updated',
  ARTICLE_DELETED: 'article-deleted',
  PROJECT_CREATED: 'project-created',
  PROJECT_UPDATED: 'project-updated',
  PROJECT_DELETED: 'project-deleted',
  USER_REGISTERED: 'user-registered',
  CONTACT_FORM: 'contact-form',
} as const;

// Configuration des endpoints API
export const STRAPI_ENDPOINTS = {
  articles: '/api/articles',
  projects: '/api/projects',
  categories: '/api/categories',
  tags: '/api/tags',
  authors: '/api/authors',
  upload: '/api/upload',
  auth: {
    register: '/api/auth/local/register',
    login: '/api/auth/local',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
    changePassword: '/api/auth/change-password',
    me: '/api/users/me',
  },
  webhooks: '/api/webhooks',
} as const;

// Configuration des relations et population
export const STRAPI_POPULATE = {
  articles: {
    full: {
      featuredImage: { populate: '*' },
      category: { populate: '*' },
      tags: { populate: '*' },
      author: { 
        populate: {
          avatar: { populate: '*' },
          socialLinks: { populate: '*' }
        }
      },
      seo: { populate: '*' },
      blocks: { populate: '*' }
    },
    preview: {
      featuredImage: { populate: '*' },
      category: { populate: '*' },
      author: { 
        populate: {
          avatar: { populate: '*' }
        }
      }
    },
    minimal: {
      featuredImage: { fields: ['url', 'alternativeText'] },
      category: { fields: ['name', 'slug'] }
    }
  },
  projects: {
    full: {
      featuredImage: { populate: '*' },
      gallery: { populate: '*' },
      technologies: { populate: '*' },
      category: { populate: '*' },
      links: { populate: '*' },
      seo: { populate: '*' }
    },
    preview: {
      featuredImage: { populate: '*' },
      technologies: { populate: '*' },
      category: { populate: '*' }
    },
    minimal: {
      featuredImage: { fields: ['url', 'alternativeText'] },
      category: { fields: ['name', 'slug'] }
    }
  }
} as const;

// Configuration des filtres et tri par défaut
export const STRAPI_DEFAULTS = {
  pagination: {
    page: 1,
    pageSize: 25,
    withCount: true
  },
  sort: {
    articles: ['date:desc'],
    projects: ['createdAt:desc'],
    categories: ['name:asc'],
    tags: ['name:asc']
  },
  filters: {
    published: {
      publishedAt: { $notNull: true }
    },
    draft: {
      publishedAt: { $null: true }
    }
  }
} as const;

// Configuration de cache
export const STRAPI_CACHE = {
  staleTime: {
    short: 5 * 60 * 1000,    // 5 minutes
    medium: 15 * 60 * 1000,  // 15 minutes
    long: 30 * 60 * 1000,    // 30 minutes
    static: 60 * 60 * 1000,  // 1 heure
  },
  gcTime: {
    short: 10 * 60 * 1000,   // 10 minutes
    medium: 30 * 60 * 1000,  // 30 minutes
    long: 60 * 60 * 1000,    // 1 heure
    static: 2 * 60 * 60 * 1000, // 2 heures
  }
} as const;

// Configuration des limites
export const STRAPI_LIMITS = {
  maxPageSize: 100,
  defaultPageSize: 25,
  maxUploadSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  allowedDocumentTypes: ['application/pdf', 'text/plain', 'application/msword'],
} as const;

// Configuration des validations
export const STRAPI_VALIDATION = {
  article: {
    title: { min: 5, max: 200 },
    slug: { min: 3, max: 200 },
    excerpt: { min: 50, max: 500 },
    body: { min: 100 }
  },
  project: {
    title: { min: 5, max: 200 },
    slug: { min: 3, max: 200 },
    description: { min: 50, max: 1000 }
  },
  category: {
    name: { min: 2, max: 100 },
    slug: { min: 2, max: 100 }
  },
  tag: {
    name: { min: 2, max: 50 },
    slug: { min: 2, max: 50 }
  }
} as const;

// Configuration des statuts
export const STRAPI_STATUS = {
  article: {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived'
  },
  project: {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    ARCHIVED: 'archived',
    ON_HOLD: 'on-hold'
  }
} as const;

// Export de toute la configuration
export const STRAPI_CONFIG = {
  ROLES: STRAPI_ROLES,
  PERMISSIONS: STRAPI_PERMISSIONS,
  WEBHOOKS: N8N_WEBHOOKS,
  ENDPOINTS: STRAPI_ENDPOINTS,
  POPULATE: STRAPI_POPULATE,
  DEFAULTS: STRAPI_DEFAULTS,
  CACHE: STRAPI_CACHE,
  LIMITS: STRAPI_LIMITS,
  VALIDATION: STRAPI_VALIDATION,
  STATUS: STRAPI_STATUS,
} as const;