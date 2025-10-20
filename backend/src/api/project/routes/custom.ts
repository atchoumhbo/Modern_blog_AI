/**
 * Routes personnalisées pour les projets
 */

export default {
  routes: [
    {
      method: 'PUT',
      path: '/projects/:id/view',
      handler: 'project.incrementViewCount',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'GET',
      path: '/projects/featured',
      handler: 'project.findFeatured',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'GET',
      path: '/projects/technology/:technology',
      handler: 'project.findByTechnology',
      config: {
        policies: [],
        middlewares: []
      }
    }
  ]
};