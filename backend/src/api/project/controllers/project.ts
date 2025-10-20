/**
 * project controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::project.project', ({ strapi }) => ({
  
  // Méthode personnalisée pour mettre à jour le nombre de vues
  async incrementViewCount(ctx) {
    const { id } = ctx.params;
    
    try {
      const project = await strapi.entityService.findOne('api::project.project', id);
      
      if (!project) {
        return ctx.notFound('Projet non trouvé');
      }
      
      // @ts-ignore - viewCount existe dans le schéma mais pas encore dans les types générés
      const updatedProject = await strapi.entityService.update('api::project.project', id, {
        data: {
          viewCount: (project.viewCount || 0) + 1
        }
      });
      
      ctx.send({ 
        data: { 
          viewCount: updatedProject.viewCount 
        } 
      });
      
    } catch (error) {
      ctx.throw(500, 'Erreur lors de la mise à jour du nombre de vues');
    }
  },

  // Méthode pour récupérer les projets en vedette
  async findFeatured(ctx) {
    try {
      const projects = await strapi.entityService.findMany('api::project.project', {
        populate: ['category', 'tags', 'author', 'featured_image', 'gallery'],
        sort: { priority: 'desc' },
        filters: {
          featured: true,
          status: 'completed'
        }
      });
      
      ctx.send({ data: projects });
      
    } catch (error) {
      ctx.throw(500, 'Erreur lors de la récupération des projets en vedette');
    }
  },

  // Méthode pour récupérer les projets par technologie
  async findByTechnology(ctx) {
    const { technology } = ctx.params;
    
    try {
      const projects = await strapi.entityService.findMany('api::project.project', {
        populate: ['category', 'tags', 'author', 'featured_image'],
        filters: {
          technologies: {
            $contains: technology
          },
          status: 'completed'
        },
        sort: { priority: 'desc' }
      });
      
      ctx.send({ data: projects });
      
    } catch (error) {
      ctx.throw(500, 'Erreur lors de la récupération des projets par technologie');
    }
  },

  // Override de la méthode find pour inclure automatiquement les relations
  async find(ctx) {
    const { query } = ctx;
    
    const entity = await strapi.entityService.findMany('api::project.project', {
      ...query,
      populate: {
        category: true,
        tags: true,
        author: {
          fields: ['username', 'email']
        },
        featured_image: true,
        gallery: true,
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
    
    const entity = await strapi.entityService.findOne('api::project.project', id, {
      ...query,
      populate: {
        category: true,
        tags: true,
        author: {
          fields: ['username', 'email']
        },
        featured_image: true,
        gallery: true,
        seo: true,
        schema: true
      }
    });
    
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  }
  
}));