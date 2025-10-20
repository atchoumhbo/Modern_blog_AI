export default () => ({
  // Plugin d'internationalisation (intégré dans Strapi v5)
  i18n: {
    enabled: true,
    config: {
      defaultLocale: 'fr',
      locales: ['fr', 'en']
    }
  },

  // Plugin de compression d'images et upload
  upload: {
    enabled: true,
    config: {
      providerOptions: {
        localOptions: {
          maxage: 300000
        }
      },
      sizeLimit: 10 * 1024 * 1024, // 10MB
      breakpoints: {
        xlarge: 1920,
        large: 1000,
        medium: 750,
        small: 500,
        xsmall: 64
      }
    }
  }

  // Plugin Email désactivé pour le moment
  // email: {
  //   enabled: false
  // }
});
