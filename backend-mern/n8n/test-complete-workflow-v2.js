#!/usr/bin/env node

/**
 * Test complet du workflow V2 : Reddit -> Article + Image V2 + Summary -> Strapi
 * 
 * Fonctionnalités:
 * - Récupère un post Reddit
 * - Génère un article avec Perplexity/OpenAI
 * - Génère une image avec le système V2 (contextes intelligents)
 * - Génère un summary automatique (détection de langue)
 * - Publie l'ensemble dans Strapi
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs').promises;
const path = require('path');
const { imageGenerator } = require('./v2');

// Configuration
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_N8N_API_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

/**
 * Détecte la langue d'un texte
 */
function detectLanguage(text) {
  const languagePatterns = {
    'fr': /\b(le|la|les|un|une|des|et|ou|dans|pour|avec|sur|par)\b/gi,
    'en': /\b(the|a|an|and|or|in|for|with|on|by|at)\b/gi,
    'es': /\b(el|la|los|las|un|una|y|o|en|para|con)\b/gi,
    'de': /\b(der|die|das|ein|eine|und|oder|in|für|mit)\b/gi
  };

  const scores = {};
  for (const [lang, pattern] of Object.entries(languagePatterns)) {
    const matches = text.match(pattern);
    scores[lang] = matches ? matches.length : 0;
  }

  const detectedLang = Object.keys(scores).reduce((a, b) => 
    scores[a] > scores[b] ? a : b
  );

  return detectedLang;
}

/**
 * Génère un summary automatique avec détection de langue
 */
async function generateSummary(content, title) {
  console.log('📊 Génération du summary...');
  
  // Détection de la langue
  const language = detectLanguage(content);
  const langNames = {
    'fr': 'français',
    'en': 'anglais',
    'es': 'espagnol',
    'de': 'allemand'
  };
  
  console.log(`   🌍 Langue détectée: ${langNames[language]}`);

  const prompts = {
    'fr': `Résume cet article en 2-3 phrases courtes et percutantes en français:\n\nTitre: ${title}\n\nContenu: ${content.substring(0, 2000)}`,
    'en': `Summarize this article in 2-3 short, punchy sentences in English:\n\nTitle: ${title}\n\nContent: ${content.substring(0, 2000)}`,
    'es': `Resume este artículo en 2-3 frases cortas e impactantes en español:\n\nTítulo: ${title}\n\nContenido: ${content.substring(0, 2000)}`,
    'de': `Fasse diesen Artikel in 2-3 kurzen, prägnanten Sätzen auf Deutsch zusammen:\n\nTitel: ${title}\n\nInhalt: ${content.substring(0, 2000)}`
  };

  try {
    // Utiliser OpenAI pour générer le summary
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en résumés concis et percutants. Crée des résumés de 2-3 phrases maximum.'
          },
          {
            role: 'user',
            content: prompts[language]
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const summary = response.data.choices[0].message.content.trim();
    console.log(`   ✅ Summary généré (${summary.length} caractères)`);
    console.log(`   📝 "${summary.substring(0, 100)}..."`);
    
    return {
      summary,
      language,
      languageName: langNames[language]
    };
  } catch (error) {
    console.error('   ❌ Erreur génération summary:', error.message);
    
    // Fallback: premier paragraphe
    const firstParagraph = content.split('\n\n')[0];
    const fallbackSummary = firstParagraph.substring(0, 200) + '...';
    
    return {
      summary: fallbackSummary,
      language,
      languageName: langNames[language]
    };
  }
}

/**
 * Récupère des posts Reddit
 */
async function getRedditPosts(subreddit = 'reactjs', limit = 5) {
  console.log(`\n📡 Récupération de posts Reddit (r/${subreddit})...`);
  
  try {
    // Authentification Reddit
    const authResponse = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      'grant_type=client_credentials',
      {
        auth: {
          username: process.env.REDDIT_CLIENT_ID,
          password: process.env.REDDIT_CLIENT_SECRET
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'BlogBot/1.0'
        }
      }
    );

    const accessToken = authResponse.data.access_token;

    // Récupérer les posts
    const postsResponse = await axios.get(
      `https://oauth.reddit.com/r/${subreddit}/hot`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'BlogBot/1.0'
        },
        params: { limit }
      }
    );

    const posts = postsResponse.data.data.children
      .map(child => child.data)
      .filter(post => !post.is_video && !post.stickied && post.score >= 20);

    console.log(`   ✅ ${posts.length} posts récupérés`);
    return posts;
  } catch (error) {
    console.error('   ❌ Erreur Reddit:', error.message);
    throw error;
  }
}

/**
 * Génère un article avec Perplexity
 */
async function generateArticleContent(title, subreddit) {
  console.log('\n✍️  Génération de l\'article avec Perplexity...');
  
  try {
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en rédaction d\'articles techniques. Écris des articles bien structurés avec introduction, développement et conclusion.'
          },
          {
            role: 'user',
            content: `Écris un article détaillé (600-800 mots) sur le sujet: "${title}". 
            
Contexte: Article pour r/${subreddit}

Structure attendue:
- Introduction engageante
- 3-4 sections principales avec exemples
- Conclusion avec takeaways

Format: Markdown avec headers (##), listes, et code blocks si pertinent.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    console.log(`   ✅ Article généré (${content.length} caractères)`);
    
    return content;
  } catch (error) {
    console.error('   ❌ Erreur Perplexity:', error.message);
    throw error;
  }
}

/**
 * Upload une image vers Strapi
 */
async function uploadImageToStrapi(imagePath, filename) {
  console.log('\n📤 Upload de l\'image vers Strapi...');
  
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const formData = new FormData();
    formData.append('files', imageBuffer, {
      filename,
      contentType: 'image/png'
    });

    const response = await axios.post(
      `${STRAPI_URL}/api/upload`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${STRAPI_TOKEN}`,
          ...formData.getHeaders()
        }
      }
    );

    const uploadedImage = response.data[0];
    console.log(`   ✅ Image uploadée (ID: ${uploadedImage.id})`);
    
    return uploadedImage;
  } catch (error) {
    console.error('   ❌ Erreur upload:', error.message);
    throw error;
  }
}

/**
 * Crée un article dans Strapi
 */
async function createStrapiArticle(articleData) {
  console.log('\n📝 Création de l\'article dans Strapi...');
  
  try {
    const response = await axios.post(
      `${STRAPI_URL}/api/articles`,
      articleData,
      {
        headers: {
          'Authorization': `Bearer ${STRAPI_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`   ✅ Article créé (ID: ${response.data.data.id})`);
    return response.data.data;
  } catch (error) {
    console.error('   ❌ Erreur création article:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Workflow complet
 */
async function runCompleteWorkflowV2() {
  console.log('🚀 === TEST WORKFLOW COMPLET V2 ===\n');
  
  // Vérifier les clés API
  const requiredKeys = {
    'Reddit': process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET,
    'Perplexity': PERPLEXITY_API_KEY,
    'OpenAI': OPENAI_API_KEY,
    'Stability AI': process.env.STABILITY_API_KEY,
    'Strapi': STRAPI_TOKEN
  };

  console.log('🔑 Vérification des APIs:');
  let missing = 0;
  for (const [api, configured] of Object.entries(requiredKeys)) {
    const status = configured ? '✅' : '❌';
    console.log(`   ${status} ${api}`);
    if (!configured) missing++;
  }

  if (missing > 0) {
    console.error(`\n❌ ${missing} API(s) manquante(s). Impossible de continuer.`);
    process.exit(1);
  }

  try {
    // 1. Récupérer un post Reddit
    const posts = await getRedditPosts('reactjs', 5);
    const selectedPost = posts[0];
    
    console.log(`\n📌 Post sélectionné:`);
    console.log(`   Titre: ${selectedPost.title}`);
    console.log(`   Score: ${selectedPost.score}`);
    console.log(`   Subreddit: r/${selectedPost.subreddit}`);

    // 2. Générer l'article
    const articleContent = await generateArticleContent(
      selectedPost.title,
      selectedPost.subreddit
    );

    // 3. Générer le summary avec détection de langue
    const { summary, language, languageName } = await generateSummary(
      articleContent,
      selectedPost.title
    );

    // 4. Générer l'image avec V2
    console.log('\n🎨 Génération de l\'image (V2)...');
    const imageResult = await imageGenerator.generateArticleImage(
      selectedPost.title,
      selectedPost.subreddit,
      {
        provider: 'stability-ai',
        aspectRatio: '16:9',
        outputFormat: 'png',
        quality: 85,
        enableCache: true,
        enableOptimization: false
      }
    );

    console.log(`   ✅ Image générée:`);
    console.log(`      Fichier: ${imageResult.filename}`);
    console.log(`      Coût: $${imageResult.cost.toFixed(4)}`);
    console.log(`      Temps: ${imageResult.generationTime.toFixed(2)}s`);
    console.log(`      Catégorie: ${imageResult.metadata.category}`);

    // 5. Upload de l'image vers Strapi
    const uploadedImage = await uploadImageToStrapi(
      imageResult.path,
      imageResult.filename
    );

    // 6. Créer le slug
    const slug = selectedPost.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);

    // 7. Créer l'article dans Strapi
    const articleData = {
      data: {
        title: selectedPost.title,
        slug,
        content: articleContent,
        excerpt: summary,  // Summary comme excerpt
        featured_image: uploadedImage.id,
        status: 'draft',
        language,  // Langue détectée
        metadata: {
          redditUrl: `https://reddit.com${selectedPost.permalink}`,
          redditScore: selectedPost.score,
          subreddit: selectedPost.subreddit,
          imageProvider: imageResult.provider,
          imageCost: imageResult.cost,
          imageCategory: imageResult.metadata.category,
          summaryLanguage: languageName
        }
      }
    };

    const createdArticle = await createStrapiArticle(articleData);

    // 8. Résumé final
    console.log('\n' + '='.repeat(60));
    console.log('✅ WORKFLOW COMPLET V2 - SUCCÈS !');
    console.log('='.repeat(60));
    console.log(`\n📊 Résumé:`);
    console.log(`   📝 Article: ${selectedPost.title}`);
    console.log(`   🌍 Langue: ${languageName}`);
    console.log(`   📄 Summary: "${summary.substring(0, 80)}..."`);
    console.log(`   🎨 Image: ${imageResult.filename}`);
    console.log(`   💰 Coût image: $${imageResult.cost.toFixed(4)}`);
    console.log(`   ⏱️  Temps image: ${imageResult.generationTime.toFixed(2)}s`);
    console.log(`   🆔 Article Strapi ID: ${createdArticle.id}`);
    console.log(`   🔗 URL: ${STRAPI_URL}/api/articles/${createdArticle.id}`);
    console.log('');

    return {
      success: true,
      article: createdArticle,
      image: imageResult,
      summary,
      language: languageName
    };
  } catch (error) {
    console.error('\n❌ Erreur workflow:', error.message);
    if (error.stack) {
      console.error('\n📋 Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Exécution si appelé directement
if (require.main === module) {
  runCompleteWorkflowV2()
    .then(() => {
      console.log('✅ Test terminé avec succès');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur fatale:', error.message);
      process.exit(1);
    });
}

module.exports = { runCompleteWorkflowV2, generateSummary, detectLanguage };
