#!/usr/bin/env node

/**
 * Test de génération d'images avec Stability AI SD3
 * Version optimisée avec nouvelle API multipart/form-data
 */

const { generateArticleImage, IMAGE_CONFIG } = require('./image-generator-sd3');

async function testImageGeneration() {
  console.log('🧪 === TEST GÉNÉRATION D\'IMAGES SD3 ===\n');
  
  // Vérifier la configuration
  console.log('🔧 Configuration:');
  console.log(`- Provider par défaut: ${IMAGE_CONFIG.DEFAULT_PROVIDER}`);
  console.log(`- Stability API: ${process.env.STABILITY_API_KEY ? '✅ Configurée' : '❌ Manquante'}`);
  console.log(`- OpenAI API: ${process.env.OPENAI_API_KEY ? '✅ Configurée' : '❌ Manquante'}`);
  console.log('');

  // Tests avec différents scénarios
  const testCases = [
    {
      title: "Modern React Hooks Best Practices 2025",
      subreddit: "reactjs",
      options: {
        provider: 'stability-ai',
        aspectRatio: '16:9',
        outputFormat: 'png',
        uploadStrapi: false, // Test local uniquement
        saveLocal: true
      }
    }
  ];

  let totalCost = 0;
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📋 Test ${i + 1}/${testCases.length}:`);
    console.log(`   Titre: ${testCase.title}`);
    console.log(`   Subreddit: r/${testCase.subreddit}`);
    console.log(`   Provider: ${testCase.options.provider}`);
    console.log(`   Format: ${testCase.options.aspectRatio} (${testCase.options.outputFormat})`);

    try {
      const startTime = Date.now();
      
      const result = await generateArticleImage(
        testCase.title,
        testCase.subreddit,
        testCase.options
      );

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      
      console.log(`\n✅ Test ${i + 1} réussi!`);
      console.log(`   📄 Fichier: ${result.filename}`);
      console.log(`   ⏱️  Temps total: ${totalTime}s`);
      console.log(`   💰 Coût: $${result.cost.toFixed(4)}`);
      console.log(`   📝 Prompt: ${result.prompt.substring(0, 80)}...`);
      
      if (result.local) {
        console.log(`   💾 Local: ${result.local.filename} (${result.local.size} KB)`);
      }
      
      if (result.strapi) {
        console.log(`   ☁️  Strapi: ID ${result.strapi.id}`);
      }

      totalCost += result.cost;
      results.push({
        test: i + 1,
        success: true,
        result: result,
        totalTime: totalTime
      });

    } catch (error) {
      console.error(`\n❌ Test ${i + 1} échoué:`);
      console.error(`   Erreur: ${error.message}`);
      
      results.push({
        test: i + 1,
        success: false,
        error: error.message
      });
    }
  }

  // Résumé final
  console.log('\n🎯 === RÉSUMÉ DES TESTS ===');
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`✅ Réussis: ${successCount}/${testCases.length}`);
  console.log(`❌ Échecs: ${failCount}/${testCases.length}`);
  console.log(`💰 Coût total: $${totalCost.toFixed(4)}`);
  
  if (successCount > 0) {
    const avgTime = (results
      .filter(r => r.success)
      .reduce((sum, r) => sum + parseFloat(r.totalTime), 0) / successCount).toFixed(1);
    console.log(`⏱️  Temps moyen: ${avgTime}s par image`);
  }

  // Afficher les détails des échecs
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('\n🔍 Détails des échecs:');
    failures.forEach(failure => {
      console.log(`   Test ${failure.test}: ${failure.error}`);
    });
  }

  console.log('\n🏁 Tests terminés!');
  
  if (failCount === 0) {
    console.log('🎉 Tous les tests sont passés avec succès!');
    return true;
  } else {
    console.log('⚠️  Certains tests ont échoué, vérifiez la configuration.');
    return false;
  }
}

// Lancer les tests
if (require.main === module) {
  testImageGeneration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Erreur critique:', error.message);
      process.exit(1);
    });
}

module.exports = { testImageGeneration };