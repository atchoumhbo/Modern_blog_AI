#!/usr/bin/env node

/**
 * Test simple intégration SD3 + Strapi
 * Test de bout en bout pour valider la génération et l'upload
 */

const { generateArticleImage } = require('./image-generator-sd3');

async function testSD3StrapiIntegration() {
  console.log('🧪 === TEST INTÉGRATION SD3 + STRAPI ===\n');
  
  // Test data
  const testCase = {
    title: "Complete Guide to React Server Components in 2025",
    subreddit: "reactjs"
  };

  console.log('📋 Test case:');
  console.log(`   📰 Titre: ${testCase.title}`);
  console.log(`   📂 Subreddit: r/${testCase.subreddit}`);
  console.log('');

  // Vérification des APIs
  const apis = {
    'Stability AI': process.env.STABILITY_API_KEY,
    'Strapi Token': process.env.STRAPI_N8N_API_TOKEN
  };

  console.log('🔑 APIs requises:');
  for (const [name, key] of Object.entries(apis)) {
    console.log(`   ${key ? '✅' : '❌'} ${name}`);
  }
  console.log('');

  if (!apis['Stability AI'] || !apis['Strapi Token']) {
    console.error('❌ APIs manquantes, impossible de continuer');
    return false;
  }

  try {
    console.log('🎨 Génération d\'image avec SD3...');
    const startTime = Date.now();

    const result = await generateArticleImage(
      testCase.title,
      testCase.subreddit,
      {
        provider: 'stability-ai',
        aspectRatio: '16:9',
        outputFormat: 'png',
        saveLocal: true,
        uploadStrapi: true
      }
    );

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n✅ SUCCÈS! Résultats:');
    console.log(`   🎯 Prompt: ${result.prompt}`);
    console.log(`   🏭 Provider: ${result.provider}`);
    console.log(`   💰 Coût: $${result.cost.toFixed(4)}`);
    console.log(`   ⏱️  Temps génération: ${result.generationTime}`);
    console.log(`   📄 Fichier: ${result.filename}`);

    if (result.local) {
      console.log(`\n💾 Sauvegarde locale:`);
      console.log(`   📁 Chemin: ${result.local.path}`);
      console.log(`   📊 Taille: ${result.local.size} KB`);
      console.log(`   🌐 URL: ${result.local.url}`);
    }

    if (result.strapi) {
      console.log(`\n☁️  Upload Strapi:`);
      console.log(`   🆔 ID: ${result.strapi.id}`);
      console.log(`   📁 Nom: ${result.strapi.filename}`);
      console.log(`   📊 Taille: ${result.strapi.size} bytes`);
      console.log(`   🌐 URL: ${result.strapi.url}`);
    }

    console.log(`\n📊 Performance:`);
    console.log(`   ⏱️  Temps total: ${totalTime}s`);
    console.log(`   💸 Coût/seconde: $${(result.cost / parseFloat(totalTime)).toFixed(6)}`);
    console.log(`   📈 Débit: ${(result.local?.size / parseFloat(totalTime) / 1024).toFixed(1)} MB/s`);

    console.log('\n🎉 Test d\'intégration SD3 + Strapi réussi!');
    console.log('💡 Le système est prêt pour la production');

    return {
      success: true,
      result: result,
      totalTime: totalTime,
      costs: {
        imageGeneration: result.cost
      }
    };

  } catch (error) {
    console.error('\n❌ Erreur dans le test d\'intégration:');
    console.error(`   Message: ${error.message}`);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }

    return {
      success: false,
      error: error.message
    };
  }
}

// Test de comparaison coûts
async function testCostComparison() {
  console.log('\n💰 === COMPARAISON DES COÛTS ===');
  
  const providers = [
    {
      name: 'Stability AI SD3',
      costPerImage: 0.003,
      features: ['92% moins cher', 'Open source', 'Formats flexibles', 'Styles variés']
    },
    {
      name: 'OpenAI DALL-E 3',
      costPerImage: 0.04,
      features: ['Qualité premium', 'API simple', 'Génération rapide']
    }
  ];

  const scenarios = [
    { name: '1 article/jour', imagesPerMonth: 30 },
    { name: '5 articles/jour', imagesPerMonth: 150 },
    { name: '20 articles/jour', imagesPerMonth: 600 }
  ];

  console.log('\n📊 Coûts mensuels par scénario:\n');
  
  scenarios.forEach(scenario => {
    console.log(`📈 ${scenario.name} (${scenario.imagesPerMonth} images/mois):`);
    
    providers.forEach(provider => {
      const monthlyCost = provider.costPerImage * scenario.imagesPerMonth;
      const yearlyCost = monthlyCost * 12;
      
      console.log(`   ${provider.name}:`);
      console.log(`     💸 Mensuel: $${monthlyCost.toFixed(2)}`);
      console.log(`     📅 Annuel: $${yearlyCost.toFixed(2)}`);
    });
    
    const sd3Cost = providers[0].costPerImage * scenario.imagesPerMonth;
    const dalleE3Cost = providers[1].costPerImage * scenario.imagesPerMonth;
    const savings = dalleE3Cost - sd3Cost;
    const savingsPercent = ((savings / dalleE3Cost) * 100).toFixed(0);
    
    console.log(`   💡 Économies SD3: $${savings.toFixed(2)}/mois (${savingsPercent}%)\n`);
  });
}

// Lancer le test complet
if (require.main === module) {
  testSD3StrapiIntegration()
    .then(result => {
      if (result.success) {
        return testCostComparison().then(() => {
          console.log('\n🏁 Tous les tests réussis!');
          return true;
        });
      } else {
        console.log('\n🏁 Test échoué');
        return false;
      }
    })
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Erreur critique:', error.message);
      process.exit(1);
    });
}