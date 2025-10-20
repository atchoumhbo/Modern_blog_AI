/**
 * Middleware pour peupler automatiquement les relations communes
 * Compatible Strapi v5
 */

export default (config: any) => {
  return async (ctx: any, next: any) => {
    
    // Configuration par défaut pour populer les relations importantes
    if (!ctx.query.populate) {
      ctx.query.populate = {};
    }

    // Si c'est un article, populer automatiquement les relations SEO
    if (ctx.request.url.includes('/articles')) {
      ctx.query.populate = {
        category: true,
        tags: true,
        author: {
          fields: ['username', 'email']
        },
        featured_image: true,
        seo: true,
        schema: true,
        ...ctx.query.populate
      };
    }

    // Si c'est un projet, populer les relations appropriées
    if (ctx.request.url.includes('/projects')) {
      ctx.query.populate = {
        category: true,
        tags: true,
        author: {
          fields: ['username', 'email']
        },
        featured_image: true,
        gallery: true,
        seo: true,
        schema: true,
        ...ctx.query.populate
      };
    }

    // Si c'est une catégorie, populer le SEO et les relations
    if (ctx.request.url.includes('/categories')) {
      ctx.query.populate = {
        seo: true,
        articles: {
          fields: ['title', 'slug']
        },
        projects: {
          fields: ['title', 'slug']
        },
        ...ctx.query.populate
      };
    }

    await next();
  };
};