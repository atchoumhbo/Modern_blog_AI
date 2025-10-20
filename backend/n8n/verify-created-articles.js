#!/usr/bin/env node

/**
 * Vérification directe des articles créés avec leurs images
 * Test des articles FR (58) et EN (60) créés par le workflow
 */

const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const STRAPI_URL = 'http://localhost:1337'; // Test direct en local
const API_TOKEN = process.env.STRAPI_N8N_API_TOKEN;

const strapiClient = axios.create({
  baseURL: STRAPI_URL,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function verifyArticleWithImage(articleId, locale, expectedTitle = null) {
  try {
    console.log(`\n🔍 Vérification article ${articleId} (${locale})...`);
    
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
    
    const article = response.data.data;
    const attrs = article.attributes;
    
    console.log(`📰 Titre: ${attrs.title}`);
    console.log(`📝 Contenu: ${attrs.content ? attrs.content.substring(0, 100) + '...' : 'VIDE'}`);
    console.log(`📋 Extrait: ${attrs.excerpt || 'VIDE'}`);
    console.log(`📊 Mots: ${attrs.content ? attrs.content.split(' ').length : 0}`);
    console.log(`⏱️  Lecture: ${attrs.readingTime || 0} min`);
    console.log(`📅 Status: ${attrs.status || 'N/A'}`);
    
    // Image
    const image = attrs.featured_image?.data;
    if (image) {
      console.log(`🎨 Image: ✅ ID ${image.id}`);
      console.log(`   📄 Nom: ${image.attributes.name}`);
      console.log(`   📊 Taille: ${Math.round(image.attributes.size / 1024)} KB`);
      console.log(`   📐 Dimensions: ${image.attributes.width}x${image.attributes.height}`);
      console.log(`   🔗 URL: ${image.attributes.url}`);
    } else {
      console.log(`🎨 Image: ❌ AUCUNE`);
    }
    
    // Catégorie
    const category = attrs.categories?.data?.[0];
    if (category) {
      console.log(`📂 Catégorie: ${category.attributes.name}`);
    }
    
    // Tags
    const tags = attrs.tags?.data || [];
    console.log(`🏷️  Tags: ${tags.map(t => t.attributes.name).join(', ') || 'AUCUN'}`);
    
    // Localizations
    const localizations = attrs.localizations?.data || [];
    console.log(`🌐 Localisations: ${localizations.map(l => `ID ${l.id}`).join(', ') || 'AUCUNE'}`);
    
    return {
      success: true,
      article: article,
      hasImage: !!image,
      imageId: image?.id,
      hasLocalizations: localizations.length > 0,
      localizationIds: localizations.map(l => l.id)
    };
    
  } catch (error) {
    console.error(`❌ Erreur récupération article ${articleId}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function checkImageDetails(imageId) {
  try {
    console.log(`\n📸 Détails image ${imageId}...`);
    
    const response = await strapiClient.get(`/api/upload/files/${imageId}`);
    const image = response.data;
    
    console.log(`📄 Nom: ${image.name}`);
    console.log(`📊 Taille: ${Math.round(image.size / 1024)} KB`);
    console.log(`📐 Dimensions: ${image.width}x${image.height}`);
    console.log(`🎨 Type: ${image.mime}`);
    console.log(`🔗 URL: ${image.url}`);
    console.log(`📅 Créée: ${new Date(image.createdAt).toLocaleString()}`);
    
    return image;
    
  } catch (error) {
    console.error(`❌ Erreur récupération image ${imageId}:`, error.message);
    return null;
  }
}

async function verifyArticlesWithImages() {
  console.log('🧪 === VÉRIFICATION ARTICLES CRÉÉS AVEC IMAGES ===');
  
  // IDs des articles créés par le workflow précédent
  const frenchId = 57;
  const englishId = 59;
  
  console.log(`\n🎯 Test des articles créés:`);
  console.log(`   🇫🇷 Article FR: ID ${frenchId}`);
  console.log(`   🇬🇧 Article EN: ID ${englishId}`);
  
  // Vérifier l'article français
  const frResult = await verifyArticleWithImage(frenchId, 'fr');
  
  // Vérifier l'article anglais  
  const enResult = await verifyArticleWithImage(englishId, 'en');
  
  if (!frResult.success || !enResult.success) {
    console.error('\n❌ Impossible de récupérer les articles');
    return false;
  }
  
  // Comparer les images
  console.log('\n🎨 === COMPARAISON DES IMAGES ===');
  
  if (frResult.hasImage && enResult.hasImage) {
    console.log(`🇫🇷 Image FR: ID ${frResult.imageId}`);
    console.log(`🇬🇧 Image EN: ID ${enResult.imageId}`);
    
    if (frResult.imageId === enResult.imageId) {
      console.log('✅ MÊME IMAGE partagée entre FR et EN');
      
      // Détails de l'image partagée
      await checkImageDetails(frResult.imageId);
      
    } else {
      console.log('⚠️ Images différentes entre FR et EN');
      console.log('   (Cela peut être normal selon l\'implémentation)');
    }
  } else {
    console.log('❌ Images manquantes:');
    console.log(`   🇫🇷 FR: ${frResult.hasImage ? '✅' : '❌'}`);
    console.log(`   🇬🇧 EN: ${enResult.hasImage ? '✅' : '❌'}`);
  }
  
  // Vérifier les localisations croisées
  console.log('\n🔗 === VÉRIFICATION LOCALISATIONS CROISÉES ===');
  
  const frPointsToEn = frResult.localizationIds.includes(englishId);
  const enPointsToFr = enResult.localizationIds.includes(frenchId);
  
  console.log(`🇫🇷 Article FR → EN: ${frPointsToEn ? '✅' : '❌'} (${frResult.localizationIds.join(', ')})`);
  console.log(`🇬🇧 Article EN → FR: ${enPointsToFr ? '✅' : '❌'} (${enResult.localizationIds.join(', ')})`);
  
  // Résumé final
  console.log('\n🎯 === RÉSUMÉ FINAL ===');
  
  const checks = {
    'Articles récupérés': frResult.success && enResult.success,
    'Images présentes': frResult.hasImage && enResult.hasImage,
    'Image partagée': frResult.hasImage && enResult.hasImage && (frResult.imageId === enResult.imageId),
    'Localisations croisées': frPointsToEn && enPointsToFr
  };
  
  let allGood = true;
  Object.entries(checks).forEach(([check, status]) => {
    console.log(`   ${status ? '✅' : '❌'} ${check}`);
    if (!status) allGood = false;
  });
  
  if (allGood) {
    console.log('\n🎉 SUCCÈS COMPLET!');
    console.log('   ✅ Articles bilingues créés');
    console.log('   ✅ Images automatiques fonctionnelles');
    console.log('   ✅ Localisations correctement liées');
    console.log('   ✅ Système prêt pour la production!');
  } else {
    console.log('\n⚠️ Quelques améliorations possibles détectées');
  }
  
  return allGood;
}

// Lancer la vérification
if (require.main === module) {
  verifyArticlesWithImages()
    .then(success => {
      console.log(`\n🏁 Vérification: ${success ? 'SUCCÈS' : 'PARTIEL'}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Erreur:', error.message);
      process.exit(1);
    });
}