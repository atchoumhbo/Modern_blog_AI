#!/usr/bin/env node

/**
 * Test du système de génération de summaries
 */

const { generateSummary, detectLanguage } = require('./summary-generator');

// Textes de test
const testTexts = {
  french: {
    title: 'Introduction à React.js',
    content: `React est une bibliothèque JavaScript développée par Facebook pour créer des interfaces utilisateur modernes et réactives. 
    
Avec React, vous pouvez construire des applications web dynamiques en utilisant des composants réutilisables. Le concept de Virtual DOM permet d'optimiser les performances en ne mettant à jour que les parties modifiées de l'interface.

Les hooks introduits dans React 16.8 ont révolutionné la façon d'écrire des composants fonctionnels. useState, useEffect et les autres hooks permettent de gérer l'état et les effets de bord sans classes.

React est devenu l'un des frameworks frontend les plus populaires, utilisé par des millions de développeurs dans le monde entier pour créer des applications web performantes et maintenables.`
  },
  
  english: {
    title: 'Getting Started with Docker',
    content: `Docker is a platform designed to help developers build, share, and run modern applications. 
    
With Docker, you can package your application and its dependencies into a container that can run anywhere. This solves the "it works on my machine" problem by ensuring consistency across different environments.

Containers are lightweight, portable, and provide isolation from the host system. They start quickly and use fewer resources than traditional virtual machines.

Docker has become essential in modern DevOps workflows, enabling continuous integration and deployment practices. Major companies like Google, Amazon, and Microsoft use Docker extensively in their infrastructure.`
  }
};

async function runTests() {
  console.log('🧪 === TEST SUMMARY GENERATOR ===\n');

  // Test 1 : Détection de langue
  console.log('📋 Test 1: Détection de langue');
  for (const [lang, text] of Object.entries(testTexts)) {
    const detected = detectLanguage(text.content);
    const status = (lang === 'french' && detected === 'fr') || 
                   (lang === 'english' && detected === 'en') ? '✅' : '❌';
    console.log(`   ${status} ${lang.padEnd(10)} -> ${detected}`);
  }

  // Test 2 : Génération avec OpenAI (si clé disponible)
  if (process.env.OPENAI_API_KEY) {
    console.log('\n📋 Test 2: Génération avec OpenAI');
    
    try {
      const result = await generateSummary(
        testTexts.french.content,
        testTexts.french.title,
        {
          provider: 'openai',
          verbose: true
        }
      );

      console.log(`\n   📄 Résultat:`);
      console.log(`      Langue: ${result.languageName}`);
      console.log(`      Longueur: ${result.length} caractères`);
      console.log(`      Summary: "${result.summary}"`);
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }
  } else {
    console.log('\n📋 Test 2: Génération avec OpenAI');
    console.log('   ⚠️  OPENAI_API_KEY non configurée, test sauté');
  }

  // Test 3 : Fallback
  console.log('\n📋 Test 3: Fallback (sans API)');
  const fallbackResult = await generateSummary(
    testTexts.english.content,
    testTexts.english.title,
    {
      provider: 'invalid-provider', // Force le fallback
      verbose: false
    }
  );

  console.log(`   ✅ Fallback actif`);
  console.log(`      Langue: ${fallbackResult.languageName}`);
  console.log(`      Provider: ${fallbackResult.provider}`);
  console.log(`      Summary: "${fallbackResult.summary.substring(0, 100)}..."`);

  // Test 4 : Différentes langues
  console.log('\n📋 Test 4: Support multi-langues');
  const languages = ['fr', 'en', 'es', 'de'];
  for (const lang of languages) {
    const result = await generateSummary(
      testTexts.french.content,
      testTexts.french.title,
      {
        forceLanguage: lang,
        provider: 'fallback',
        verbose: false
      }
    );
    console.log(`   ✅ ${result.languageName.padEnd(10)} (${lang}) - ${result.length} chars`);
  }

  console.log('\n✅ Tests terminés\n');
}

// Exécution
if (require.main === module) {
  runTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = { runTests };
