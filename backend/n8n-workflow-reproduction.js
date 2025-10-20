#!/usr/bin/env node

/**
 * Reddit Tech Problem Analysis & Content Generation with Strapi
 * Reproduction exacte du workflow N8N en Node.js
 */

const axios = require('axios');
require('dotenv').config();

// Configuration exacte du workflow N8N
const CONFIG = {
  REDDIT_SUBREDDIT: 'AskProgramming',
  REDDIT_KEYWORD: 'error issue',
  REDDIT_LIMIT: 50,
  TUNNEL_URL: process.env.CLOUDFLARE_TUNNEL_URL || 'https://proc-improved-cricket-charts.trycloudflare.com',
  STRAPI_TOKEN: process.env.STRAPI_N8N_API_TOKEN || 'a4239ed0a52427929d703538e1c298a37b088db1a2f859c17015d5eb150a64b1b5195d8287184867af8ecb923f3bcfec83cd238f18b9b3f4349fbd885edb243a7349adbe7b2c00f14aa453e12a4e003c8286f1393cb60eebb67635845390575185092c7cb277b17a565c3099c9477487d2f615323dd40226c18471f46d8176af'
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

/**
 * ÉTAPE 1: Reddit - Recherche problèmes tech
 * Reproduction exacte du node Reddit
 */
async function searchRedditPosts() {
  console.log('🔍 Reddit - Recherche problèmes tech');
  
  try {
    const response = await redditClient.get(`/r/${CONFIG.REDDIT_SUBREDDIT}/search.json`, {
      params: {
        q: CONFIG.REDDIT_KEYWORD,
        sort: 'relevance',
        limit: CONFIG.REDDIT_LIMIT,
        restrict_sr: true,
        type: 'link'
      }
    });

    const posts = response.data.data.children.map(child => child.data);
    console.log(`✅ ${posts.length} posts récupérés de r/${CONFIG.REDDIT_SUBREDDIT}`);
    return posts;

  } catch (error) {
    console.error('❌ Erreur Reddit:', error.message);
    throw error;
  }
}

/**
 * ÉTAPE 2: Filtrer et analyser les posts
 * Reproduction exacte du code JavaScript N8N
 */
function filterAndAnalyzePosts(posts) {
  console.log('🔬 Filtrer et analyser les posts');
  
  const processedPosts = [];

  for (const post of posts) {
    // Score d'impact amélioré avec pondération
    const baseScore = (post.ups || 0) + (post.num_comments || 0) * 2;
    const freshnessBonus = (Date.now()/1000 - post.created_utc < 86400) ? 20 : 0;
    const controversyBonus = (post.upvote_ratio && post.upvote_ratio < 0.7) ? 15 : 0;
    const finalImpactScore = baseScore + freshnessBonus + controversyBonus;

    // Filtrer seulement les posts avec impact significatif
    if (finalImpactScore > 25) {
      const extractedKeywords = extractTechnicalKeywords(post.title + ' ' + (post.selftext || ''));
      const contentLength = (post.selftext || post.title).length;
      const estimatedReadingTime = Math.ceil(contentLength / 1000); // chars per minute

      processedPosts.push({
        id: post.id,
        title: post.title,
        content: post.selftext || post.title,
        url: `https://reddit.com${post.permalink}`,
        subreddit: post.subreddit_name_prefixed,
        score: post.ups || 0,
        comments: post.num_comments || 0,
        upvote_ratio: post.upvote_ratio || 1,
        impactScore: finalImpactScore,
        created: new Date(post.created_utc * 1000).toISOString(),
        created_readable: new Date(post.created_utc * 1000).toLocaleDateString('fr-FR'),
        author: post.author,
        keywords: extractedKeywords,
        status: 'candidate',
        contentLength: contentLength,
        estimatedReadingTime: estimatedReadingTime,
        processingPriority: calculateProcessingPriority(finalImpactScore, extractedKeywords),
        seoKeywords: generateSEOKeywords(post.title, extractedKeywords)
      });
    }
  }

  // Trier par score d'impact et priorité
  processedPosts.sort((a, b) => b.processingPriority - a.processingPriority);

  console.log(`✅ ${processedPosts.length} posts traités et filtrés`);
  return processedPosts.slice(0, 20);
}

// Fonctions helper avancées (reproduction exacte N8N)
function extractTechnicalKeywords(text) {
  const advancedTechKeywords = [
    // Langages et frameworks
    'javascript', 'typescript', 'python', 'java', 'csharp', 'golang', 'rust', 'swift', 'kotlin',
    'react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxtjs', 'gatsby', 'express', 'fastapi', 'django',

    // Cloud et DevOps  
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'gitlab-ci',
    'microservices', 'serverless', 'lambda', 'containers', 'orchestration',

    // Databases et Data
    'postgresql', 'mongodb', 'redis', 'elasticsearch', 'mysql', 'sqlite', 'cassandra',
    'graphql', 'rest-api', 'grpc', 'websocket', 'kafka', 'rabbitmq',

    // AI/ML et Modern Tech
    'machine-learning', 'tensorflow', 'pytorch', 'neural-network', 'deep-learning',
    'blockchain', 'cryptocurrency', 'web3', 'smart-contracts', 'nft',

    // Problèmes techniques courants
    'authentication', 'authorization', 'security', 'performance', 'optimization', 
    'debugging', 'testing', 'ci-cd', 'monitoring', 'logging', 'caching',
    'scalability', 'load-balancing', 'high-availability', 'disaster-recovery'
  ];

  const foundKeywords = [];
  const lowerText = text.toLowerCase();

  advancedTechKeywords.forEach(keyword => {
    const variations = [
      keyword,
      keyword.replace('-', ' '),
      keyword.replace('-', ''),
      keyword + 'js', // Pour les frameworks JS
      keyword + '.js'
    ];

    variations.forEach(variation => {
      if (lowerText.includes(variation) && !foundKeywords.includes(keyword)) {
        foundKeywords.push(keyword);
      }
    });
  });

  return foundKeywords.slice(0, 10).join(', ');
}

function calculateProcessingPriority(impactScore, keywords) {
  let priority = impactScore;

  // Bonus pour mots-clés tendance
  const trendingKeywords = ['ai', 'machine-learning', 'kubernetes', 'react', 'python'];
  const keywordArray = keywords.split(', ');

  trendingKeywords.forEach(trending => {
    if (keywordArray.includes(trending)) {
      priority += 10;
    }
  });

  return priority;
}

function generateSEOKeywords(title, techKeywords) {
  const seoTerms = [
    'tutorial', 'guide', 'solution', 'fix', 'how to', 'best practices',
    'troubleshooting', 'development', 'programming', 'code', 'example'
  ];

  const titleWords = title.toLowerCase().split(' ');
  const applicableSEO = seoTerms.filter(term => 
    titleWords.some(word => word.includes(term.split(' ')[0]))
  );

  return [techKeywords, applicableSEO.join(', ')].filter(Boolean).join(', ');
}

/**
 * ÉTAPE 3: Sélectionner le post principal
 * Reproduction exacte du code JavaScript N8N
 */
function selectMainPost(candidates) {
  console.log('🎯 Sélectionner le post principal');
  
  const sortedCandidates = candidates.sort((a, b) => b.processingPriority - a.processingPriority);

  if (sortedCandidates.length === 0) {
    throw new Error('Aucun post candidat trouvé');
  }

  const selectedPost = sortedCandidates[0];

  // Enrichir avec métadonnées de sélection
  const enrichedPost = {
    ...selectedPost,
    selectedAt: new Date().toISOString(),
    selectionRank: 1,
    totalCandidates: sortedCandidates.length,
    competitionLevel: sortedCandidates.length > 10 ? 'high' : sortedCandidates.length > 5 ? 'medium' : 'low',
    expectedPerformance: selectedPost.processingPriority > 100 ? 'excellent' : 
                        selectedPost.processingPriority > 50 ? 'good' : 'average'
  };

  console.log(`✅ Post sélectionné: "${enrichedPost.title}" avec priorité ${enrichedPost.processingPriority}`);
  return enrichedPost;
}

/**
 * ÉTAPE 4: Perplexity - Analyser et trouver URLs
 * Reproduction exacte de la requête N8N
 */
async function analyzeWithPerplexity(selectedPost) {
  console.log('🔍 Perplexity - Analyser et trouver URLs');
  
  const payload = {
    model: "sonar-pro",
    messages: [
      {
        role: "system",
        content: "Tu es un chercheur expert qui trouve les meilleures sources techniques officielles selon le domaine."
      },
      {
        role: "user", 
        content: `Trouve 5 sources techniques autorisées pour : ${selectedPost.title}

SUBREDDIT : ${selectedPost.subreddit}
CONTEXTE : ${selectedPost.content}

ADAPTE tes sources selon le domaine :
- r/sysadmin → Microsoft Learn, TechNet, PowerShell docs
- r/networking → Cisco, Juniper, RFC documentation  
- r/cybersecurity → NIST, OWASP, vendor security guides
- r/devops → Docker docs, K8s docs, AWS documentation
- r/kubernetes → CNCF docs, K8s official, vendor guides
- r/AskProgramming → Official language docs, GitHub, Stack Overflow

Fournis URLs + titres des meilleures ressources pour ce problème spécifique.

Réponds en JSON:
{
  "urls": ["url1", "url2", "url3", "url4", "url5"],
  "titles": ["title1", "title2", "title3", "title4", "title5"]
}`
      }
    ],
    temperature: 0.3,
    max_tokens: 1500
  };

  try {
    const response = await perplexityClient.post('/chat/completions', payload);
    console.log('✅ Analyse Perplexity terminée');
    return response.data;
  } catch (error) {
    console.error('❌ Erreur Perplexity:', error.message);
    throw error;
  }
}

/**
 * ÉTAPE 5: Extraire les URLs
 * Reproduction exacte du code JavaScript N8N
 */
function extractUrls(perplexityResponse, originalPost) {
  console.log('📋 Extraire les URLs');
  
  // Parser la réponse JSON de Perplexity
  let parsedResponse;
  try {
    const responseContent = perplexityResponse.choices[0].message.content;
    // Nettoyer le JSON (enlever les backticks markdown et autres caractères)
    let cleanJson = responseContent
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/``````/g, '')
      .replace(/`/g, '')
      .trim();
    
    // Si le contenu commence par { et finit par }, extraire seulement cette partie
    const jsonStart = cleanJson.indexOf('{');
    const jsonEnd = cleanJson.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanJson = cleanJson.substring(jsonStart, jsonEnd + 1);
    }
    
    parsedResponse = JSON.parse(cleanJson);
  } catch (parseError) {
    console.log('Erreur parsing JSON, utilisation fallback');
    // Fallback: extraire les URLs des citations
    const citations = perplexityResponse.citations || [];
    parsedResponse = {
      urls: citations.slice(0, 5),
      titles: citations.slice(0, 5).map((url, i) => `Source Microsoft ${i + 1}`)
    };
  }

  const urls = parsedResponse.urls || [];
  const titles = parsedResponse.titles || [];
  const validatedUrls = [];

  // Valider et enrichir les URLs
  for (let i = 0; i < Math.min(urls.length, 5); i++) {
    const url = urls[i];
    const title = titles[i] || `Source ${i + 1}`;
    
    // Validation des sources Microsoft (toutes sont autoritaires)
    if (url && url.startsWith('http')) {
      validatedUrls.push({
        url: url,
        title: title,
        sourceType: determineSourceType(url),
        relevanceScore: 9, // Sources Microsoft = haute qualité
        authorityScore: 10, // Microsoft Learn = autorité maximale
        processingOrder: i + 1,
        originalPost: {
          id: originalPost.id,
          title: originalPost.title,
          impactScore: originalPost.impactScore
        },
        validationMetadata: {
          validatedAt: new Date().toISOString(),
          provider: 'Microsoft Learn',
          confidence: 'high'
        }
      });
    }
  }

  // Fonction pour déterminer le type de source
  function determineSourceType(url) {
    if (url.includes('learn.microsoft.com')) return 'documentation';
    if (url.includes('shows/')) return 'video';
    if (url.includes('apps/')) return 'app-guide';
    if (url.includes('fundamentals/')) return 'fundamentals';
    if (url.includes('developer/')) return 'developer';
    return 'guide';
  }

  if (validatedUrls.length === 0) {
    throw new Error('Aucune URL valide trouvée');
  }

  console.log(`✅ ${validatedUrls.length} sources Microsoft validées`);
  return validatedUrls;
}

/**
 * ÉTAPE 6: Boucle pour chaque URL + Récupérer contenu + Analyser
 * Reproduction exacte du processus N8N
 */
async function processUrlsLoop(urls) {
  console.log('🔄 Boucle pour chaque URL');
  
  const allAnalyses = [];

  for (const urlData of urls) {
    try {
      console.log(`📥 Récupération: ${urlData.url}`);
      
      // Récupérer contenu URL
      const contentResponse = await axios.get(urlData.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ContentBot/1.0; +https://votreblog.com/bot)'
        },
        timeout: 20000,
        maxRedirects: 5
      });

      // Analyser contenu avec Perplexity
      const analysisPayload = {
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: "Tu es Lyra.Analyzer, experte en analyse technique Microsoft Intune. Extrais TOUS les éléments techniques utiles : solutions, configurations, bonnes pratiques, outils. Réponds en JSON structuré."
          },
          {
            role: "user",
            content: `Analyse technique de cette documentation Microsoft Intune:

URL: ${urlData.url}
Type: ${urlData.sourceType}
Titre original: ${urlData.originalPost.title}

Contenu (premiers 3000 chars):
${String(contentResponse.data).slice(0, 3000)}

Extrais:
1. Solutions techniques concrètes
2. Différences Android vs iOS
3. Configurations spécifiques Intune
4. Bonnes pratiques MDM
5. Outils et technologies mentionnés
6. Erreurs courantes
7. Exemples de code/config

Réponds en JSON:
{
  "source_metadata": {
    "content_quality": "excellent",
    "technical_depth": "comprehensive",
    "code_examples_count": 2,
    "estimated_expertise_level": "intermediate"
  },
  "technical_analysis": {
    "main_solutions": ["solution1", "solution2", "solution3"],
    "android_specifics": ["android1", "android2"],
    "ios_specifics": ["ios1", "ios2"],
    "step_by_step_guide": ["step1", "step2", "step3"],
    "tools_mentioned": ["Intune", "tool2", "tool3"],
    "best_practices": ["practice1", "practice2"],
    "common_mistakes": ["mistake1", "mistake2"],
    "configurations": ["config1", "config2"]
  },
  "content_insights": {
    "key_takeaways": ["insight1", "insight2", "insight3"],
    "applicability_score": 9,
    "innovation_level": "standard",
    "practical_value": "high",
    "target_scenarios": ["enterprise", "byod"]
  },
  "editorial_notes": {
    "content_freshness": "current",
    "completeness_score": 9,
    "clarity_rating": "excellent",
    "unique_insights": ["insight1", "insight2"],
    "gaps_identified": ["gap1"]
  }
}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      };

      const analysisResponse = await perplexityClient.post('/chat/completions', analysisPayload);
      allAnalyses.push(analysisResponse.data);
      
      console.log(`✅ Analyse ${allAnalyses.length}/${urls.length} terminée`);
      
      // Délai entre les requêtes
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Erreur URL ${urlData.url}:`, error.message);
      // Continuer avec les autres URLs
    }
  }

  return allAnalyses;
}

/**
 * ÉTAPE 7: Collecteur et synthétiseur d'analyses
 * Reproduction exacte du code JavaScript N8N
 */
function synthesizeAnalyses(allAnalyses, originalPost) {
  console.log('🧬 Collecteur et synthétiseur d\'analyses');
  
  // Préparer la synthèse globale
  const synthesis = {
    originalProblem: {
      title: originalPost.title,
      content: originalPost.content,
      subreddit: originalPost.subreddit,
      impactScore: originalPost.impactScore,
      processingPriority: originalPost.processingPriority
    },
    sourcesAnalyzed: allAnalyses.length,
    consolidatedInsights: {
      mainSolutions: [],
      androidSpecifics: [],
      iosSpecifics: [],
      bestPractices: [],
      toolsRecommended: [],
      commonMistakes: [],
      configurations: [],
      stepByStepGuides: []
    },
    contentMetrics: {
      totalCost: 0,
      averageQuality: 0,
      totalTokens: 0,
      expertiseLevel: 'intermediate'
    }
  };

  // Analyser chaque réponse Perplexity
  allAnalyses.forEach((analysis, index) => {
    try {
      const responseContent = analysis.choices[0].message.content;
      // Nettoyer le JSON (enlever les backticks markdown)
      let cleanJson = responseContent
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/``````/g, '')
        .replace(/`/g, '')
        .trim();
      
      // Si le contenu commence par { et finit par }, extraire seulement cette partie
      const jsonStart = cleanJson.indexOf('{');
      const jsonEnd = cleanJson.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanJson = cleanJson.substring(jsonStart, jsonEnd + 1);
      }
      
      const data = JSON.parse(cleanJson);
      
      // Accumuler les coûts et métriques
      if (analysis.usage) {
        synthesis.contentMetrics.totalCost += analysis.usage.cost?.total_cost || 0;
        synthesis.contentMetrics.totalTokens += analysis.usage.total_tokens || 0;
      }
      
      // Consolider les insights techniques
      if (data.technical_analysis) {
        const tech = data.technical_analysis;
        
        // Solutions principales
        if (tech.main_solutions) {
          synthesis.consolidatedInsights.mainSolutions.push(...tech.main_solutions);
        }
        
        // Spécificités Android/iOS
        if (tech.android_specifics) {
          synthesis.consolidatedInsights.androidSpecifics.push(...tech.android_specifics);
        }
        if (tech.ios_specifics) {
          synthesis.consolidatedInsights.iosSpecifics.push(...tech.ios_specifics);
        }
        
        // Bonnes pratiques
        if (tech.best_practices) {
          synthesis.consolidatedInsights.bestPractices.push(...tech.best_practices);
        }
        
        // Outils
        if (tech.tools_mentioned) {
          synthesis.consolidatedInsights.toolsRecommended.push(...tech.tools_mentioned);
        }
        
        // Erreurs courantes
        if (tech.common_mistakes) {
          synthesis.consolidatedInsights.commonMistakes.push(...tech.common_mistakes);
        }
        
        // Configurations
        if (tech.configurations) {
          synthesis.consolidatedInsights.configurations.push(...tech.configurations);
        }
        
        // Guides étape par étape
        if (tech.step_by_step_guide) {
          synthesis.consolidatedInsights.stepByStepGuides.push(...tech.step_by_step_guide);
        }
      }
      
      console.log(`Analyse ${index + 1} intégrée avec succès`);
      
    } catch (e) {
      console.log(`Erreur parsing analyse ${index + 1}: ${e.message}`);
    }
  });

  // Déduplication et nettoyage
  synthesis.consolidatedInsights.mainSolutions = [...new Set(synthesis.consolidatedInsights.mainSolutions)].slice(0, 6);
  synthesis.consolidatedInsights.androidSpecifics = [...new Set(synthesis.consolidatedInsights.androidSpecifics)].slice(0, 4);
  synthesis.consolidatedInsights.iosSpecifics = [...new Set(synthesis.consolidatedInsights.iosSpecifics)].slice(0, 4);
  synthesis.consolidatedInsights.bestPractices = [...new Set(synthesis.consolidatedInsights.bestPractices)].slice(0, 5);
  synthesis.consolidatedInsights.toolsRecommended = [...new Set(synthesis.consolidatedInsights.toolsRecommended)].slice(0, 6);
  synthesis.consolidatedInsights.commonMistakes = [...new Set(synthesis.consolidatedInsights.commonMistakes)].slice(0, 3);
  synthesis.consolidatedInsights.configurations = [...new Set(synthesis.consolidatedInsights.configurations)].slice(0, 4);
  synthesis.consolidatedInsights.stepByStepGuides = [...new Set(synthesis.consolidatedInsights.stepByStepGuides)].slice(0, 5);

  // Calculs finaux
  synthesis.contentMetrics.averageQuality = Math.round((synthesis.consolidatedInsights.mainSolutions.length * 15 + 
                                                       synthesis.consolidatedInsights.bestPractices.length * 10 + 
                                                       synthesis.consolidatedInsights.toolsRecommended.length * 5) / 3);

  // Génération du brief éditorial
  const editorialBrief = {
    contentStrategy: synthesis.contentMetrics.averageQuality > 80 ? 'comprehensive-guide' : 'practical-tutorial',
    recommendedWordCount: 1800,
    targetAudience: 'intermediate',
    contentPillars: [
      'Android vs iOS Comparison',
      'Intune Configuration Guide', 
      'Best Practices',
      'Common Issues & Solutions',
      'Step-by-Step Implementation'
    ],
    seoFocus: `${originalPost.title} intune android ios mdm comparison guide`,
    uniqueValueProposition: `Complete guide to ${originalPost.title.toLowerCase()} with ${synthesis.consolidatedInsights.mainSolutions.length}+ solutions and expert insights`
  };

  const finalOutput = {
    ...synthesis,
    editorialBrief,
    analysisCompleted: new Date().toISOString(),
    readyForArticleGeneration: true
  };

  console.log(`✅ Synthèse complète: ${synthesis.sourcesAnalyzed} sources → ${synthesis.consolidatedInsights.mainSolutions.length} solutions consolidées → Coût total: $${synthesis.contentMetrics.totalCost.toFixed(3)}`);
  return finalOutput;
}

/**
 * ÉTAPE 8: Créer prompt optimisé Lyra
 * Reproduction exacte de la requête OpenAI N8N
 */
async function createOptimizedPrompt() {
  console.log('✍️ Créer prompt optimisé Lyra');
  
  const payload = {
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "Tu es un expert en rédaction technique Microsoft Intune. Tu écris des articles détaillés, bien structurés et SEO-optimisés."
      },
      {
        role: "user",
        content: `Écris un article technique de 1800 mots sur la comparaison entre Android et iOS dans Microsoft Intune.

SUJET ORIGINAL: Comparaison des capacités de gestion Android vs iOS dans Intune, avec focus sur les limitations Apple et les avantages Android.

CONTEXTE: Une organisation utilise actuellement iOS et ABM pour tous leurs appareils mobiles. Ils explorent Android (Samsung Knox) pour un client et veulent comprendre les capacités supplémentaires disponibles sur Android par rapport aux limitations iOS.

POINTS TECHNIQUES À COUVRIR:
- Gestion MDM/MAM centralisée
- Profils Work/Personal Android vs limitations iOS
- Managed Google Play vs App Store
- Samsung Knox capabilities
- Configurations et politiques spécifiques
- Bonnes pratiques pour chaque plateforme
- Support à distance Android vs iOS
- Outils recommandés (Intune, Company Portal, etc.)

STRUCTURE:
1. Introduction (200 mots)
2. Vue d'ensemble Intune Android vs iOS (300 mots)
3. Capacités spécifiques Android (500 mots)
4. Capacités spécifiques iOS (300 mots)
5. Comparaison pratique (400 mots)
6. Bonnes pratiques (100 mots)

FORMAT: Markdown avec headers, listes, exemples concrets.
TON: Professionnel, technique, avec recommandations pratiques.`
      }
    ],
    temperature: 0.7,
    max_tokens: 2500
  };

  try {
    const response = await openaiClient.post('/chat/completions', payload);
    console.log('✅ Prompt optimisé créé');
    return response.data;
  } catch (error) {
    console.error('❌ Erreur OpenAI Prompt:', error.message);
    throw error;
  }
}

/**
 * ÉTAPE 9: Générer l'article final
 * Génération d'un article Markdown adaptatif selon le subreddit
 */
async function generateFinalArticle(selectedPost) {
  console.log('📝 Générer l\'article final');
  
  const payload = {
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "Tu es un expert technique polyvalent qui s'adapte automatiquement au subreddit et au type de problème. Tu écris des articles détaillés, structurés et actionnables en Markdown."
      },
      {
        role: "user",
        content: `Écris un article EXPERT de 1500 mots en MARKDOWN sur : ${selectedPost.title}

CONTEXTE REDDIT : ${selectedPost.content}
SUBREDDIT : ${selectedPost.subreddit}

ADAPTE-TOI selon le subreddit - r/AskProgramming = Focus développement, best practices, code

IMPÉRATIF : Commence directement par le titre avec # et utilise UNIQUEMENT la syntaxe Markdown.

STRUCTURE OBLIGATOIRE :

# ${selectedPost.title} : Guide Complet 2025

## Table des matières
- [Introduction](#introduction)  
- [Vue d'ensemble](#vue-densemble)
- [Analyse technique](#analyse-technique)
- [Implications et impact](#implications-et-impact)
- [Solutions et recommandations](#solutions-et-recommandations)
- [Bonnes pratiques](#bonnes-pratiques)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Conclusion](#conclusion)

## Introduction

Dans le domaine de la technologie moderne, ${selectedPost.title.toLowerCase()} représente un enjeu majeur qui nécessite une compréhension approfondie.

[Continue avec 150-200 mots d'introduction engageante]

## Vue d'ensemble

[Vue d'ensemble technique détaillée de 200-300 mots]

## Analyse technique

### Aspects clés
- **Point technique 1** : Explication détaillée
- **Point technique 2** : Explication détaillée  
- **Point technique 3** : Explication détaillée

### Détails d'implémentation
[Explications techniques approfondies]

## Implications et impact

### Impact sur la sécurité
[Analyse des implications sécuritaires]

### Impact opérationnel
[Analyse des implications opérationnelles]

## Solutions et recommandations

### Solution 1 : [Nom de la solution]
[Description complète avec étapes]

### Solution 2 : [Nom de la solution]
[Description complète avec étapes]

### Solution 3 : [Nom de la solution]
[Description complète avec étapes]

## Bonnes pratiques

- **Pratique 1** : Description complète et justification
- **Pratique 2** : Description complète et justification
- **Pratique 3** : Description complète et justification

## Troubleshooting

### Problèmes courants

#### Problème 1
**Symptômes** : Description
**Solution** : Étapes détaillées

#### Problème 2
**Symptômes** : Description
**Solution** : Étapes détaillées

## FAQ

### Question 1 ?
Réponse technique détaillée avec exemples.

### Question 2 ?
Réponse technique détaillée avec exemples.

### Question 3 ?
Réponse technique détaillée avec exemples.

## Conclusion

[Résumé des points clés et recommandations finales]

RÈGLES STRICTES :
- Format Markdown UNIQUEMENT (pas de texte brut)
- Utilise # ## ### pour les titres
- Utilise - ou * pour les listes
- Utilise **texte** pour le gras
- 1500-2000 mots minimum
- Ton professionnel et technique
- Exemples concrets obligatoires`
      }
    ],
    temperature: 0.4,
    max_tokens: 4000
  };

  try {
    const response = await openaiClient.post('/chat/completions', payload);
    console.log('✅ Article final généré en Markdown');
    return response.data;
  } catch (error) {
    console.error('❌ Erreur OpenAI Article:', error.message);
    throw error;
  }
}

/**
 * ÉTAPE 10: Publier dans Strapi
 * Reproduction exacte de la requête HTTP N8N
 */
async function publishToStrapi(selectedPost, articleContent) {
  console.log('🚀 Publier dans Strapi');
  
  // Générer un excerpt dynamique basé sur le contenu
  const content = articleContent.choices[0].message.content;
  const firstParagraph = content.split('\n\n')[0] || content.split('\n')[0] || content.substring(0, 200);
  const excerpt = firstParagraph.length > 200 ? firstParagraph.substring(0, 197) + '...' : firstParagraph;
  
  // Générer un slug basé sur le titre
  const slug = selectedPost.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50) + `-${selectedPost.id}`;

  const payload = {
    data: {
      title: selectedPost.title,
      content: content,
      slug: slug,
      excerpt: excerpt,
      status: "published",
      publishedAt: new Date().toISOString()
    }
  };

  try {
    const response = await strapiClient.post('/api/articles', payload);
    console.log('✅ Article publié dans Strapi!');
    console.log('   ID Strapi:', response.data.data?.id || response.data.id);
    
    // Gestion sécurisée de l'accès au titre
    if (response.data.data?.attributes?.title) {
      console.log('   Titre:', response.data.data.attributes.title);
    } else if (response.data.attributes?.title) {
      console.log('   Titre:', response.data.attributes.title);
    } else {
      console.log('   Titre: Non accessible dans la réponse');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Erreur Strapi:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * WORKFLOW PRINCIPAL
 * Orchestration exacte des étapes N8N
 */
async function runWorkflow() {
  console.log('🚀 DÉMARRAGE WORKFLOW N8N REPRODUCTION');
  console.log('==========================================');
  
  try {
    // 1. Reddit - Recherche problèmes tech
    const redditPosts = await searchRedditPosts();
    
    // 2. Filtrer et analyser les posts
    const processedPosts = filterAndAnalyzePosts(redditPosts);
    
    // 3. Sélectionner le post principal
    const selectedPost = selectMainPost(processedPosts);
    
    // 4. Perplexity - Analyser et trouver URLs
    const perplexityResponse = await analyzeWithPerplexity(selectedPost);
    
    // 5. Extraire les URLs
    const extractedUrls = extractUrls(perplexityResponse, selectedPost);
    
    // 6. Boucle pour chaque URL + analyses
    const allAnalyses = await processUrlsLoop(extractedUrls);
    
    // 7. Collecteur et synthétiseur d'analyses
    const synthesis = synthesizeAnalyses(allAnalyses, selectedPost);
    
    // 8. Créer prompt optimisé Lyra
    const optimizedPrompt = await createOptimizedPrompt();
    
    // 9. Générer l'article final
    const finalArticle = await generateFinalArticle(selectedPost);
    
    // 10. Publier dans Strapi
    const strapiResult = await publishToStrapi(selectedPost, finalArticle);
    
    console.log('\n🎉 WORKFLOW TERMINÉ AVEC SUCCÈS!');
    console.log('=====================================');
    
    // Debug de la structure de réponse Strapi
    console.log('🔍 Debug strapiResult structure:', JSON.stringify(strapiResult, null, 2));
    
    if (strapiResult && strapiResult.data && strapiResult.data.attributes) {
      console.log('✅ Article publié:', strapiResult.data.attributes.title);
      console.log('✅ URL:', `${CONFIG.TUNNEL_URL}/api/articles/${strapiResult.data.id}`);
    } else {
      console.log('⚠️ Structure Strapi inattendue - Article publié mais titre non accessible');
      if (strapiResult && strapiResult.data) {
        console.log('✅ URL:', `${CONFIG.TUNNEL_URL}/api/articles/${strapiResult.data.id}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ ERREUR WORKFLOW:', error.message);
    process.exit(1);
  }
}

// Exécution si appelé directement
if (require.main === module) {
  runWorkflow();
}

module.exports = { runWorkflow };