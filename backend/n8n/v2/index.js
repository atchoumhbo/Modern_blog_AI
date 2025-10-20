#!/usr/bin/env node

/**
 * Image Generator V2 - Point d'entrée principal
 * Architecture complète avec best practices
 * 
 * Usage:
 *   const { imageGenerator } = require('./v2');
 *   const result = await imageGenerator.generateArticleImage(title, subreddit, options);
 */

const { imageGenerator, ImageGenerator } = require('./core/image-generator');
const { promptEngine, PromptEngine } = require('./core/prompt-engine');
const { providerManager, ProviderManager } = require('./core/provider-manager');
const { cacheManager, CacheManager } = require('./utils/cache-manager');
const { imageOptimizer, ImageOptimizer } = require('./utils/image-optimizer');
const { logger, Logger } = require('./utils/logger');

// Exporter les instances globales (prêtes à l'emploi)
module.exports = {
  // Instances globales
  imageGenerator,
  promptEngine,
  providerManager,
  cacheManager,
  imageOptimizer,
  logger,

  // Classes (pour créer des instances personnalisées)
  ImageGenerator,
  PromptEngine,
  ProviderManager,
  CacheManager,
  ImageOptimizer,
  Logger,

  // Fonction principale simplifiée
  generateImage: async (title, subreddit = 'programming', options = {}) => {
    return await imageGenerator.generateArticleImage(title, subreddit, options);
  },

  // Utilitaires
  getStats: () => imageGenerator.getStats(),
  displayStats: () => imageGenerator.displayStats(),
  cleanupCache: () => imageGenerator.cleanupCache()
};

// Si exécuté directement (node v2/index.js)
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                    IMAGE GENERATOR V2 - HELP                              ║
╚═══════════════════════════════════════════════════════════════════════════╝

📖 USAGE:

  node v2/index.js "Article Title" [subreddit] [--option=value]

📝 EXEMPLES:

  # Générer avec défauts
  node v2/index.js "Learn React Hooks in 2024"

  # Spécifier le subreddit
  node v2/index.js "Microsoft Teams Security" MicrosoftTeams

  # Avec options
  node v2/index.js "Docker Tips" docker --provider=stability-ai --format=webp

  # Afficher les stats
  node v2/index.js --stats

  # Nettoyer le cache
  node v2/index.js --cleanup

🔧 OPTIONS:

  --provider=<name>        Provider: stability-ai, openai-dalle
  --format=<format>        Format: png, jpeg, webp
  --quality=<number>       Qualité: 1-100 (défaut: 85)
  --aspectRatio=<ratio>    Ratio: 16:9, 1:1, etc.
  --no-cache               Désactiver le cache
  --no-optimization        Désactiver l'optimisation
  --stats                  Afficher les statistiques
  --cleanup                Nettoyer le cache expiré

📚 DOCUMENTATION COMPLÈTE:
  Voir README-V2.md pour plus de détails
`);
    process.exit(0);
  }

  // Commandes spéciales
  if (args[0] === '--stats') {
    imageGenerator.displayStats();
    process.exit(0);
  }

  if (args[0] === '--cleanup') {
    const cleaned = imageGenerator.cleanupCache();
    console.log(`✅ ${cleaned} cache(s) nettoyé(s)`);
    process.exit(0);
  }

  // Génération d'image
  (async () => {
    try {
      const title = args[0];
      const subreddit = args[1] || 'programming';
      
      // Parser les options
      const options = {};
      for (let i = 2; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
          const [key, value] = arg.substring(2).split('=');
          
          if (key === 'no-cache') {
            options.enableCache = false;
          } else if (key === 'no-optimization') {
            options.enableOptimization = false;
          } else if (value) {
            options[key] = value;
          }
        }
      }

      console.log(`\n🚀 Génération d'image pour: "${title}"`);
      console.log(`   Subreddit: r/${subreddit}`);
      if (Object.keys(options).length > 0) {
        console.log(`   Options:`, options);
      }

      const result = await imageGenerator.generateArticleImage(title, subreddit, options);

      console.log('\n✅ ═══════════════════════════════════════════════════════════');
      console.log('   RÉSULTAT:');
      console.log('✅ ═══════════════════════════════════════════════════════════');
      console.log(`   Fichier:     ${result.filename}`);
      console.log(`   Path:        ${result.path}`);
      console.log(`   URL:         ${result.url}`);
      console.log(`   Provider:    ${result.provider}`);
      console.log(`   Coût:        $${result.cost.toFixed(4)}`);
      console.log(`   Temps:       ${result.generationTime}s`);
      console.log(`   Catégorie:   ${result.metadata.category}`);
      console.log('✅ ═══════════════════════════════════════════════════════════\n');

      imageGenerator.displayStats();

    } catch (error) {
      console.error('\n❌ ERREUR:', error.message);
      if (logger.logLevel === 'debug') {
        console.error(error.stack);
      }
      process.exit(1);
    }
  })();
}
