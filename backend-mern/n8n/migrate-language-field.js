#!/usr/bin/env node

/**
 * Script de migration pour ajouter le champ language aux articles/projets existants
 * Détecte automatiquement la langue basée sur les localisations i18n existantes
 */

const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_N8N_API_TOKEN;

const strapiClient = axios.create({
  baseURL: STRAPI_URL,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function migrateArticles() {
  console.log('📝 === MIGRATION DES ARTICLES ===\n');
  
  try {
    // Récupérer tous les articles (toutes langues)
    console.log('🔍 Récupération des articles existants...');
    const articlesResponse = await strapiClient.get('/api/articles', {
      params: {
        pagination: { pageSize: 100 },
        locale: 'all', // Toutes les langues
        populate: ['localizations']
      }
    });
    
    const articles = articlesResponse.data.data;
    console.log(`✅ Trouvé ${articles.length} articles`);
    
    let updated = 0;
    let errors = 0;
    
    for (const article of articles) {
      const articleId = article.id;
      const currentLocale = article.attributes.locale;
      const title = article.attributes.title;
      const currentLanguage = article.attributes.language;
      
      console.log(`\n📰 Article ${articleId}: "${title}"`);
      console.log(`   🌐 Locale actuel: ${currentLocale}`);
      console.log(`   🔤 Language actuel: ${currentLanguage || 'NON DÉFINI'}`);
      
      // Si le champ language est déjà défini, passer
      if (currentLanguage) {
        console.log(`   ✅ Déjà migré`);
        continue;
      }
      
      // Déterminer la langue basée sur le locale i18n
      let targetLanguage = 'fr'; // Par défaut français
      
      if (currentLocale === 'en') {
        targetLanguage = 'en';
      } else if (currentLocale === 'fr') {
        targetLanguage = 'fr';
      } else {
        // Si pas de locale claire, essayer de deviner par le contenu du titre
        const titleLower = title.toLowerCase();
        const englishWords = ['the', 'and', 'with', 'for', 'to', 'in', 'of', 'a', 'is', 'how', 'complete', 'guide'];
        const frenchWords = ['le', 'la', 'les', 'et', 'avec', 'pour', 'dans', 'de', 'du', 'des', 'comment', 'guide'];
        
        const englishScore = englishWords.filter(word => titleLower.includes(word)).length;
        const frenchScore = frenchWords.filter(word => titleLower.includes(word)).length;
        
        if (englishScore > frenchScore) {
          targetLanguage = 'en';
          console.log(`   🤖 Détecté comme anglais (score: ${englishScore} vs ${frenchScore})`);
        } else {
          console.log(`   🤖 Détecté comme français (score: ${frenchScore} vs ${englishScore})`);
        }
      }
      
      try {
        // Mettre à jour l'article avec le champ language
        await strapiClient.put(`/api/articles/${articleId}`, {
          data: {
            language: targetLanguage
          },
          locale: currentLocale // Important : spécifier le locale pour la mise à jour
        });
        
        console.log(`   ✅ Mis à jour avec language: ${targetLanguage}`);
        updated++;
        
      } catch (error) {
        console.error(`   ❌ Erreur mise à jour: ${error.message}`);
        errors++;
      }
      
      // Pause pour éviter de surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Résumé articles:`);
    console.log(`   ✅ Mis à jour: ${updated}`);
    console.log(`   ❌ Erreurs: ${errors}`);
    console.log(`   📝 Total: ${articles.length}`);
    
  } catch (error) {
    console.error('❌ Erreur récupération articles:', error.message);
  }
}

async function migrateProjects() {
  console.log('\n🚀 === MIGRATION DES PROJETS ===\n');
  
  try {
    // Récupérer tous les projets
    console.log('🔍 Récupération des projets existants...');
    const projectsResponse = await strapiClient.get('/api/projects', {
      params: {
        pagination: { pageSize: 100 },
        locale: 'all',
        populate: ['localizations']
      }
    });
    
    const projects = projectsResponse.data.data;
    console.log(`✅ Trouvé ${projects.length} projets`);
    
    let updated = 0;
    let errors = 0;
    
    for (const project of projects) {
      const projectId = project.id;
      const currentLocale = project.attributes.locale;
      const title = project.attributes.title;
      const currentLanguage = project.attributes.language;
      
      console.log(`\n🚀 Projet ${projectId}: "${title}"`);
      console.log(`   🌐 Locale actuel: ${currentLocale}`);
      console.log(`   🔤 Language actuel: ${currentLanguage || 'NON DÉFINI'}`);
      
      if (currentLanguage) {
        console.log(`   ✅ Déjà migré`);
        continue;
      }
      
      // Même logique que pour les articles
      let targetLanguage = currentLocale === 'en' ? 'en' : 'fr';
      
      try {
        await strapiClient.put(`/api/projects/${projectId}`, {
          data: {
            language: targetLanguage
          },
          locale: currentLocale
        });
        
        console.log(`   ✅ Mis à jour avec language: ${targetLanguage}`);
        updated++;
        
      } catch (error) {
        console.error(`   ❌ Erreur mise à jour: ${error.message}`);
        errors++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Résumé projets:`);
    console.log(`   ✅ Mis à jour: ${updated}`);
    console.log(`   ❌ Erreurs: ${errors}`);
    console.log(`   🚀 Total: ${projects.length}`);
    
  } catch (error) {
    console.error('❌ Erreur récupération projets:', error.message);
  }
}

async function runMigration() {
  console.log('🔄 === MIGRATION CHAMPS LANGUAGE ===\n');
  console.log('📋 Cette migration va:');
  console.log('   1. Ajouter le champ "language" aux articles existants');
  console.log('   2. Ajouter le champ "language" aux projets existants');
  console.log('   3. Détecter automatiquement la langue (fr/en)');
  console.log('   4. Ne pas modifier les contenus existants\n');
  
  if (!API_TOKEN) {
    console.error('❌ STRAPI_N8N_API_TOKEN manquant dans .env');
    return false;
  }
  
  try {
    // Test de connexion
    await strapiClient.get('/api/articles?pagination[pageSize]=1');
    console.log('✅ Connexion Strapi OK\n');
    
    // Migration des articles
    await migrateArticles();
    
    // Migration des projets  
    await migrateProjects();
    
    console.log('\n🎉 Migration terminée avec succès!');
    console.log('💡 Vous pouvez maintenant rendre le champ obligatoire dans les schémas');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur de connexion Strapi:', error.message);
    console.error('💡 Assurez-vous que Strapi est démarré (npm run dev)');
    return false;
  }
}

// Lancer la migration
if (require.main === module) {
  runMigration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Erreur critique:', error.message);
      process.exit(1);
    });
}

module.exports = { runMigration };