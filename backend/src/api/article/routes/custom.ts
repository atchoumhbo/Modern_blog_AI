/**
 * Routes personnalisées pour les articles
 */

export default {
  routes: [
    {
      method: 'PUT',
      path: '/articles/:id/view',
      handler: 'article.incrementViewCount',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'GET',
      path: '/articles/popular',
      handler: 'article.findPopular',
      config: {
        policies: [],
        middlewares: []
      }
    }
  ]
};