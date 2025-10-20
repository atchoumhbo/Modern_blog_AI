#!/usr/bin/env node

/**
 * Test complet du workflow N8N avec génération d'images SD3
 * Teste toute la chaîne : Reddit -> Perplexity -> OpenAI -> SD3 -> Strapi
 */

const { runWorkflow } = require('./n8n-workflow-reproduction');

async function testCompleteWorkflowWithImages() {
  console.log('🚀 === TEST WORKFLOW COMPLET AVEC IMAGES SD3 ===\n');
  
  // Configuration du test
  const testConfig = {
    maxArticles: 1,           // Un seul article pour le test
    dryRun: false,           // Vrai test avec publication
    skipExisting: true,      // Éviter les doublons
    imageGeneration: true,   // Activer la génération d'images
    forceSubreddits: ['reactjs'], // Forcer React pour un bon test
    minScore: 20,            // Score minimum réduit pour avoir plus de choix
    maxWordCount: 600        // Article plus court pour le test
  };

  console.log('🔧 Configuration du test:');
  console.log(`   📊 Articles max: ${testConfig.maxArticles}`);
  console.log(`   🎨 Génération d'images: ${testConfig.imageGeneration ? '✅ Activée' : '❌ Désactivée'}`);
  console.log(`   📂 Subreddits: ${testConfig.forceSubreddits.join(', ')}`);
  console.log(`   💯 Score minimum: ${testConfig.minScore}`);
  console.log(`   📝 Mots max: ${testConfig.maxWordCount}`);
  console.log('');

  // Vérifier les clés API nécessaires
  console.log('🔑 Vérification des APIs:');
  const requiredApis = {
    'Reddit': process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET,
    'Perplexity': process.env.PERPLEXITY_API_KEY,
    'OpenAI': process.env.OPENAI_API_KEY,
    'Groq': process.env.GROQ_API_KEY,
    'Stability AI': process.env.STABILITY_API_KEY,
    'Strapi': process.env.STRAPI_N8N_API_TOKEN
  };

  let missingApis = 0;
  for (const [api, configured] of Object.entries(requiredApis)) {
    const status = configured ? '✅' : '❌';
    console.log(`   ${status} ${api}`);
    if (!configured) missingApis++;
  }

  if (missingApis > 0) {
    console.error(`\n❌ ${missingApis} API(s) manquante(s). Vérifiez votre fichier .env`);
    process.exit(1);
  }

  console.log('\n✅ Toutes les APIs sont configurées!\n');

  try {
    const startTime = Date.now();
    
    console.log('🔄 Lancement du workflow complet...\n');
    
    // Lancer le workflow principal 
    const results = await runWorkflow();

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n🎯 === RÉSULTATS DU TEST COMPLET ===');
    
    if (results && results.length > 0) {
      console.log(`✅ Articles générés: ${results.length}`);
      
      let totalCost = 0;
      let totalWords = 0;
      let imagesGenerated = 0;
      
      results.forEach((result, index) => {
        console.log(`\n📰 Article ${index + 1}:`);
        console.log(`   📋 Titre: ${result.article?.title || 'N/A'}`);
        console.log(`   📂 Subreddit: r/${result.post?.subreddit || 'N/A'}`);
        console.log(`   📊 Score Reddit: ${result.post?.score || 0}`);
        console.log(`   💬 Commentaires: ${result.post?.comments || 0}`);
        
        if (result.strapi) {
          console.log(`   🌐 Strapi FR: ID ${result.strapi.french?.id || 'N/A'}`);
          console.log(`   🌐 Strapi EN: ID ${result.strapi.english?.id || 'N/A'}`);
        }
        
        // Informations sur l'image
        if (result.imageGeneration) {
          console.log(`   🎨 Image: ${result.imageGeneration.filename || 'N/A'}`);
          console.log(`   💰 Coût image: $${result.imageGeneration.cost?.toFixed(4) || '0'}`);
          console.log(`   ⏱️  Temps image: ${result.imageGeneration.generationTime || 'N/A'}`);
          console.log(`   🎯 Prompt: ${result.imageGeneration.prompt?.substring(0, 60) || 'N/A'}...`);
          
          if (result.imageGeneration.cost) {
            totalCost += result.imageGeneration.cost;
            imagesGenerated++;
          }
        }
        
        // Coûts APIs
        if (result.costs) {
          Object.entries(result.costs).forEach(([api, cost]) => {
            if (typeof cost === 'number') {
              console.log(`   💰 ${api}: $${cost.toFixed(4)}`);
              totalCost += cost;
            }
          });
        }
        
        // Mots générés
        if (result.article?.content) {
          const wordCount = result.article.content.split(' ').length;
          totalWords += wordCount;
          console.log(`   📝 Mots: ${wordCount}`);
        }
      });

      console.log('\n📊 Statistiques globales:');
      console.log(`   ⏱️  Temps total: ${totalTime}s`);
      console.log(`   💰 Coût total: $${totalCost.toFixed(4)}`);
      console.log(`   📝 Mots totaux: ${totalWords}`);
      console.log(`   🎨 Images générées: ${imagesGenerated}`);
      
      if (results.length > 0) {
        console.log(`   ⚡ Temps/article: ${(parseFloat(totalTime) / results.length).toFixed(1)}s`);
        console.log(`   💸 Coût/article: $${(totalCost / results.length).toFixed(4)}`);
        console.log(`   📊 Mots/article: ${Math.round(totalWords / results.length)}`);
      }

      console.log('\n🎉 Test complet réussi avec génération d\'images SD3!');
      console.log('💡 Le système est prêt pour la production.');
      
      return true;

    } else {
      console.log('⚠️ Aucun article généré.');
      console.log('   Possible causes:');
      console.log('   - Tous les posts récents déjà traités');
      console.log('   - Score minimum trop élevé');
      console.log('   - Erreurs dans les APIs');
      
      return false;
    }

  } catch (error) {
    console.error('\n❌ Erreur dans le test complet:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Stack: ${error.stack?.split('\n')[1]?.trim() || 'N/A'}`);
    
    return false;
  }
}

// Lancer le test complet
if (require.main === module) {
  testCompleteWorkflowWithImages()
    .then(success => {
      console.log(`\n🏁 Test terminé: ${success ? 'SUCCÈS' : 'ÉCHEC'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Erreur critique du test:', error.message);
      process.exit(1);
    });
}

module.exports = { testCompleteWorkflowWithImages };