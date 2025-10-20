/**
 * Générateur d'Images V2 - Architecture Complète
 * Intègre: Prompts contextuels, Cache, Retry, Rate Limiting, Optimization
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../..', '.env') });

const { promptEngine } = require('./prompt-engine');
const { providerManager } = require('./provider-manager');
const { cacheManager } = require('../utils/cache-manager');
const { imageOptimizer } = require('../utils/image-optimizer');
const { logger } = require('../utils/logger');
const { validateAllInputs, validateEnvironment } = require('../utils/validation');
const PROVIDERS_CONFIG = require('../config/providers');

class ImageGenerator {
  constructor(options = {}) {
    this.outputDir = options.outputDir || path.join(__dirname, '../../../public/uploads/generated-images');
    this.enableCache = options.enableCache !== false; // true par défaut
    this.enableOptimization = options.enableOptimization !== false; // true par défaut
    this.defaultProvider = options.defaultProvider || PROVIDERS_CONFIG.DEFAULT_PROVIDER;
    
    this.ensureOutputDir();
    this.validateEnvironmentVariables();
  }

  /**
   * Valider les variables d'environnement
   */
  validateEnvironmentVariables() {
    const requiredVars = [];

    if (this.defaultProvider === 'stability-ai') {
      requiredVars.push('STABILITY_API_KEY');
    } else if (this.defaultProvider === 'openai-dalle') {
      requiredVars.push('OPENAI_API_KEY');
    }

    try {
      validateEnvironment(requiredVars);
      logger.info('✅ Variables d\'environnement validées');
    } catch (error) {
      logger.warn('⚠️  Variables d\'environnement manquantes:', error.message);
    }
  }

  /**
   * S'assurer que le dossier de sortie existe
   */
  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      logger.info(`📁 Dossier de sortie créé: ${this.outputDir}`);
    }
  }

  /**
   * Générer une image pour un article - MÉTHODE PRINCIPALE
   */
  async generateArticleImage(articleTitle, subreddit = 'programming', options = {}) {
    const timer = logger.startTimer('Génération complète');
    
    try {
      logger.info('\n🚀 ═══════════════════════════════════════════════════════════');
      logger.info(`   GÉNÉRATION D'IMAGE - V2`);
      logger.info(`   Article: "${articleTitle}"`);
      logger.info(`   Subreddit: r/${subreddit}`);
      logger.info('🚀 ═══════════════════════════════════════════════════════════\n');

      // ═══════════════════════════════════════════════════════════
      // ÉTAPE 1: VALIDATION DES INPUTS
      // ═══════════════════════════════════════════════════════════
      logger.logStep(1, 6, 'Validation des inputs');
      
      const provider = options.provider || this.defaultProvider;
      validateAllInputs(articleTitle, subreddit, options, provider);

      // ═══════════════════════════════════════════════════════════
      // ÉTAPE 2: VÉRIFICATION DU CACHE
      // ═══════════════════════════════════════════════════════════
      if (this.enableCache) {
        logger.logStep(2, 6, 'Vérification du cache');
        
        const cacheKey = cacheManager.getCacheKey(articleTitle, subreddit, options);
        
        if (cacheManager.has(cacheKey)) {
          const cachedResult = cacheManager.get(cacheKey);
          logger.success('✅ Image trouvée dans le cache !');
          timer.stop();
          return cachedResult;
        }
        
        logger.info('   Cache miss - génération nécessaire');
      }

      // ═══════════════════════════════════════════════════════════
      // ÉTAPE 3: GÉNÉRATION DU PROMPT CONTEXTUEL
      // ═══════════════════════════════════════════════════════════
      logger.logStep(3, 6, 'Génération du prompt contextuel');
      
      const promptData = promptEngine.generateEnrichedPrompt(
        articleTitle,
        subreddit,
        options.metadata || {}
      );

      // ═══════════════════════════════════════════════════════════
      // ÉTAPE 4: GÉNÉRATION DE L'IMAGE VIA API
      // ═══════════════════════════════════════════════════════════
      logger.logStep(4, 6, `Génération via ${provider}`);
      
      const generationResult = await providerManager.generateImage(
        provider,
        promptData,
        options
      );

      // ═══════════════════════════════════════════════════════════
      // ÉTAPE 5: OPTIMISATION DE L'IMAGE (si activée)
      // ═══════════════════════════════════════════════════════════
      let finalBuffer = generationResult.imageBuffer;
      let optimizationStats = null;

      // Vérifier si l'optimisation est activée (options > config)
      const shouldOptimize = options.enableOptimization !== undefined 
        ? options.enableOptimization 
        : this.enableOptimization;

      if (shouldOptimize) {
        logger.logStep(5, 6, 'Optimisation de l\'image');
        
        // Debug: vérifier le buffer reçu
        logger.debug(`Buffer reçu: ${generationResult.imageBuffer.length} bytes`);
        logger.debug(`Premiers bytes: ${generationResult.imageBuffer.slice(0, 20).toString('hex')}`);
        
        try {
          const optimizationResult = await imageOptimizer.optimize(
            generationResult.imageBuffer,
            {
              format: options.format || 'png',
              quality: options.quality || 85,
              maxWidth: options.maxWidth || 1920,
              maxHeight: options.maxHeight || 1080
            }
          );

          finalBuffer = optimizationResult.buffer;
          optimizationStats = {
            originalSize: optimizationResult.originalSize,
            optimizedSize: optimizationResult.optimizedSize,
            compressionRatio: optimizationResult.compressionRatio
          };
        } catch (error) {
          logger.warn('⚠️  Optimisation échouée, utilisation buffer original', error.message);
          // Continuer avec le buffer original si optimisation échoue
          finalBuffer = generationResult.imageBuffer;
        }
      } else {
        logger.info('   Optimisation désactivée');
      }

      // ═══════════════════════════════════════════════════════════
      // ÉTAPE 6: SAUVEGARDE ET FINALISATION
      // ═══════════════════════════════════════════════════════════
      logger.logStep(6, 6, 'Sauvegarde de l\'image');
      
      const filename = this.generateFilename(articleTitle, options.format || 'png');
      const filePath = path.join(this.outputDir, filename);
      
      fs.writeFileSync(filePath, finalBuffer);
      logger.success(`💾 Image sauvegardée: ${filename}`);

      // ═══════════════════════════════════════════════════════════
      // RÉSULTAT FINAL
      // ═══════════════════════════════════════════════════════════
      const totalTime = timer.stop();

      const result = {
        success: true,
        filename,
        path: filePath,
        url: `/uploads/generated-images/${filename}`,
        provider: generationResult.provider,
        cost: generationResult.cost,
        generationTime: totalTime.toFixed(2),
        metadata: {
          ...promptData.metadata,
          articleTitle,
          subreddit,
          timestamp: new Date().toISOString()
        },
        optimization: optimizationStats,
        prompt: {
          text: promptData.prompt,
          negative: promptData.negativePrompt,
          style: promptData.style
        }
      };

      // Logger les métriques
      logger.logGeneration(result);

      // Sauvegarder dans le cache
      if (this.enableCache) {
        const cacheKey = cacheManager.getCacheKey(articleTitle, subreddit, options);
        cacheManager.set(cacheKey, result);
      }

      logger.info('\n✅ ═══════════════════════════════════════════════════════════');
      logger.info('   GÉNÉRATION TERMINÉE AVEC SUCCÈS !');
      logger.info('✅ ═══════════════════════════════════════════════════════════\n');

      return result;

    } catch (error) {
      const totalTime = timer.stop();
      
      logger.error('❌ Erreur lors de la génération', error);

      const errorResult = {
        success: false,
        error: error.message,
        errorType: error.name,
        generationTime: totalTime.toFixed(2),
        metadata: {
          articleTitle,
          subreddit,
          timestamp: new Date().toISOString()
        }
      };

      logger.logGeneration(errorResult);

      throw error;
    }
  }

  /**
   * Générer un nom de fichier unique et descriptif
   */
  generateFilename(articleTitle, format = 'png') {
    // Nettoyer le titre pour le nom de fichier
    const cleanTitle = articleTitle
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    return `article-${cleanTitle}-${timestamp}-${random}.${format}`;
  }

  /**
   * Générer plusieurs variantes d'une image
   */
  async generateVariants(articleTitle, subreddit, variantOptions = []) {
    logger.info(`🎨 Génération de ${variantOptions.length} variantes...`);

    const results = [];

    for (let i = 0; i < variantOptions.length; i++) {
      logger.info(`\n📸 Variante ${i + 1}/${variantOptions.length}`);
      
      try {
        const result = await this.generateArticleImage(
          articleTitle,
          subreddit,
          variantOptions[i]
        );
        results.push(result);
      } catch (error) {
        logger.error(`Variante ${i + 1} échouée`, error);
        results.push({ success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Nettoyer le cache expiré
   */
  cleanupCache() {
    if (this.enableCache) {
      return cacheManager.cleanup();
    }
    return 0;
  }

  /**
   * Obtenir les statistiques complètes
   */
  getStats() {
    return {
      generator: {
        outputDir: this.outputDir,
        cacheEnabled: this.enableCache,
        optimizationEnabled: this.enableOptimization,
        defaultProvider: this.defaultProvider
      },
      logger: logger.getMetrics(),
      cache: this.enableCache ? cacheManager.getStats() : null,
      rateLimits: providerManager.getRateLimitStats(),
      prompts: promptEngine.getStats()
    };
  }

  /**
   * Afficher les statistiques
   */
  displayStats() {
    const stats = this.getStats();

    console.log('\n📊 ═══════════════════════════════════════════════════════════');
    console.log('📊 STATISTIQUES GLOBALES - IMAGE GENERATOR V2');
    console.log('📊 ═══════════════════════════════════════════════════════════');
    
    // Stats Logger
    console.log('\n🔢 Génération:');
    console.log(`   Total:           ${stats.logger.totalGenerations}`);
    console.log(`   Réussies:        ${stats.logger.successfulGenerations}`);
    console.log(`   Échouées:        ${stats.logger.failedGenerations}`);
    console.log(`   Taux succès:     ${stats.logger.successRate}%`);
    console.log(`   Coût total:      $${stats.logger.totalCost.toFixed(4)}`);
    console.log(`   Temps total:     ${stats.logger.totalTime.toFixed(1)}s`);
    
    if (stats.logger.successfulGenerations > 0) {
      console.log(`   Coût moyen:      $${stats.logger.averageCost.toFixed(4)}`);
      console.log(`   Temps moyen:     ${stats.logger.averageTime.toFixed(1)}s`);
    }

    // Stats Cache
    if (stats.cache) {
      console.log('\n💾 Cache:');
      console.log(`   Total entrées:   ${stats.cache.total}`);
      console.log(`   Valides:         ${stats.cache.valid}`);
      console.log(`   Expirées:        ${stats.cache.expired}`);
      console.log(`   Taille:          ${stats.cache.sizeMB} MB`);
    }

    // Stats Prompts
    console.log('\n🎨 Prompts:');
    console.log(`   Contextes:       ${stats.prompts.totalContexts}`);
    console.log(`   Catégories:      ${stats.prompts.categories.length}`);

    console.log('\n📊 ═══════════════════════════════════════════════════════════\n');
  }
}

// Instance globale
const imageGenerator = new ImageGenerator();

module.exports = {
  ImageGenerator,
  imageGenerator
};
