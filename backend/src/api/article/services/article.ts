/**
 * article service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::article.article', ({ strapi }) => ({
  
  // Service pour calculer le temps de lecture
  calculateReadingTime(content: string): number {
    const wordsPerMinute = 200; // Moyenne de lecture en français
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  },

  // Service pour générer automatiquement l'excerpt
  generateExcerpt(content: string, maxLength = 160): string {
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    if (plainText.length <= maxLength) return plainText;
    
    return plainText.substring(0, maxLength - 3).trim() + '...';
  },

  // Service pour valider et nettoyer le slug
  async validateSlug(slug: string, id?: number): Promise<string> {
    let finalSlug = slug;
    let counter = 1;
    
    while (true) {
      const existing = await strapi.entityService.findMany('api::article.article', {
        filters: { 
          slug: finalSlug,
          ...(id && { id: { $ne: id } })
        }
      });
      
      if (existing.length === 0) break;
      
      finalSlug = `${slug}-${counter}`;
      counter++;
    }
    
    return finalSlug;
  },

  // Override du service create pour ajouter des fonctionnalités automatiques
  async create(params) {
    const { data } = params;
    
    // Calculer automatiquement le temps de lecture
    if (data.content && !data.readingTime) {
      data.readingTime = this.calculateReadingTime(data.content);
    }
    
    // Générer automatiquement l'excerpt si absent
    if (data.content && !data.excerpt) {
      data.excerpt = this.generateExcerpt(data.content);
    }
    
    // Valider le slug
    if (data.slug) {
      data.slug = await this.validateSlug(data.slug);
    }
    
    // Initialiser les données de schema structuré
    if (!data.schema) {
      data.schema = {
        type: 'Article',
        datePublished: new Date(),
        dateModified: new Date(),
        wordCount: data.content ? data.content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0
      };
    }
    
    return super.create({ ...params, data });
  },

  // Override du service update
  async update(entityId, params) {
    const { data } = params;
    
    // Recalculer le temps de lecture si le contenu a changé
    if (data.content) {
      data.readingTime = this.calculateReadingTime(data.content);
      
      // Mettre à jour les données structurées
      if (!data.schema) {
        data.schema = {};
      }
      data.schema.dateModified = new Date();
      data.schema.wordCount = data.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    }
    
    // Valider le slug si modifié
    if (data.slug) {
      data.slug = await this.validateSlug(data.slug, entityId);
    }
    
    return super.update(entityId, { ...params, data });
  }
  
}));