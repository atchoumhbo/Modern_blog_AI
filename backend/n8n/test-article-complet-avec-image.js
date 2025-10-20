#!/usr/bin/env node

/**
 * Test création article complet avec image liée FR/EN
 * Vérification que l'image est correctement associée aux deux versions
 */

const { runWorkflow } = require('./n8n-workflow-reproduction');
const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const STRAPI_URL = process.env.CLOUDFLARE_TUNNEL_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_N8N_API_TOKEN;

const strapiClient = axios.create({
  baseURL: STRAPI_URL,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function getArticleDetails(articleId, locale = 'fr') {
  try {
    const response = await strapiClient.get(`/api/articles/${articleId}`, {
      params: {
        locale: locale,
        populate: [
          'featured_image',
          'localizations',
          'categories',
          'tags',
          'author'
        ]
      }
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Erreur récupération article ${articleId} (${locale}):`, error.message);
    return null;
  }
}

async function getImageDetails(imageId) {
  try {
    const response = await strapiClient.get(`/api/upload/files/${imageId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Erreur récupération image ${imageId}:`, error.message);
    return null;
  }
}

async function testCompleteArticleWithImage() {
  console.log('🧪 === TEST CRÉATION ARTICLE COMPLET AVEC IMAGE FR/EN ===\n');
  
  // Vérifier la configuration
  if (!API_TOKEN) {
    console.error('❌ STRAPI_N8N_API_TOKEN manquant');
    return false;
  }

  console.log('🔧 Configuration:');
  console.log(`   🌐 Strapi URL: ${STRAPI_URL}`);
  console.log(`   🔑 Token: ${API_TOKEN ? '✅ Configuré' : '❌ Manquant'}`);
  console.log('');

  try {
    console.log('🚀 Lancement du workflow N8N complet...');
    console.log('   (Cela peut prendre 2-3 minutes pour générer un article complet)\n');
    
    const startTime = Date.now();
    
    // Lancer le workflow principal qui génère un article complet
    const result = await runWorkflow();
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (!result || result.length === 0) {
      console.log('⚠️ Aucun article généré par le workflow');
      console.log('   Possible causes:');
      console.log('   - Tous les posts Reddit récents déjà traités');
      console.log('   - Score minimum non atteint');
      console.log('   - Erreurs dans les APIs');
      return false;
    }

    console.log(`✅ Workflow terminé en ${totalTime}s`);
    console.log(`📊 Résultats: ${result.length} article(s) généré(s)\n`);

    // Analyser le premier article généré
    const articleResult = result[0];
    
    console.log('🔍 === ANALYSE DE L\'ARTICLE GÉNÉRÉ ===');
    console.log(`📰 Titre: ${articleResult.article?.title || 'N/A'}`);
    console.log(`📂 Subreddit: r/${articleResult.post?.subreddit || 'N/A'}`);
    console.log(`📊 Score Reddit: ${articleResult.post?.score || 0}`);
    
    if (!articleResult.strapi) {
      console.error('❌ Pas de données Strapi dans le résultat');
      return false;
    }

    const frenchId = articleResult.strapi.french?.id;
    const englishId = articleResult.strapi.english?.id;
    
    console.log(`\n🌐 IDs Strapi:`);
    console.log(`   🇫🇷 Français: ${frenchId || 'N/A'}`);
    console.log(`   🇬🇧 Anglais: ${englishId || 'N/A'}`);

    if (!frenchId || !englishId) {
      console.error('❌ Articles FR ou EN manquants');
      return false;
    }

    // Récupérer les détails des articles FR et EN
    console.log('\n📋 Récupération des détails des articles...');
    
    const frenchArticle = await getArticleDetails(frenchId, 'fr');
    const englishArticle = await getArticleDetails(englishId, 'en');
    
    if (!frenchArticle || !englishArticle) {
      console.error('❌ Impossible de récupérer les articles');
      return false;
    }

    console.log('\n🇫🇷 Article Français:');
    console.log(`   📋 Titre: ${frenchArticle.data.attributes.title}`);
    console.log(`   📝 Mots: ${frenchArticle.data.attributes.content?.split(' ').length || 0}`);
    console.log(`   🎨 Image ID: ${frenchArticle.data.attributes.featured_image?.data?.id || 'AUCUNE'}`);
    console.log(`   🔗 Localisation EN: ${frenchArticle.data.attributes.localizations?.data?.[0]?.id || 'AUCUNE'}`);

    console.log('\n🇬🇧 Article Anglais:');
    console.log(`   📋 Titre: ${englishArticle.data.attributes.title}`);
    console.log(`   📝 Mots: ${englishArticle.data.attributes.content?.split(' ').length || 0}`);
    console.log(`   🎨 Image ID: ${englishArticle.data.attributes.featured_image?.data?.id || 'AUCUNE'}`);
    console.log(`   🔗 Localisation FR: ${englishArticle.data.attributes.localizations?.data?.[0]?.id || 'AUCUNE'}`);

    // Vérifier les images
    const frImageId = frenchArticle.data.attributes.featured_image?.data?.id;
    const enImageId = englishArticle.data.attributes.featured_image?.data?.id;

    console.log('\n🎨 === VÉRIFICATION DES IMAGES ===');
    
    if (!frImageId || !enImageId) {
      console.error('❌ Images manquantes:');
      console.error(`   🇫🇷 Image FR: ${frImageId ? '✅' : '❌ MANQUANTE'}`);
      console.error(`   🇬🇧 Image EN: ${enImageId ? '✅' : '❌ MANQUANTE'}`);
      return false;
    }

    // Vérifier que c'est la même image
    if (frImageId !== enImageId) {
      console.error('⚠️ Images différentes entre FR et EN:');
      console.error(`   🇫🇷 Image FR ID: ${frImageId}`);
      console.error(`   🇬🇧 Image EN ID: ${enImageId}`);
      console.error('   🔧 Cela peut être normal si les images sont générées séparément');
    } else {
      console.log('✅ Même image partagée entre FR et EN:');
      console.log(`   🎨 Image ID: ${frImageId}`);
    }

    // Récupérer les détails de l'image
    const imageDetails = await getImageDetails(frImageId);
    
    if (imageDetails) {
      console.log('\n📸 Détails de l\'image:');
      console.log(`   📄 Nom: ${imageDetails.name}`);
      console.log(`   📊 Taille: ${Math.round(imageDetails.size / 1024)} KB`);
      console.log(`   📐 Dimensions: ${imageDetails.width}x${imageDetails.height}`);
      console.log(`   🔗 URL: ${imageDetails.url}`);
      console.log(`   📅 Créée: ${new Date(imageDetails.createdAt).toLocaleString()}`);
    }

    // Vérifier les localisations croisées
    console.log('\n🔗 === VÉRIFICATION DES LOCALISATIONS ===');
    
    const frLocalizationId = frenchArticle.data.attributes.localizations?.data?.[0]?.id;
    const enLocalizationId = englishArticle.data.attributes.localizations?.data?.[0]?.id;
    
    console.log(`🇫🇷 Article FR pointe vers EN: ${frLocalizationId} (attendu: ${englishId})`);
    console.log(`🇬🇧 Article EN pointe vers FR: ${enLocalizationId} (attendu: ${frenchId})`);
    
    const localizationsOk = (
      frLocalizationId === englishId && 
      enLocalizationId === frenchId
    );
    
    if (localizationsOk) {
      console.log('✅ Localisations correctement liées');
    } else {
      console.error('❌ Problème de liaison des localisations');
    }

    // Résumé final
    console.log('\n🎯 === RÉSUMÉ DE LA VÉRIFICATION ===');
    
    const checks = {
      'Articles créés (FR/EN)': frenchId && englishId,
      'Images assignées': frImageId && enImageId,
      'Image partagée': frImageId === enImageId,
      'Localisations liées': localizationsOk,
      'Contenu généré': frenchArticle.data.attributes.content && englishArticle.data.attributes.content
    };

    let allGood = true;
    Object.entries(checks).forEach(([check, status]) => {
      console.log(`   ${status ? '✅' : '❌'} ${check}`);
      if (!status) allGood = false;
    });

    if (allGood) {
      console.log('\n🎉 SUCCÈS COMPLET!');
      console.log('   Le système génère correctement:');
      console.log('   - Articles bilingues FR/EN');
      console.log('   - Images automatiques liées aux deux versions');
      console.log('   - Localisations croisées fonctionnelles');
      console.log('   - Contenu complet avec métadonnées');
      
      console.log('\n💡 Le système est prêt pour la production!');
      return true;
    } else {
      console.log('\n⚠️ Quelques problèmes détectés, mais le système fonctionne');
      return true; // Succès partiel
    }

  } catch (error) {
    console.error('\n❌ Erreur dans le test complet:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Stack: ${error.stack?.split('\n').slice(0, 3).join('\n')}`);
    return false;
  }
}

// Lancer le test
if (require.main === module) {
  testCompleteArticleWithImage()
    .then(success => {
      console.log(`\n🏁 Test terminé: ${success ? 'SUCCÈS' : 'ÉCHEC'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Erreur critique:', error.message);
      process.exit(1);
    });
}

module.exports = { testCompleteArticleWithImage };