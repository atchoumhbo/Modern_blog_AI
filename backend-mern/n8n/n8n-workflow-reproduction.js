#!/usr/bin/env node

/**
 * Reddit Tech Problem Analysis & Content Generation with Strapi
 * Reproduction exacte du workflow N8N en Node.js
 */

const axios = require('axios');
const path = require('path');
const { detectLanguage, translateArticle, generateSlug } = require('./translation-service');
const RedditTracker = require('./reddit-tracker');
const { generateArticleImage } = require('./image-generator-sd3');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuration enrichie avec support complet Strapi
const CONFIG = {
  // Reddit
  REDDIT_SUBREDDITS: ['webdev', 'programming', 'javascript', 'reactjs', 'nextjs', 'learnprogramming', 'node', 'Frontend'],
  REDDIT_KEYWORDS: ['best practices', 'tutorial', 'guide', 'tips', 'how to', 'lessons learned', 'mistakes', 'error', 'issue'],
  REDDIT_LIMIT: 50,
  MIN_SCORE: 30,
  MIN_COMMENTS: 3,
  
  // Strapi
  TUNNEL_URL: process.env.CLOUDFLARE_TUNNEL_URL || 'http://localhost:1337',
  STRAPI_TOKEN: process.env.STRAPI_N8N_API_TOKEN || 'a4239ed0a52427929d703538e1c298a37b088db1a2f859c17015d5eb150a64b1b5195d8287184867af8ecb923f3bcfec83cd238f18b9b3f4349fbd885edb243a7349adbe7b2c00f14aa453e12a4e003c8286f1393cb60eebb67635845390575185092c7cb277b17a565c3099c9477487d2f615323dd40226c18471f46d8176af',
  
  // Mapping Subreddit -> Catégorie
  SUBREDDIT_CATEGORIES: {
    'webdev': { name: 'Développement Web', color: '#3B82F6', icon: 'globe' },
    'programming': { name: 'Programmation', color: '#EF4444', icon: 'code' },
    'javascript': { name: 'JavaScript', color: '#F59E0B', icon: 'js' },
    'reactjs': { name: 'React', color: '#06B6D4', icon: 'react' },
    'nextjs': { name: 'Next.js', color: '#1F2937', icon: 'nextjs' },
    'learnprogramming': { name: 'Apprentissage', color: '#10B981', icon: 'book' },
    'node': { name: 'Node.js', color: '#22C55E', icon: 'nodejs' },
    'Frontend': { name: 'Frontend', color: '#8B5CF6', icon: 'layout' }
  },
  
  // Auteur par défaut (doit exister dans Strapi Users)
  DEFAULT_AUTHOR_ID: 1, // À ajuster selon votre instance
  
  // Génération contenu
  TARGET_WORD_COUNT: 800,
  READING_TIME_WPM: 200
};

// Clients API
const redditClient = axios.create({
  baseURL: 'https://www.reddit.com',
  headers: { 'User-Agent': 'ContentBot/1.0' }
});

const perplexityClient = axios.create({
  baseURL: 'https://api.perplexity.ai',
  headers: {
    'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

const openaiClient = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

const strapiClient = axios.create({
  baseURL: CONFIG.TUNNEL_URL,
  headers: {
    'Authorization': `Bearer ${CONFIG.STRAPI_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Instance du tracker
const tracker = new RedditTracker();

// === GESTION CATEGORIES & TAGS ===

async function getOrCreateCategory(subreddit) {
  const categoryConfig = CONFIG.SUBREDDIT_CATEGORIES[subreddit];
  if (!categoryConfig) {
    console.log(`⚠️ Pas de mapping de catégorie pour ${subreddit}`);
    return null;
  }

  try {
    // Chercher si la catégorie existe déjà
    const searchResponse = await strapiClient.get('/api/categories', {
      params: {
        'filters[name][$eq]': categoryConfig.name,
        'populate': '*'
      }
    });

    if (searchResponse.data.data.length > 0) {
      console.log(`✅ Catégorie existante trouvée: ${categoryConfig.name}`);
      return searchResponse.data.data[0].id;
    }

    // Créer la catégorie si elle n'existe pas
    const slug = categoryConfig.name.toLowerCase()
      .replace(/[éèêë]/g, 'e')
      .replace(/[àâä]/g, 'a')
      .replace(/[ùûü]/g, 'u')
      .replace(/[îï]/g, 'i')
      .replace(/[ôö]/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const createResponse = await strapiClient.post('/api/categories', {
      data: {
        name: categoryConfig.name,
        slug: slug,
        description: `Catégorie pour les articles du subreddit r/${subreddit}`,
        color: categoryConfig.color,
        icon: categoryConfig.icon
      }
    });

    console.log(`✅ Catégorie créée: ${categoryConfig.name} (ID: ${createResponse.data.data.id})`);
    return createResponse.data.data.id;

  } catch (error) {
    console.error(`❌ Erreur gestion catégorie:`, error.response?.data || error.message);
    return null;
  }
}

async function getOrCreateTags(tagNames) {
  const tagIds = [];
  
  for (const tagName of tagNames) {
    try {
      // Chercher si le tag existe déjà
      const searchResponse = await strapiClient.get('/api/tags', {
        params: {
          'filters[name][$eq]': tagName,
          'populate': '*'
        }
      });

      let tagId;
      if (searchResponse.data.data.length > 0) {
        tagId = searchResponse.data.data[0].id;
        console.log(`✅ Tag existant trouvé: ${tagName}`);
      } else {
        // Créer le tag s'il n'existe pas
        const slug = tagName.toLowerCase()
          .replace(/[éèêë]/g, 'e')
          .replace(/[àâä]/g, 'a')
          .replace(/[ùûü]/g, 'u')
          .replace(/[îï]/g, 'i')
          .replace(/[ôö]/g, 'o')
          .replace(/ç/g, 'c')
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        const createResponse = await strapiClient.post('/api/tags', {
          data: {
            name: tagName,
            slug: slug,
            color: '#6B7280'
          }
        });

        tagId = createResponse.data.data.id;
        console.log(`✅ Tag créé: ${tagName} (ID: ${tagId})`);
      }

      tagIds.push(tagId);
    } catch (error) {
      console.error(`❌ Erreur gestion tag ${tagName}:`, error.response?.data || error.message);
    }
  }

  return tagIds;
}

/**
 * 1. Reddit - Recherche problèmes tech
 */
async function searchRedditPosts() {
  console.log('🔍 Reddit - Recherche multi-subreddits enrichie...');
  
  let allPosts = [];
  
  for (const subreddit of CONFIG.REDDIT_SUBREDDITS) {
    try {
      console.log(`📡 Scanning r/${subreddit}...`);
      
      // Recherche par mots-clés
      for (const keyword of CONFIG.REDDIT_KEYWORDS.slice(0, 2)) { // Limiter pour éviter rate limit
        const url = `/r/${subreddit}/search.json`;
        const params = {
          q: keyword,
          restrict_sr: true,
          sort: 'relevance',
          limit: 10,
          type: 'link',
          t: 'week' // Posts de la semaine
        };

        const response = await redditClient.get(url, { params });
        const posts = response.data.data.children
          .map(child => ({
            id: child.data.id,
            title: child.data.title,
            selftext: child.data.selftext,
            url: child.data.url,
            score: child.data.score,
            num_comments: child.data.num_comments,
            subreddit: child.data.subreddit,
            subreddit_name_prefixed: child.data.subreddit_name_prefixed,
            created_utc: child.data.created_utc,
            permalink: `https://reddit.com${child.data.permalink}`,
            author: child.data.author,
            link_flair_text: child.data.link_flair_text,
            upvote_ratio: child.data.upvote_ratio,
            over_18: child.data.over_18,
            is_self: child.data.is_self,
            domain: child.data.domain,
            thumbnail: child.data.thumbnail !== 'self' && child.data.thumbnail !== 'default' ? child.data.thumbnail : null
          }))
          .filter(post => 
            post.score >= CONFIG.MIN_SCORE && 
            post.num_comments >= CONFIG.MIN_COMMENTS &&
            !post.over_18 &&
            post.selftext && post.selftext.length > 100 // Posts avec contenu
          );
        
        allPosts.push(...posts);
        
        // Délai pour éviter rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`❌ Erreur r/${subreddit}:`, error.message);
    }
  }
  
  // Déduplication et tri par score
  const uniquePosts = allPosts.reduce((acc, post) => {
    if (!acc.find(p => p.id === post.id)) {
      acc.push(post);
    }
    return acc;
  }, []).sort((a, b) => b.score - a.score);
  
  console.log(`✅ Trouvé ${uniquePosts.length} posts uniques`);
  return uniquePosts.slice(0, CONFIG.REDDIT_LIMIT);
}

/**
 * 2. Filtrer et analyser les posts
 */
async function filterAndAnalyzePosts(posts) {
  console.log('🔍 Filtrage et analyse des posts...');
  
  // Filtrer les posts non traités
  const unprocessedPosts = await tracker.filterUnprocessedPosts(posts);
  console.log(`📊 ${unprocessedPosts.length}/${posts.length} posts non traités`);

  if (unprocessedPosts.length === 0) {
    console.log('ℹ️ Tous les posts ont déjà été traités');
    return [];
  }

  // Calcul du score d'impact (reproduction exacte du workflow N8N)
  const analyzedPosts = unprocessedPosts.map(post => {
    const baseScore = post.score * 10;
    const commentBonus = post.num_comments * 5;
    const titleLength = post.title.length;
    const contentLength = (post.selftext || '').length;
    
    const impactScore = baseScore + commentBonus + Math.min(titleLength, 100) + Math.min(contentLength / 10, 50);
    const processingPriority = impactScore * (contentLength > 100 ? 1.2 : 1.0);

    return {
      ...post,
      impactScore: Math.round(impactScore),
      processingPriority: Math.round(processingPriority),
      contentLength,
      titleLength
    };
  });

  // Trier par priorité de traitement
  analyzedPosts.sort((a, b) => b.processingPriority - a.processingPriority);
  
  console.log(`✅ Posts analysés et triés par priorité`);
  return analyzedPosts;
}

/**
 * 3. Sélectionner le post principal
 */
function selectMainPost(posts) {
  if (posts.length === 0) return null;
  
  const mainPost = posts[0];
  console.log(`🎯 Post sélectionné: "${mainPost.title}" (Score: ${mainPost.processingPriority})`);
  
  return mainPost;
}

/**
 * 4. Perplexity - Analyser et trouver URLs
 */
async function analyzeWithPerplexity(post) {
  console.log('🤖 Perplexity - Analyse et recherche URLs...');
  
  const prompt = `Analysez ce problème technique Reddit et trouvez des sources fiables:

Titre: ${post.title}
Contenu: ${post.selftext}
Subreddit: ${post.subreddit}

Fournissez une analyse JSON avec:
- Un résumé technique du problème
- 3-5 URLs de sources fiables (documentation officielle, Microsoft, Stack Overflow, etc.)
- Le contexte technique nécessaire
- Les solutions potentielles

Format de réponse OBLIGATOIRE en JSON:
{
  "summary": "Résumé technique du problème",
  "technicalContext": "Contexte technique détaillé",
  "sources": [
    {"url": "https://...", "title": "Titre", "relevance": "Description"},
    {"url": "https://...", "title": "Titre", "relevance": "Description"}
  ],
  "potentialSolutions": ["Solution 1", "Solution 2"]
}`;

  try {
    const response = await perplexityClient.post('/chat/completions', {
      model: 'sonar-pro',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    // Nettoyer la réponse qui peut contenir des blocs markdown
    let content = response.data.choices[0].message.content;
    console.log('🔍 Réponse brute Perplexity:', content.substring(0, 200) + '...');
    
    // Extraire le JSON des blocs markdown si présent
    const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      content = jsonMatch[1].trim();
      console.log('✂️ JSON extrait des blocs markdown');
    }
    
    // Nettoyer les caractères indésirables
    content = content.replace(/^[^\{]*/, '').replace(/[^\}]*$/, '');
    
    const analysis = JSON.parse(content);
    console.log(`✅ Analyse Perplexity terminée - ${analysis.sources?.length || 0} sources trouvées`);
    
    // 📋 LOGGING DÉTAILLÉ DES URLs PROPOSÉES PAR PERPLEXITY
    if (analysis.sources && analysis.sources.length > 0) {
      console.log('\n📌 URLs PROPOSÉES PAR PERPLEXITY:');
      console.log('================================');
      analysis.sources.forEach((source, index) => {
        console.log(`${index + 1}. 🔗 ${source.url}`);
        console.log(`   📝 Titre: ${source.title}`);
        console.log(`   💡 Pertinence: ${source.relevance}`);
        console.log('');
      });
      console.log('================================\n');
    } else {
      console.log('⚠️ Aucune source URL trouvée dans la réponse Perplexity');
    }
    
    return analysis;
  } catch (error) {
    console.error('❌ Erreur Perplexity:', error.message);
    return {
      summary: `Problème technique: ${post.title}`,
      technicalContext: post.selftext || 'Contexte non disponible',
      sources: [],
      potentialSolutions: ['Consulter la documentation officielle']
    };
  }
}

/**
 * 5. Générer l'article final
 */
async function generateFinalArticle(post, analysis) {
  console.log('✍️ Génération de l\'article final...');
  
  const prompt = `Créez un article technique professionnel basé sur cette analyse:

**Problème Reddit:**
Titre: ${post.title}
Contenu: ${post.selftext}
Score: ${post.score} | Commentaires: ${post.num_comments}

**Analyse Perplexity:**
${JSON.stringify(analysis, null, 2)}

**Instructions:**
- Rédigez un article technique complet et professionnel
- Format Markdown avec titres, sous-titres, paragraphes
- Introduction, développement, solutions, conclusion
- Intégrez les sources de l'analyse
- Ton professionnel et informatif
- Longueur: 800-1200 mots
- Optimisé SEO avec mots-clés techniques

**IMPORTANT - Format Markdown:**
- Utilisez ### pour les sous-sections (pas de listes numérotées 1., 2., 3.)
- Chaque point doit être un titre ### suivi du texte sur la même ligne ou en paragraphe
- Pas de retour à la ligne entre le numéro et le texte
- Utilisez des listes à puces (-) pour les énumérations courtes

**Structure requise:**
# [Titre accrocheur]

## Introduction
[Présentation du problème en 2-3 paragraphes]

## Contexte Technique
[Détails techniques en paragraphes]

## Analyse du Problème
[Analyse approfondie avec sous-sections ###]

## Solutions Recommandées

### Solution 1: [Nom descriptif]
[Description complète de la solution en paragraphe]

### Solution 2: [Nom descriptif]
[Description complète de la solution en paragraphe]

## Ressources Complémentaires
- [Lien 1 avec description](url)
- [Lien 2 avec description](url)

## Conclusion
[Résumé et recommandations en paragraphes]`;

  try {
    const response = await openaiClient.post('/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const article = response.data.choices[0].message.content;
    console.log('✅ Article généré avec succès');
    
    return article;
  } catch (error) {
    console.error('❌ Erreur génération OpenAI:', error.message);
    throw error;
  }
}

/**
 * 6. Publier dans Strapi avec données enrichies (versions FR et EN)
 */
async function publishToStrapi(post, article) {
  console.log('📝 Publication enrichie dans Strapi...');
  
  try {
    // Détecter la langue de l'article
    const detectedLang = await detectLanguage(article);
    console.log(`🔍 Langue détectée: ${detectedLang}`);

    // Extraire le titre depuis l'article
    const titleMatch = article.match(/^#\s+(.+)$/m);
    const articleTitle = titleMatch ? titleMatch[1] : post.title;

    // Générer l'excerpt à partir du contenu
    const excerptMatch = article.match(/^##?\s+Introduction\s*\n(.+?)(?=\n\n|$)/s);
    let excerpt = excerptMatch ? excerptMatch[1].trim() : '';
    if (!excerpt || excerpt.length < 50) {
      // Fallback: prendre les premiers paragraphes
      const paragraphs = article.split('\n\n').filter(p => !p.startsWith('#') && p.length > 20);
      excerpt = paragraphs[0] || post.title;
    }
    excerpt = excerpt.substring(0, 160); // Limite Strapi

    // Calculer le temps de lecture
    const wordCount = article.split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / CONFIG.READING_TIME_WPM));

    // Préparer catégorie et tags
    const categoryId = await getOrCreateCategory(post.subreddit);
    
    const tagNames = [];
    if (post.link_flair_text) tagNames.push(post.link_flair_text);
    tagNames.push(post.subreddit); // Subreddit comme tag
    if (post.score > 100) tagNames.push('Populaire');
    if (post.num_comments > 20) tagNames.push('Discussion Active');
    
    const tagIds = await getOrCreateTags(tagNames);

    // 🎨 GÉNÉRATION D'IMAGE AUTOMATIQUE SD3
    console.log('🎨 Génération de l\'image d\'illustration avec SD3...');
    let featuredImage = null;
    try {
      const imageResult = await generateArticleImage(
        articleTitle,
        post.subreddit,
        {
          provider: 'stability-ai',
          aspectRatio: '16:9',
          outputFormat: 'png',
          saveLocal: true,
          uploadStrapi: true
        }
      );

      if (imageResult && imageResult.strapi) {
        featuredImage = imageResult.strapi.id;
        console.log(`✅ Image SD3 générée et uploadée - ID Strapi: ${featuredImage}`);
        console.log(`   💰 Coût: $${imageResult.cost.toFixed(4)} via ${imageResult.provider}`);
        console.log(`   ⏱️  Temps: ${imageResult.generationTime}`);
        console.log(`   📄 Fichier: ${imageResult.filename}`);
        console.log(`   🎯 Prompt: ${imageResult.prompt.substring(0, 80)}...`);
        
        if (imageResult.local) {
          console.log(`   💾 Local: ${imageResult.local.size} KB`);
        }
      } else {
        console.log(`⚠️ Échec génération image SD3`);
      }
    } catch (error) {
      console.error('❌ Erreur génération image SD3:', error.message);
      console.log('🔄 Continuons sans image...');
    }

    // Construire les données SEO
    let metaDescription = excerpt.length >= 50 ? excerpt : 
      `${excerpt} - Article généré automatiquement depuis Reddit analysé par IA.`;
    
    // S'assurer que la meta description respecte les limites Strapi (50-155 chars)
    if (metaDescription.length < 50) {
      metaDescription = metaDescription + ' Découvrez les meilleures pratiques et conseils.';
    }
    metaDescription = metaDescription.substring(0, 155); // Limite stricte
    
    const seoData = {
      metaTitle: articleTitle.length > 60 ? articleTitle.substring(0, 57) + '...' : articleTitle,
      metaDescription: metaDescription,
      keywords: tagNames.join(', '),
      canonicalUrl: null,
      preventIndexing: false
    };

    // Données Schema.org
    const schemaData = {
      type: 'BlogPosting',
      headline: articleTitle,
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      wordCount: wordCount
    };

    const strapiIds = {};

    // Publier dans la langue détectée
    const originalSlug = generateSlug(articleTitle, detectedLang, post.id);
    const originalPayload = {
      data: {
        title: articleTitle,
        slug: originalSlug,
        content: article,
        excerpt: excerpt,
        readingTime: readingTime,
        status: 'published',
        publishedAt: new Date().toISOString(),
        locale: detectedLang,
        language: detectedLang, // 🌐 Nouveau champ langue
        viewCount: 0,
        
        // Relations (author optionnel pour éviter erreur)
        category: categoryId,
        tags: tagIds,
        featured_image: featuredImage, // 🖼️ Image générée automatiquement
        
        // Composants
        seo: seoData,
        schema: schemaData
      }
    };

    console.log(`🔍 Envoi payload ${detectedLang}:`, JSON.stringify(originalPayload, null, 2).substring(0, 500));
    
    const originalResponse = await strapiClient.post('/api/articles', originalPayload);
    strapiIds[detectedLang] = originalResponse.data.data.id;
    console.log(`✅ Article publié en ${detectedLang} - ID: ${strapiIds[detectedLang]}`);
    console.log(`   📊 ${wordCount} mots, ${readingTime}min lecture, ${tagNames.length} tags`);

    // Traduire et publier dans l'autre langue
    const targetLang = detectedLang === 'fr' ? 'en' : 'fr';
    console.log(`🔄 Traduction vers ${targetLang}...`);
    
    const translatedArticle = await translateArticle(article, detectedLang, targetLang);
    const translatedTitleMatch = translatedArticle.match(/^#\s+(.+)$/m);
    const translatedTitle = translatedTitleMatch ? translatedTitleMatch[1] : articleTitle;
    
    // Traduire l'excerpt
    const translatedExcerptMatch = translatedArticle.match(/^##?\s+Introduction\s*\n(.+?)(?=\n\n|$)/s);
    let translatedExcerpt = translatedExcerptMatch ? translatedExcerptMatch[1].trim() : '';
    if (!translatedExcerpt || translatedExcerpt.length < 50) {
      const paragraphs = translatedArticle.split('\n\n').filter(p => !p.startsWith('#') && p.length > 20);
      translatedExcerpt = paragraphs[0] || translatedTitle;
    }
    translatedExcerpt = translatedExcerpt.substring(0, 160);

    // SEO pour la traduction
    let translatedMetaDescription = translatedExcerpt.length >= 50 ? translatedExcerpt :
      `${translatedExcerpt} - AI-generated article from Reddit analysis.`;
    
    // S'assurer que la meta description respecte les limites (50-155 chars)
    if (translatedMetaDescription.length < 50) {
      translatedMetaDescription = translatedMetaDescription + ' Discover best practices and tips.';
    }
    translatedMetaDescription = translatedMetaDescription.substring(0, 155);
    
    const translatedSeoData = {
      ...seoData,
      metaTitle: translatedTitle.length > 60 ? translatedTitle.substring(0, 57) + '...' : translatedTitle,
      metaDescription: translatedMetaDescription
    };

    const translatedSlug = generateSlug(translatedTitle, targetLang, post.id);
    const translatedPayload = {
      data: {
        title: translatedTitle,
        slug: translatedSlug,
        content: translatedArticle,
        excerpt: translatedExcerpt,
        readingTime: readingTime,
        status: 'published',
        publishedAt: new Date().toISOString(),
        locale: targetLang,
        language: targetLang, // 🌐 Nouveau champ langue
        viewCount: 0,
        
        // Relations (mêmes IDs, author optionnel)
        category: categoryId,
        tags: tagIds,
        featured_image: featuredImage, // 🖼️ Même image pour les deux langues
        
        // Composants
        seo: translatedSeoData,
        schema: {
          ...schemaData,
          headline: translatedTitle
        }
      }
    };

    const translatedResponse = await strapiClient.post('/api/articles', translatedPayload);
    strapiIds[targetLang] = translatedResponse.data.data.id;
    console.log(`✅ Article traduit publié en ${targetLang} - ID: ${strapiIds[targetLang]}`);

    // Marquer le post comme traité avec toutes les métadonnées
    await tracker.markPostAsProcessed({
      ...post,
      category: categoryId,
      tags: tagIds,
      wordCount: wordCount,
      readingTime: readingTime
    }, strapiIds);
    console.log('✅ Post marqué comme traité avec métadonnées enrichies');

    return strapiIds;

  } catch (error) {
    console.error('❌ Erreur publication Strapi:', error.message);
    if (error.response) {
      console.error('📄 Status:', error.response.status);
      console.error('📄 Détails complets:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.stack) {
      console.error('📚 Stack:', error.stack);
    }
    throw error;
  }
}

/**
 * Workflow principal
 */
async function runWorkflow() {
  console.log('🚀 DÉMARRAGE WORKFLOW N8N - REDDIT → AI → STRAPI');
  console.log('=================================================');
  console.log('');

  try {
    // Statistiques initiales
    const initialStats = await tracker.getStats();
    console.log('📊 Statistiques tracker:', initialStats);
    console.log('');

    // 1. Rechercher les posts Reddit
    const posts = await searchRedditPosts();
    if (posts.length === 0) {
      console.log('❌ Aucun post trouvé');
      return;
    }

    // 2. Filtrer et analyser
    const analyzedPosts = await filterAndAnalyzePosts(posts);
    if (analyzedPosts.length === 0) {
      console.log('ℹ️ Aucun nouveau post à traiter');
      return;
    }

    // 3. Sélectionner le post principal
    const mainPost = selectMainPost(analyzedPosts);
    if (!mainPost) {
      console.log('❌ Aucun post sélectionné');
      return;
    }

    // 4. Analyser avec Perplexity
    const analysis = await analyzeWithPerplexity(mainPost);

    // 5. Générer l'article
    const article = await generateFinalArticle(mainPost, analysis);

    // 6. Publier dans Strapi
    const strapiIds = await publishToStrapi(mainPost, article);

    // Statistiques finales
    const finalStats = await tracker.getStats();
    console.log('');
    console.log('🎉 WORKFLOW TERMINÉ AVEC SUCCÈS!');
    console.log('================================');
    console.log(`📊 Posts traités aujourd'hui: ${finalStats.today}`);
    console.log(`📊 Total posts traités: ${finalStats.total}`);
    console.log(`🔗 Articles Strapi créés:`, strapiIds);

  } catch (error) {
    console.error('❌ ERREUR WORKFLOW:', error.message);
    process.exit(1);
  } finally {
    // Fermer la connexion à la base de données
    tracker.close();
  }
}

// Exécution si appelé directement
if (require.main === module) {
  runWorkflow();
}

module.exports = { runWorkflow };