/**
 * article controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::article.article', ({ strapi }) => ({
  
  // Méthode personnalisée pour mettre à jour le nombre de vues
  async incrementViewCount(ctx) {
    const { id } = ctx.params;
    
    try {
      const article = await strapi.entityService.findOne('api::article.article', id);
      
      if (!article) {
        return ctx.notFound('Article non trouvé');
      }
      
      // @ts-ignore - viewCount existe dans le schéma mais pas encore dans les types générés
      const updatedArticle = await strapi.entityService.update('api::article.article', id, {
        data: {
          viewCount: (article.viewCount || 0) + 1
        }
      });
      
      ctx.send({ 
        data: { 
          viewCount: updatedArticle.viewCount 
        } 
      });
      
    } catch (error) {
      ctx.throw(500, 'Erreur lors de la mise à jour du nombre de vues');
    }
  },

  // Méthode pour récupérer les articles populaires
  async findPopular(ctx) {
    try {
      const limit = ctx.query.limit ? parseInt(String(ctx.query.limit)) : 10;
      const articles = await strapi.entityService.findMany('api::article.article', {
        populate: ['category', 'tags', 'author', 'featured_image'],
        sort: { viewCount: 'desc' },
        limit,
        filters: {
          status: 'published'
        }
      });
      
      ctx.send({ data: articles });
      
    } catch (error) {
      ctx.throw(500, 'Erreur lors de la récupération des articles populaires');
    }
  },

  // Override de la méthode find pour inclure automatiquement les relations
  async find(ctx) {
    const { query } = ctx;
    
    const entity = await strapi.entityService.findMany('api::article.article', {
      ...query,
      populate: {
        category: true,
        tags: true,
        author: {
          fields: ['username', 'email']
        },
        featured_image: true,
        seo: true,
        schema: true
      }
    });
    
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  // Override de la méthode findOne pour inclure automatiquement les relations
  async findOne(ctx) {
    const { id } = ctx.params;
    const { query } = ctx;
    
    const entity = await strapi.entityService.findOne('api::article.article', id, {
      ...query,
      populate: {
        category: true,
        tags: true,
        author: {
          fields: ['username', 'email']
        },
        featured_image: true,
        seo: true,
        schema: true
      }
    });
    
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  }
  
}));