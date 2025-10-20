/**
 * Gestionnaire de providers d'images (Stability AI, OpenAI DALL-E)
 * Gère l'appel aux différentes API avec retry et rate limiting
 */

const axios = require('axios');
const FormData = require('form-data');
const PROVIDERS_CONFIG = require('../config/providers');
const { retryWithBackoff, isRetryableError } = require('../utils/retry');
const { rateLimiterManager } = require('../utils/rate-limiter');
const { logger } = require('../utils/logger');

class ProviderManager {
  constructor() {
    this.config = PROVIDERS_CONFIG;
    this.rateLimiters = this.initializeRateLimiters();
  }

  /**
   * Initialiser les rate limiters pour chaque provider
   */
  initializeRateLimiters() {
    const limiters = {};

    for (const [providerKey, providerConfig] of Object.entries(this.config.PROVIDERS)) {
      if (providerConfig.rateLimit) {
        limiters[providerKey] = rateLimiterManager.getLimiter(
          providerKey,
          providerConfig.rateLimit.maxRequests,
          providerConfig.rateLimit.timeWindow
        );
      }
    }

    return limiters;
  }

  /**
   * Générer une image avec le provider spécifié
   */
  async generateImage(provider, promptData, options = {}) {
    const providerConfig = this.config.PROVIDERS[provider];
    
    if (!providerConfig) {
      throw new Error(`Provider inconnu: ${provider}`);
    }

    if (!providerConfig.apiKey) {
      throw new Error(`Clé API manquante pour ${provider}`);
    }

    logger.info(`Génération avec ${providerConfig.name}`, {
      provider,
      prompt: promptData.prompt.substring(0, 50) + '...'
    });

    // Attendre le rate limiting
    if (this.rateLimiters[provider]) {
      await this.rateLimiters[provider].waitForSlot();
    }

    // Générer selon le provider
    const timer = logger.startTimer(`Génération ${provider}`);
    let result;

    try {
      if (provider === 'stability-ai') {
        result = await this.generateWithStabilityAI(promptData, options);
      } else if (provider === 'openai-dalle') {
        result = await this.generateWithDALLE(promptData, options);
      } else {
        throw new Error(`Provider non supporté: ${provider}`);
      }

      const duration = timer.stop();

      return {
        ...result,
        provider: providerConfig.name,
        generationTime: duration,
        cost: providerConfig.costPerImage
      };

    } catch (error) {
      timer.stop();
      logger.error(`Erreur génération ${provider}`, error);
      throw error;
    }
  }

  /**
   * Générer avec Stability AI SD3
   */
  async generateWithStabilityAI(promptData, options = {}) {
    const config = this.config.PROVIDERS['stability-ai'];
    const mergedOptions = this.config.getOptions('stability-ai', options);

    logger.debug('Options Stability AI', mergedOptions);

    // Préparer le payload selon la doc officielle Stability AI
    const payload = {
      prompt: promptData.prompt,
      negative_prompt: promptData.negativePrompt,
      aspect_ratio: mergedOptions.aspectRatio,
      output_format: mergedOptions.outputFormat,
      model: mergedOptions.model
    };
    
    if (promptData.style) {
      payload.style_preset = promptData.style;
    }

    // Fonction de génération avec retry
    const generate = async () => {
      // Utiliser axios.postForm comme dans la doc officielle
      const response = await axios.postForm(
        `${config.baseURL}${config.endpoint}`,
        axios.toFormData(payload, new FormData()),
        {
          validateStatus: undefined,
          responseType: 'arraybuffer',
          timeout: config.timeout,
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Accept': 'image/*'
          }
        }
      );

      // Vérifier le statut
      if (response.status !== 200) {
        const errorText = Buffer.from(response.data).toString('utf-8');
        throw new Error(`Stability AI error ${response.status}: ${errorText}`);
      }

      return response;
    };

    // Exécuter avec retry sur erreurs network/timeout
    const response = await retryWithBackoff(
      generate,
      config.maxRetries,
      1000,
      'Génération Stability AI'
    );

    return {
      imageBuffer: Buffer.from(response.data),
      format: mergedOptions.outputFormat,
      aspectRatio: mergedOptions.aspectRatio
    };
  }

  /**
   * Générer avec OpenAI DALL-E 3
   */
  async generateWithDALLE(promptData, options = {}) {
    const config = this.config.PROVIDERS['openai-dalle'];
    const mergedOptions = this.config.getOptions('openai-dalle', options);

    logger.debug('Options DALL-E', mergedOptions);

    // Fonction de génération avec retry
    const generate = async () => {
      const response = await axios.post(
        `${config.baseURL}${config.endpoint}`,
        {
          model: mergedOptions.model,
          prompt: promptData.prompt,
          n: 1,
          size: mergedOptions.size,
          quality: mergedOptions.quality,
          style: mergedOptions.style
        },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: config.timeout
        }
      );

      return response;
    };

    // Exécuter avec retry
    const response = await retryWithBackoff(
      generate,
      config.maxRetries,
      1000,
      'Génération DALL-E'
    );

    // DALL-E renvoie une URL, on doit télécharger l'image
    const imageUrl = response.data.data[0].url;
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });

    return {
      imageBuffer: Buffer.from(imageResponse.data),
      format: 'png',
      size: mergedOptions.size,
      imageUrl
    };
  }

  /**
   * Fallback automatique entre providers
   */
  async generateWithFallback(promptData, preferredProvider, options = {}) {
    const providers = [preferredProvider];
    
    // Ajouter un fallback
    if (preferredProvider === 'stability-ai' && this.config.PROVIDERS['openai-dalle'].apiKey) {
      providers.push('openai-dalle');
    } else if (preferredProvider === 'openai-dalle' && this.config.PROVIDERS['stability-ai'].apiKey) {
      providers.push('stability-ai');
    }

    let lastError;

    for (const provider of providers) {
      try {
        logger.info(`Tentative avec ${provider}`);
        return await this.generateImage(provider, promptData, options);
      } catch (error) {
        lastError = error;
        logger.warn(`${provider} a échoué: ${error.message}`);
        
        if (providers.indexOf(provider) < providers.length - 1) {
          logger.info('Basculement vers le provider de fallback...');
        }
      }
    }

    throw lastError;
  }

  /**
   * Vérifier la santé d'un provider
   */
  async healthCheck(provider) {
    const config = this.config.PROVIDERS[provider];
    
    if (!config) {
      return { healthy: false, error: 'Provider inconnu' };
    }

    if (!config.apiKey) {
      return { healthy: false, error: 'Clé API manquante' };
    }

    try {
      // Test simple de l'API
      const response = await axios.get(config.baseURL, {
        timeout: 5000,
        validateStatus: () => true // Accepter toutes les status
      });

      return {
        healthy: response.status < 500,
        status: response.status,
        provider: config.name
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        provider: config.name
      };
    }
  }

  /**
   * Obtenir les stats des rate limiters
   */
  getRateLimitStats() {
    return rateLimiterManager.getAllStats();
  }
}

// Instance globale
const providerManager = new ProviderManager();

module.exports = {
  ProviderManager,
  providerManager
};
