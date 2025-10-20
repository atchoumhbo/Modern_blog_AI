/**
 * Configuration des providers d'images (Stability AI, OpenAI, etc.)
 */

const PROVIDERS_CONFIG = {
  DEFAULT_PROVIDER: process.env.IMAGE_PROVIDER || 'stability-ai',
  
  PROVIDERS: {
    'stability-ai': {
      name: 'Stability AI SD3',
      baseURL: 'https://api.stability.ai',
      endpoint: '/v2beta/stable-image/generate/sd3',
      apiKey: process.env.STABILITY_API_KEY,
      costPerImage: 0.003, // 3 crédits ≈ $0.003
      maxRetries: 3,
      timeout: 60000, // 60 secondes
      rateLimit: {
        maxRequests: 10,
        timeWindow: 60000 // 10 req/min
      },
      supportedAspectRatios: [
        '16:9', '1:1', '21:9', '2:3', '3:2', 
        '4:5', '5:4', '9:16', '9:21'
      ],
      supportedFormats: ['jpeg', 'png', 'webp'],
      supportedStyles: [
        '3d-model', 'analog-film', 'anime', 'cinematic', 'comic-book', 
        'digital-art', 'enhance', 'fantasy-art', 'isometric', 'line-art',
        'low-poly', 'modeling-compound', 'neon-punk', 'origami', 
        'photographic', 'pixel-art', 'tile-texture'
      ],
      defaultOptions: {
        aspectRatio: '16:9',
        outputFormat: 'png',
        model: 'sd3-large-turbo',
        negativePrompt: 'text, words, letters, watermark, signature, blurry, low quality, distorted, ugly, deformed'
      }
    },

    'openai-dalle': {
      name: 'OpenAI DALL-E 3',
      baseURL: 'https://api.openai.com/v1',
      endpoint: '/images/generations',
      apiKey: process.env.OPENAI_API_KEY,
      costPerImage: 0.04, // $0.04 par image
      maxRetries: 3,
      timeout: 60000,
      rateLimit: {
        maxRequests: 5,
        timeWindow: 60000 // 5 req/min
      },
      supportedSizes: ['1024x1024', '1792x1024', '1024x1792'],
      supportedQualities: ['standard', 'hd'],
      supportedStyles: ['vivid', 'natural'],
      defaultOptions: {
        size: '1792x1024',
        quality: 'standard',
        style: 'vivid',
        model: 'dall-e-3'
      }
    }
  },

  /**
   * Valider les options selon le provider
   */
  validateOptions(provider, options) {
    const config = this.PROVIDERS[provider];
    if (!config) {
      throw new Error(`Provider inconnu: ${provider}`);
    }

    const errors = [];

    // Validation selon le provider
    if (provider === 'stability-ai') {
      if (options.aspectRatio && !config.supportedAspectRatios.includes(options.aspectRatio)) {
        errors.push(`Aspect ratio non supporté: ${options.aspectRatio}`);
      }
      if (options.outputFormat && !config.supportedFormats.includes(options.outputFormat)) {
        errors.push(`Format non supporté: ${options.outputFormat}`);
      }
      if (options.style && !config.supportedStyles.includes(options.style)) {
        errors.push(`Style non supporté: ${options.style}`);
      }
    } else if (provider === 'openai-dalle') {
      if (options.size && !config.supportedSizes.includes(options.size)) {
        errors.push(`Taille non supportée: ${options.size}`);
      }
      if (options.quality && !config.supportedQualities.includes(options.quality)) {
        errors.push(`Qualité non supportée: ${options.quality}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Options invalides:\n${errors.map(e => `  - ${e}`).join('\n')}`);
    }

    return true;
  },

  /**
   * Obtenir les options par défaut avec override
   */
  getOptions(provider, customOptions = {}) {
    const config = this.PROVIDERS[provider];
    if (!config) {
      throw new Error(`Provider inconnu: ${provider}`);
    }

    return {
      ...config.defaultOptions,
      ...customOptions
    };
  }
};

module.exports = PROVIDERS_CONFIG;
