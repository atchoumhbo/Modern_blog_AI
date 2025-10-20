#!/usr/bin/env node

/**
 * Test rapide du système Image Generator V2
 * Teste chaque composant individuellement
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../..', '.env') });

console.log('\n🧪 ═══════════════════════════════════════════════════════════');
console.log('   TEST IMAGE GENERATOR V2');
console.log('🧪 ═══════════════════════════════════════════════════════════\n');

async function runTests() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // ═══════════════════════════════════════════════════════════
  // TEST 1: Imports
  // ═══════════════════════════════════════════════════════════
  console.log('📦 [1/8] Test des imports...');
  try {
    const {
      imageGenerator,
      promptEngine,
      providerManager,
      cacheManager,
      imageOptimizer,
      logger
    } = require('./index');

    if (!imageGenerator || !promptEngine || !providerManager) {
      throw new Error('Imports incomplets');
    }

    console.log('   ✅ Tous les modules importés\n');
    results.passed++;
    results.tests.push({ name: 'Imports', status: 'PASSED' });
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}\n`);
    results.failed++;
    results.tests.push({ name: 'Imports', status: 'FAILED', error: error.message });
    return results; // Stop si imports échouent
  }

  const {
    imageGenerator,
    promptEngine,
    providerManager,
    cacheManager,
    logger
  } = require('./index');

  // ═══════════════════════════════════════════════════════════
  // TEST 2: Variables d'environnement
  // ═══════════════════════════════════════════════════════════
  console.log('🔐 [2/8] Test des variables d\'environnement...');
  const hasStabilityKey = !!process.env.STABILITY_API_KEY;
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

  if (hasStabilityKey || hasOpenAIKey) {
    console.log(`   ✅ Clé(s) API trouvée(s):`);
    if (hasStabilityKey) console.log('      - Stability AI ✓');
    if (hasOpenAIKey) console.log('      - OpenAI DALL-E ✓');
    console.log('');
    results.passed++;
    results.tests.push({ name: 'Environment Variables', status: 'PASSED' });
  } else {
    console.log('   ⚠️  Aucune clé API trouvée (tests limités)\n');
    results.tests.push({ name: 'Environment Variables', status: 'WARNING' });
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 3: Prompt Engine
  // ═══════════════════════════════════════════════════════════
  console.log('🎨 [3/8] Test du Prompt Engine...');
  try {
    const promptData = promptEngine.generateEnrichedPrompt(
      'Microsoft Teams Security Best Practices',
      'MicrosoftTeams'
    );

    if (!promptData.prompt || !promptData.metadata) {
      throw new Error('Données de prompt incomplètes');
    }

    console.log(`   ✅ Prompt généré:`);
    console.log(`      Catégorie: ${promptData.metadata.category}`);
    console.log(`      Keywords: ${promptData.metadata.keywords.join(', ')}`);
    console.log('');
    results.passed++;
    results.tests.push({ name: 'Prompt Engine', status: 'PASSED' });
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}\n`);
    results.failed++;
    results.tests.push({ name: 'Prompt Engine', status: 'FAILED', error: error.message });
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 4: Cache Manager
  // ═══════════════════════════════════════════════════════════
  console.log('💾 [4/8] Test du Cache Manager...');
  try {
    const testKey = 'test-cache-key-' + Date.now();
    const testData = { test: true, timestamp: Date.now() };

    // Test set
    cacheManager.set(testKey, testData);

    // Test get
    const retrieved = cacheManager.get(testKey);

    if (!retrieved || !retrieved.test) {
      throw new Error('Cache set/get échoué');
    }

    // Test delete
    cacheManager.delete(testKey);

    console.log('   ✅ Cache fonctionne (set/get/delete)\n');
    results.passed++;
    results.tests.push({ name: 'Cache Manager', status: 'PASSED' });
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}\n`);
    results.failed++;
    results.tests.push({ name: 'Cache Manager', status: 'FAILED', error: error.message });
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 5: Validation
  // ═══════════════════════════════════════════════════════════
  console.log('✔️  [5/8] Test de la validation...');
  try {
    const { validateArticleTitle } = require('./utils/validation');

    // Test titre valide
    const validResult = validateArticleTitle('Valid Article Title');
    if (!validResult.valid) {
      throw new Error('Titre valide rejeté');
    }

    // Test titre invalide (trop court)
    const invalidResult = validateArticleTitle('Ab');
    if (invalidResult.valid) {
      throw new Error('Titre invalide accepté');
    }

    console.log('   ✅ Validation fonctionne\n');
    results.passed++;
    results.tests.push({ name: 'Validation', status: 'PASSED' });
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}\n`);
    results.failed++;
    results.tests.push({ name: 'Validation', status: 'FAILED', error: error.message });
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 6: Rate Limiter
  // ═══════════════════════════════════════════════════════════
  console.log('⏸️  [6/8] Test du Rate Limiter...');
  try {
    const { RateLimiter } = require('./utils/rate-limiter');
    const limiter = new RateLimiter(2, 1000, 'TEST');

    // Deux requêtes doivent passer instantanément
    await limiter.waitForSlot();
    await limiter.waitForSlot();

    const stats = limiter.getStats();
    if (stats.active !== 2) {
      throw new Error('Rate limiter ne compte pas correctement');
    }

    console.log('   ✅ Rate Limiter fonctionne\n');
    results.passed++;
    results.tests.push({ name: 'Rate Limiter', status: 'PASSED' });
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}\n`);
    results.failed++;
    results.tests.push({ name: 'Rate Limiter', status: 'FAILED', error: error.message });
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 7: Logger
  // ═══════════════════════════════════════════════════════════
  console.log('📝 [7/8] Test du Logger...');
  try {
    logger.info('Test message');
    const metrics = logger.getMetrics();

    if (!metrics || typeof metrics.totalGenerations !== 'number') {
      throw new Error('Métriques du logger invalides');
    }

    console.log('   ✅ Logger fonctionne\n');
    results.passed++;
    results.tests.push({ name: 'Logger', status: 'PASSED' });
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}\n`);
    results.failed++;
    results.tests.push({ name: 'Logger', status: 'FAILED', error: error.message });
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 8: Contextes
  // ═══════════════════════════════════════════════════════════
  console.log('🗂️  [8/8] Test des contextes...');
  try {
    const stats = promptEngine.getStats();

    if (!stats.totalContexts || stats.totalContexts < 20) {
      throw new Error(`Pas assez de contextes (${stats.totalContexts})`);
    }

    console.log(`   ✅ ${stats.totalContexts} contextes disponibles`);
    console.log(`      Catégories: ${stats.categories.length}\n`);
    results.passed++;
    results.tests.push({ name: 'Contexts', status: 'PASSED' });
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}\n`);
    results.failed++;
    results.tests.push({ name: 'Contexts', status: 'FAILED', error: error.message });
  }

  return results;
}

// Exécuter les tests
runTests().then((results) => {
  console.log('\n📊 ═══════════════════════════════════════════════════════════');
  console.log('   RÉSULTATS DES TESTS');
  console.log('📊 ═══════════════════════════════════════════════════════════\n');

  // Afficher chaque test
  results.tests.forEach((test, index) => {
    const icon = test.status === 'PASSED' ? '✅' : 
                 test.status === 'WARNING' ? '⚠️ ' : '❌';
    console.log(`   ${icon} [${index + 1}] ${test.name}: ${test.status}`);
    if (test.error) {
      console.log(`       Erreur: ${test.error}`);
    }
  });

  console.log('\n   ─────────────────────────────────────────────────────────');
  console.log(`   Total: ${results.passed + results.failed} tests`);
  console.log(`   ✅ Réussis: ${results.passed}`);
  console.log(`   ❌ Échoués: ${results.failed}`);

  const percentage = Math.round((results.passed / (results.passed + results.failed)) * 100);
  console.log(`   📈 Taux de succès: ${percentage}%`);
  console.log('   ─────────────────────────────────────────────────────────\n');

  if (results.failed === 0) {
    console.log('   🎉 TOUS LES TESTS PASSENT !');
    console.log('   Le système est prêt à l\'emploi.\n');
    console.log('   Prochaines étapes:');
    console.log('   1. Tester une vraie génération: node v2/index.js "Test Title"');
    console.log('   2. Intégrer dans N8N workflow\n');
  } else {
    console.log('   ⚠️  CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('   Vérifier les erreurs ci-dessus avant utilisation.\n');
  }

  console.log('📊 ═══════════════════════════════════════════════════════════\n');

  process.exit(results.failed > 0 ? 1 : 0);
}).catch((error) => {
  console.error('\n❌ ERREUR CRITIQUE:', error.message);
  console.error(error.stack);
  process.exit(1);
});
