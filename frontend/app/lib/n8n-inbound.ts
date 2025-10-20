/**
 * Service API pour recevoir et traiter les données N8N
 * Endpoint pour les webhooks entrants de N8N vers notre frontend
 */

import { apiClient } from './api-client';
import { N8N_VALIDATION, N8N_PERMISSIONS } from './n8n-config';
import type { Post, Project } from './types';

// Types pour les données N8N
interface N8NArticleData {
  title: string;
  slug?: string;
  excerpt?: string;
  body: string;
  date?: string;
  categorySlug?: string;
  tagSlugs?: string[];
  authorEmail?: string;
  featuredImageUrl?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  publishNow?: boolean;
}

interface N8NProjectData {
  title: string;
  slug?: string;
  description: string;
  content?: string;
  status?: 'active' | 'completed' | 'archived' | 'on-hold';
  categorySlug?: string;
  technologySlugs?: string[];
  featuredImageUrl?: string;
  galleryUrls?: string[];
  demoUrl?: string;
  githubUrl?: string;
  publishNow?: boolean;
}

interface N8NWebhookPayload {
  type: 'article' | 'project';
  action: 'create' | 'update' | 'delete';
  data: N8NArticleData | N8NProjectData;
  metadata?: {
    source?: string;
    timestamp?: string;
    userId?: string;
    workflowId?: string;
  };
}

/**
 * Service pour gérer les webhooks N8N entrants
 */
export class N8NInboundService {
  
  /**
   * Traite un webhook entrant de N8N
   */
  async processWebhook(payload: N8NWebhookPayload): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Validation du payload
      const validationResult = this.validatePayload(payload);
      if (!validationResult.isValid) {
        return { success: false, error: validationResult.error };
      }

      // Traitement selon le type et l'action
      switch (payload.type) {
        case 'article':
          return await this.processArticleWebhook(payload as N8NWebhookPayload & { data: N8NArticleData });
          
        case 'project':
          return await this.processProjectWebhook(payload as N8NWebhookPayload & { data: N8NProjectData });
          
        default:
          return { success: false, error: `Type non supporté: ${payload.type}` };
      }
    } catch (error) {
      console.error('Erreur traitement webhook N8N:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
  }

  /**
   * Traite un webhook d'article
   */
  private async processArticleWebhook(payload: N8NWebhookPayload & { data: N8NArticleData }): Promise<{ success: boolean; data?: any; error?: string }> {
    const { action, data } = payload;

    try {
      switch (action) {
        case 'create':
          return await this.createArticleFromN8N(data);
          
        case 'update':
          return await this.updateArticleFromN8N(data);
          
        case 'delete':
          return await this.deleteArticleFromN8N(data);
          
        default:
          return { success: false, error: `Action non supportée: ${action}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erreur traitement article' };
    }
  }

  /**
   * Traite un webhook de projet
   */
  private async processProjectWebhook(payload: N8NWebhookPayload & { data: N8NProjectData }): Promise<{ success: boolean; data?: any; error?: string }> {
    const { action, data } = payload;

    try {
      switch (action) {
        case 'create':
          return await this.createProjectFromN8N(data);
          
        case 'update':
          return await this.updateProjectFromN8N(data);
          
        case 'delete':
          return await this.deleteProjectFromN8N(data);
          
        default:
          return { success: false, error: `Action non supportée: ${action}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erreur traitement projet' };
    }
  }

  /**
   * Crée un article depuis N8N
   */
  private async createArticleFromN8N(data: N8NArticleData) {
    // Résolution des relations (catégorie, tags, auteur)
    const relations = await this.resolveArticleRelations(data);
    
    // Traitement de l'image
    const featuredImage = data.featuredImageUrl 
      ? await this.uploadImageFromUrl(data.featuredImageUrl)
      : null;

    // Génération automatique du slug si manquant
    const slug = data.slug || this.generateSlug(data.title);

    // Construction de l'objet article
    const articleData = {
      title: data.title,
      slug,
      excerpt: data.excerpt,
      body: data.body,
      date: data.date ? new Date(data.date) : new Date(),
      featuredImage: featuredImage?.id,
      category: relations.category?.id,
      tags: relations.tags?.map(tag => tag.id),
      author: relations.author?.id,
      seo: data.seo,
      publishedAt: data.publishNow ? new Date() : null
    };

    // Création via API Strapi
    const response = await apiClient.post('/articles', { data: articleData });
    
    return { success: true, data: response.data };
  }

  /**
   * Crée un projet depuis N8N
   */
  private async createProjectFromN8N(data: N8NProjectData) {
    // Résolution des relations
    const relations = await this.resolveProjectRelations(data);
    
    // Traitement des images
    const featuredImage = data.featuredImageUrl 
      ? await this.uploadImageFromUrl(data.featuredImageUrl)
      : null;
      
    const gallery = data.galleryUrls 
      ? await Promise.all(data.galleryUrls.map(url => this.uploadImageFromUrl(url)))
      : [];

    const slug = data.slug || this.generateSlug(data.title);

    const projectData = {
      title: data.title,
      slug,
      description: data.description,
      content: data.content,
      status: data.status || 'active',
      featuredImage: featuredImage?.id,
      gallery: gallery.filter(img => img).map(img => img!.id),
      category: relations.category?.id,
      technologies: relations.technologies?.map(tech => tech.id),
      demoUrl: data.demoUrl,
      githubUrl: data.githubUrl,
      publishedAt: data.publishNow ? new Date() : null
    };

    const response = await apiClient.post('/projects', { data: projectData });
    
    return { success: true, data: response.data };
  }

  /**
   * Résout les relations pour un article (catégorie, tags, auteur)
   */
  private async resolveArticleRelations(data: N8NArticleData) {
    const relations: any = {};

    // Résolution catégorie
    if (data.categorySlug) {
      const categories = await apiClient.get('/categories', {
        params: { 'filters[slug][$eq]': data.categorySlug }
      });
      relations.category = categories.data.data?.[0];
    }

    // Résolution tags
    if (data.tagSlugs && data.tagSlugs.length > 0) {
      const tags = await apiClient.get('/tags', {
        params: { 'filters[slug][$in]': data.tagSlugs }
      });
      relations.tags = tags.data.data;
    }

    // Résolution auteur
    if (data.authorEmail) {
      const authors = await apiClient.get('/authors', {
        params: { 'filters[email][$eq]': data.authorEmail }
      });
      relations.author = authors.data.data?.[0];
    }

    return relations;
  }

  /**
   * Résout les relations pour un projet
   */
  private async resolveProjectRelations(data: N8NProjectData) {
    const relations: any = {};

    // Résolution catégorie
    if (data.categorySlug) {
      const categories = await apiClient.get('/categories', {
        params: { 'filters[slug][$eq]': data.categorySlug }
      });
      relations.category = categories.data.data?.[0];
    }

    // Résolution technologies
    if (data.technologySlugs && data.technologySlugs.length > 0) {
      const technologies = await apiClient.get('/technologies', {
        params: { 'filters[slug][$in]': data.technologySlugs }
      });
      relations.technologies = technologies.data.data;
    }

    return relations;
  }

  /**
   * Upload une image depuis une URL
   */
  private async uploadImageFromUrl(imageUrl: string) {
    try {
      // Télécharge l'image
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      
      // Crée un FormData pour l'upload
      const formData = new FormData();
      formData.append('files', imageBlob, this.extractFilenameFromUrl(imageUrl));
      
      // Upload vers Strapi
      const uploadResponse = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return uploadResponse.data[0];
    } catch (error) {
      console.error('Erreur upload image:', error);
      return null;
    }
  }

  /**
   * Génère un slug depuis un titre
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  /**
   * Extrait le nom de fichier depuis une URL
   */
  private extractFilenameFromUrl(url: string): string {
    const pathname = new URL(url).pathname;
    return pathname.split('/').pop() || 'image.jpg';
  }

  /**
   * Valide le payload N8N
   */
  private validatePayload(payload: N8NWebhookPayload): { isValid: boolean; error?: string } {
    // Validation basique
    if (!payload.type || !payload.action || !payload.data) {
      return { isValid: false, error: 'Payload incomplet' };
    }

    // Validation selon le type
    const validation = payload.type === 'article' 
      ? N8N_VALIDATION.article 
      : N8N_VALIDATION.project;

    // Vérification champs requis
    for (const field of validation.required) {
      if (!(field in payload.data)) {
        return { isValid: false, error: `Champ requis manquant: ${field}` };
      }
    }

    return { isValid: true };
  }

  /**
   * Méthodes de mise à jour et suppression (à implémenter)
   */
  private async updateArticleFromN8N(data: N8NArticleData) {
    // TODO: Implémenter la mise à jour
    return { success: false, error: 'Mise à jour non implémentée' };
  }

  private async deleteArticleFromN8N(data: N8NArticleData) {
    // TODO: Implémenter la suppression
    return { success: false, error: 'Suppression non implémentée' };
  }

  private async updateProjectFromN8N(data: N8NProjectData) {
    // TODO: Implémenter la mise à jour
    return { success: false, error: 'Mise à jour non implémentée' };
  }

  private async deleteProjectFromN8N(data: N8NProjectData) {
    // TODO: Implémenter la suppression
    return { success: false, error: 'Suppression non implémentée' };
  }
}

// Instance singleton
export const n8nInboundService = new N8NInboundService();

// Export des types pour usage externe
export type { N8NArticleData, N8NProjectData, N8NWebhookPayload };