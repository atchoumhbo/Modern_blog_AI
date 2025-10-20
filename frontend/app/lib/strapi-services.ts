/**
 * Services API spécialisés pour Strapi v5
 * Utilise le client API sécurisé
 */

import { apiClient, strapiHelpers, createQueryKey } from './api-client';
import type { StrapiSuccessResponse } from './api-client';
import type { Post, Project } from './types';

// Re-export des types pour faciliter l'import
export type { StrapiSuccessResponse } from './api-client';
export type { Post, Project } from './types';

// Types pour les paramètres des requêtes
export interface BaseQueryParams {
  page?: number;
  pageSize?: number;
  sort?: string | string[];
  filters?: Record<string, any>;
  populate?: string | Record<string, any>;
  fields?: string[];
  locale?: string;
  publicationState?: 'live' | 'preview';
}

export interface ArticleQueryParams extends BaseQueryParams {
  category?: string;
  tags?: string[];
  author?: string;
  featured?: boolean;
}

/**
 * Service pour les Articles
 */
export const articleService = {
  /**
   * Récupère la liste des articles
   */
  async getArticles(params: ArticleQueryParams = {}): Promise<StrapiSuccessResponse<Post[]>> {
    const queryParams: Record<string, any> = {};

    // Pagination
    if (params.page) queryParams['pagination[page]'] = params.page;
    if (params.pageSize) queryParams['pagination[pageSize]'] = params.pageSize;

    // Tri
    if (params.sort) {
      queryParams.sort = strapiHelpers.buildSort(params.sort);
    }

    // Filtres
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        queryParams[`filters[${key}]`] = value;
      });
    }

    // Filtres spécialisés pour les articles
    if (params.category) {
      queryParams['filters[category][slug][$eq]'] = params.category;
    }

    if (params.tags && params.tags.length > 0) {
      queryParams['filters[tags][slug][$in]'] = params.tags.join(',');
    }

    if (params.featured !== undefined) {
      queryParams['filters[featured][$eq]'] = params.featured;
    }

    // Population par défaut pour les articles
    queryParams.populate = JSON.stringify({
      featuredImage: { populate: '*' },
      category: { populate: '*' },
      tags: { populate: '*' },
      author: { populate: ['avatar'] },
      seo: { populate: '*' }
    });

    return apiClient.get<StrapiSuccessResponse<Post[]>>('/articles', queryParams);
  },

  /**
   * Récupère un article par son slug
   */
  async getArticleBySlug(slug: string): Promise<StrapiSuccessResponse<Post[]>> {
    const params = {
      'filters[slug][$eq]': slug,
      populate: JSON.stringify({
        featuredImage: { populate: '*' },
        category: { populate: '*' },
        tags: { populate: '*' },
        author: { populate: ['avatar'] },
        seo: { populate: '*' }
      })
    };

    return apiClient.get<StrapiSuccessResponse<Post[]>>('/articles', params);
  },

  /**
   * Récupère les articles populaires
   */
  async getPopularArticles(limit: number = 5): Promise<StrapiSuccessResponse<Post[]>> {
    return this.getArticles({
      pageSize: limit,
      sort: ['viewCount:desc', 'date:desc'],
      filters: {
        date: { $notNull: true }
      }
    });
  },

  /**
   * Récupère les articles récents
   */
  async getRecentArticles(limit: number = 5): Promise<StrapiSuccessResponse<Post[]>> {
    return this.getArticles({
      pageSize: limit,
      sort: ['date:desc'],
      filters: {
        date: { $notNull: true }
      }
    });
  },

  /**
   * Recherche d'articles
   */
  async searchArticles(query: string, limit: number = 20): Promise<StrapiSuccessResponse<Post[]>> {
    return this.getArticles({
      pageSize: limit,
      filters: {
        $or: [
          { title: { $containsi: query } },
          { excerpt: { $containsi: query } },
          { body: { $containsi: query } }
        ]
      },
      sort: ['date:desc']
    });
  }
};

/**
 * Service pour les Projets
 */
export const projectService = {
  /**
   * Récupère la liste des projets
   */
  async getProjects(params: BaseQueryParams = {}): Promise<StrapiSuccessResponse<Project[]>> {
    const queryParams: Record<string, any> = {};

    if (params.page) queryParams['pagination[page]'] = params.page;
    if (params.pageSize) queryParams['pagination[pageSize]'] = params.pageSize;

    if (params.sort) {
      queryParams.sort = strapiHelpers.buildSort(params.sort);
    }

    // Population par défaut pour les projets
    queryParams.populate = JSON.stringify({
      featuredImage: { populate: '*' },
      gallery: { populate: '*' },
      technologies: { populate: '*' },
      category: { populate: '*' }
    });

    return apiClient.get<StrapiSuccessResponse<Project[]>>('/projects', queryParams);
  },

  /**
   * Récupère un projet par son slug
   */
  async getProjectBySlug(slug: string): Promise<StrapiSuccessResponse<Project[]>> {
    const params = {
      'filters[slug][$eq]': slug,
      populate: JSON.stringify({
        featuredImage: { populate: '*' },
        gallery: { populate: '*' },
        technologies: { populate: '*' },
        category: { populate: '*' }
      })
    };

    return apiClient.get<StrapiSuccessResponse<Project[]>>('/projects', params);
  },

  /**
   * Récupère les projets récents
   */
  async getRecentProjects(limit: number = 5): Promise<StrapiSuccessResponse<Project[]>> {
    return this.getProjects({
      pageSize: limit,
      sort: ['createdAt:desc']
    });
  },

  /**
   * Récupère les projets par catégorie
   */
  async getProjectsByCategory(categorySlug: string): Promise<StrapiSuccessResponse<Project[]>> {
    return this.getProjects({
      filters: {
        category: { slug: { $eq: categorySlug } }
      }
    });
  },

  /**
   * Récupère les projets par statut
   */
  async getProjectsByStatus(status: string): Promise<StrapiSuccessResponse<Project[]>> {
    return this.getProjects({
      filters: {
        status: { $eq: status }
      }
    });
  },

  /**
   * Récupère les statistiques des projets
   */
  async getProjectsStats(): Promise<{
    total: number;
    active: number;
    completed: number;
    archived: number;
  }> {
    // Récupère tous les projets pour calculer les stats
    const response = await this.getProjects({
      pageSize: 1000,
      fields: ['id', 'status']
    });

    const projects = response.data;
    return {
      total: projects.length,
      active: projects.filter(p => (p as any).status === 'active').length,
      completed: projects.filter(p => (p as any).status === 'completed').length,
      archived: projects.filter(p => (p as any).status === 'archived').length,
    };
  }
};

/**
 * Service pour les webhooks N8N
 */
export const webhookService = {
  /**
   * Déclenche un webhook pour N8N
   */
  async triggerWebhook(event: string, data: any): Promise<void> {
    return apiClient.post(`/webhooks/${event}`, data);
  },

  /**
   * Notification de création d'article pour N8N
   */
  async notifyArticleCreated(article: Post): Promise<void> {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : 'http://localhost:3000';

    return this.triggerWebhook('article-created', {
      id: article.id,
      title: article.title,
      slug: article.slug,
      publishedAt: article.date,
      url: `${baseUrl}/blog/${article.slug}`
    });
  },

  /**
   * Notification de mise à jour d'article pour N8N
   */
  async notifyArticleUpdated(article: Post): Promise<void> {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : 'http://localhost:3000';

    return this.triggerWebhook('article-updated', {
      id: article.id,
      title: article.title,
      slug: article.slug,
      publishedAt: article.date,
      url: `${baseUrl}/blog/${article.slug}`
    });
  }
};

// Export des clés de requête pour TanStack Query
export const queryKeys = {
  articles: {
    all: () => createQueryKey('articles'),
    lists: () => createQueryKey('articles', 'list'),
    list: (params: ArticleQueryParams) => createQueryKey('articles', ['list', params]),
    details: () => createQueryKey('articles', 'detail'),
    detail: (slug: string) => createQueryKey('articles', ['detail', slug]),
    popular: (limit: number) => createQueryKey('articles', ['popular', limit]),
    recent: (limit: number) => createQueryKey('articles', ['recent', limit]),
    search: (query: string) => createQueryKey('articles', ['search', query]),
  },
  projects: {
    all: () => createQueryKey('projects'),
    lists: () => createQueryKey('projects', 'list'),
    list: (params: BaseQueryParams) => createQueryKey('projects', ['list', params]),
    details: () => createQueryKey('projects', 'detail'),
    detail: (slug: string) => createQueryKey('projects', ['detail', slug]),
    recent: (limit: number) => createQueryKey('projects', ['recent', limit]),
    byCategory: (categorySlug: string) => createQueryKey('projects', ['category', categorySlug]),
    byStatus: (status: string) => createQueryKey('projects', ['status', status]),
    stats: () => createQueryKey('projects', 'stats'),
  },
};