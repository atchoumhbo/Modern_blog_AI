#!/usr/bin/env node

/**
 * GÉNÉRATEUR DE WORKFLOW N8N
 * Génère automatiquement des workflows N8N à partir de templates
 */

const fs = require('fs');
const path = require('path');

console.log('🏭 GÉNÉRATEUR DE WORKFLOW N8N');
console.log('=============================');
console.log('');

// Configuration par défaut
const DEFAULT_CONFIG = {
  name: "Reddit Tech Problem Analysis & Content Generation with Strapi",
  active: false,
  settings: {
    executionOrder: "v1"
  },
  versionId: generateVersionId(),
  meta: {
    templateCredsSetupCompleted: true,
    instanceId: generateInstanceId()
  },
  id: generateWorkflowId(),
  tags: []
};

// Templates de nodes
const NODE_TEMPLATES = {
  scheduleTrigger: {
    parameters: {
      rule: {
        interval: [{ field: "hours" }]
      }
    },
    type: "n8n-nodes-base.scheduleTrigger",
    typeVersion: 1.1,
    name: "Déclencheur programmé"
  },
  
  reddit: {
    parameters: {
      operation: "search",
      subreddit: "Intune",
      keyword: "android",
      limit: 50,
      additionalFields: {}
    },
    type: "n8n-nodes-base.reddit",
    typeVersion: 1,
    name: "Reddit - Recherche problèmes tech",
    credentials: {
      redditOAuth2Api: {
        id: "REDDIT_CRED_ID",
        name: "Reddit account"
      }
    }
  },

  codeFilter: {
    parameters: {
      jsCode: `const processedPosts = [];

for (const item of $input.all()) {
  const post = item.json;

  // Score d'impact amélioré avec pondération
  const baseScore = (post.ups || 0) + (post.num_comments || 0) * 2;
  const freshnessBonus = (Date.now()/1000 - post.created_utc < 86400) ? 20 : 0;
  const controversyBonus = (post.upvote_ratio && post.upvote_ratio < 0.7) ? 15 : 0;
  const finalImpactScore = baseScore + freshnessBonus + controversyBonus;

  // Filtrer seulement les posts avec impact significatif
  if (finalImpactScore > 25) {
    const extractedKeywords = extractTechnicalKeywords(post.title + ' ' + (post.selftext || ''));
    const contentLength = (post.selftext || post.title).length;
    const estimatedReadingTime = Math.ceil(contentLength / 1000);

    processedPosts.push({
      id: post.id,
      title: post.title,
      content: post.selftext || post.title,
      url: \`https://reddit.com\${post.permalink}\`,
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

// Fonctions helper
function extractTechnicalKeywords(text) {
  const advancedTechKeywords = [
    'javascript', 'typescript', 'python', 'java', 'csharp', 'golang', 'rust', 'swift', 'kotlin',
    'react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxtjs', 'gatsby', 'express', 'fastapi', 'django',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'gitlab-ci',
    'microservices', 'serverless', 'lambda', 'containers', 'orchestration',
    'postgresql', 'mongodb', 'redis', 'elasticsearch', 'mysql', 'sqlite', 'cassandra',
    'graphql', 'rest-api', 'grpc', 'websocket', 'kafka', 'rabbitmq',
    'machine-learning', 'tensorflow', 'pytorch', 'neural-network', 'deep-learning',
    'blockchain', 'cryptocurrency', 'web3', 'smart-contracts', 'nft',
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
      keyword + 'js',
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

return processedPosts.slice(0, 20).map(post => ({ json: post }));`
    },
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    name: "Filtrer et analyser les posts"
  },

  perplexityAnalysis: {
    parameters: {
      method: "POST",
      url: "https://api.perplexity.ai/chat/completions",
      authentication: "predefinedCredentialType",
      nodeCredentialType: "perplexityApi",
      sendBody: true,
      specifyBody: "json",
      jsonBody: `{
  "model": "sonar-pro",
  "messages": [
    {
      "role": "system",
      "content": "Tu es un expert en recherche tech. Trouve 5 URLs sur Microsoft Intune Android vs iOS. Réponds en JSON valide."
    },
    {
      "role": "user", 
      "content": "Recherche sur: {{ $json.title }}\\n\\nTrouve 5 sources:\\n1. Documentation Microsoft Intune\\n2. Stack Overflow Intune Android\\n3. Blog technique MDM\\n4. Guide Samsung Knox\\n5. Comparaison Android vs iOS MDM\\n\\nRéponds en JSON:\\n{\\n  \\"urls\\": [\\"url1\\", \\"url2\\", \\"url3\\", \\"url4\\", \\"url5\\"],\\n  \\"titles\\": [\\"title1\\", \\"title2\\", \\"title3\\", \\"title4\\", \\"title5\\"]\\n}"
    }
  ],
  "temperature": 0.3,
  "max_tokens": 1500
}`,
      options: {}
    },
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    name: "Perplexity - Analyser et trouver URLs",
    credentials: {
      perplexityApi: {
        id: "PERPLEXITY_CRED_ID",
        name: "Perplexity account"
      }
    }
  },

  openaiGeneration: {
    parameters: {
      method: "POST",
      url: "https://api.openai.com/v1/chat/completions",
      authentication: "predefinedCredentialType",
      nodeCredentialType: "openAiApi",
      sendHeaders: true,
      headerParameters: {
        parameters: [
          {
            name: "Content-Type",
            value: "application/json"
          }
        ]
      },
      sendBody: true,
      specifyBody: "json",
      jsonBody: `{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "Écris un article technique de 1200 mots sur : {{ $node['Sélectionner le post principal'].json.title }}"
    }
  ],
  "max_tokens": 3000
}`,
      options: {}
    },
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    name: "Générer l'article final",
    credentials: {
      openAiApi: {
        id: "OPENAI_CRED_ID",
        name: "OpenAi account"
      }
    }
  },

  strapiPublication: {
    parameters: {
      method: "POST",
      url: "https://pipeline-robinson-msgid-step.trycloudflare.com/api/articles",
      sendHeaders: true,
      headerParameters: {
        parameters: [
          {
            name: "Content-Type",
            value: "application/json"
          },
          {
            name: "Authorization",
            value: "Bearer STRAPI_API_TOKEN"
          }
        ]
      },
      sendBody: true,
      specifyBody: "json",
      jsonBody: `{
  "data": {
    "title": "{{ $node['Sélectionner le post principal'].json.title }}",
    "content": "{{ $json.choices[0].message.content }}",
    "slug": "{{ $node['Sélectionner le post principal'].json.id }}-android-ios-intune-comparison",
    "excerpt": "Comprehensive comparison between Android and iOS capabilities in Microsoft Intune management",
    "status": "published",
    "publishedAt": "{{ $now }}"
  }
}`,
      options: {}
    },
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    name: "Publier dans Strapi"
  }
};

// Générateur d'IDs
function generateVersionId() {
  return Array.from({length: 36}, (_, i) => 
    i === 8 || i === 13 || i === 18 || i === 23 ? '-' : 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

function generateInstanceId() {
  return Array.from({length: 64}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

function generateWorkflowId() {
  return Array.from({length: 16}, () => 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
  ).join('');
}

function generateNodeId() {
  return Array.from({length: 36}, (_, i) => 
    i === 8 || i === 13 || i === 18 || i === 23 ? '-' : 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

// Fonction pour créer un workflow
function createWorkflow(config = {}) {
  const workflow = {
    ...DEFAULT_CONFIG,
    ...config,
    nodes: [],
    connections: {},
    pinData: {}
  };

  let nodePosition = [-1792, -720];
  let nodeIndex = 0;

  // Ajouter les nodes
  const nodeIds = {};

  // 1. Trigger
  const triggerId = generateNodeId();
  nodeIds.trigger = triggerId;
  workflow.nodes.push({
    ...NODE_TEMPLATES.scheduleTrigger,
    id: triggerId,
    position: nodePosition
  });
  nodePosition[0] += 224;

  // 2. Reddit
  const redditId = generateNodeId();
  nodeIds.reddit = redditId;
  workflow.nodes.push({
    ...NODE_TEMPLATES.reddit,
    id: redditId,
    position: nodePosition
  });
  nodePosition[0] += 224;

  // 3. Filter
  const filterId = generateNodeId();
  nodeIds.filter = filterId;
  workflow.nodes.push({
    ...NODE_TEMPLATES.codeFilter,
    id: filterId,
    position: nodePosition
  });
  nodePosition[0] += 224;

  // 4. Selector (code simple)
  const selectorId = generateNodeId();
  nodeIds.selector = selectorId;
  workflow.nodes.push({
    parameters: {
      jsCode: `// Sélectionner le post avec la priorité la plus élevée
const candidates = $input.all().sort((a, b) => b.json.processingPriority - a.json.processingPriority);

if (candidates.length === 0) {
  throw new Error('Aucun post candidat trouvé');
}

const selectedPost = candidates[0];

// Enrichir avec métadonnées de sélection
const enrichedPost = {
  ...selectedPost.json,
  selectedAt: new Date().toISOString(),
  selectionRank: 1,
  totalCandidates: candidates.length,
  competitionLevel: candidates.length > 10 ? 'high' : candidates.length > 5 ? 'medium' : 'low',
  expectedPerformance: selectedPost.json.processingPriority > 100 ? 'excellent' : 
                      selectedPost.json.processingPriority > 50 ? 'good' : 'average'
};

console.log(\`Post sélectionné: "\${enrichedPost.title}" avec priorité \${enrichedPost.processingPriority}\`);

return [{ json: enrichedPost }];`
    },
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    name: "Sélectionner le post principal",
    id: selectorId,
    position: nodePosition
  });
  nodePosition[0] += 224;

  // 5. Perplexity
  const perplexityId = generateNodeId();
  nodeIds.perplexity = perplexityId;
  workflow.nodes.push({
    ...NODE_TEMPLATES.perplexityAnalysis,
    id: perplexityId,
    position: nodePosition
  });
  nodePosition[0] += 224;

  // 6. OpenAI
  const openaiId = generateNodeId();
  nodeIds.openai = openaiId;
  workflow.nodes.push({
    ...NODE_TEMPLATES.openaiGeneration,
    id: openaiId,
    position: nodePosition
  });
  nodePosition[0] += 224;

  // 7. Strapi
  const strapiId = generateNodeId();
  nodeIds.strapi = strapiId;
  workflow.nodes.push({
    ...NODE_TEMPLATES.strapiPublication,
    id: strapiId,
    position: nodePosition
  });

  // Créer les connexions
  workflow.connections = {
    [NODE_TEMPLATES.scheduleTrigger.name]: {
      main: [[{
        node: NODE_TEMPLATES.reddit.name,
        type: "main",
        index: 0
      }]]
    },
    [NODE_TEMPLATES.reddit.name]: {
      main: [[{
        node: NODE_TEMPLATES.codeFilter.name,
        type: "main",
        index: 0
      }]]
    },
    [NODE_TEMPLATES.codeFilter.name]: {
      main: [[{
        node: "Sélectionner le post principal",
        type: "main",
        index: 0
      }]]
    },
    "Sélectionner le post principal": {
      main: [[{
        node: NODE_TEMPLATES.perplexityAnalysis.name,
        type: "main",
        index: 0
      }]]
    },
    [NODE_TEMPLATES.perplexityAnalysis.name]: {
      main: [[{
        node: NODE_TEMPLATES.openaiGeneration.name,
        type: "main",
        index: 0
      }]]
    },
    [NODE_TEMPLATES.openaiGeneration.name]: {
      main: [[{
        node: NODE_TEMPLATES.strapiPublication.name,
        type: "main",
        index: 0
      }]]
    }
  };

  return workflow;
}

// Fonction pour générer un workflow personnalisé
function generateCustomWorkflow(options = {}) {
  console.log('🏭 Génération du workflow personnalisé...');
  
  const config = {
    name: options.name || "Reddit Tech Problem Analysis & Content Generation with Strapi",
    subreddit: options.subreddit || "Intune",
    keyword: options.keyword || "android",
    limit: options.limit || 50,
    tunnelUrl: options.tunnelUrl || "https://pipeline-robinson-msgid-step.trycloudflare.com",
    strapiToken: options.strapiToken || "STRAPI_API_TOKEN"
  };

  const workflow = createWorkflow(config);

  // Personnaliser les paramètres Reddit
  const redditNode = workflow.nodes.find(n => n.name === NODE_TEMPLATES.reddit.name);
  if (redditNode) {
    redditNode.parameters.subreddit = config.subreddit;
    redditNode.parameters.keyword = config.keyword;
    redditNode.parameters.limit = config.limit;
  }

  // Personnaliser l'URL Strapi
  const strapiNode = workflow.nodes.find(n => n.name === NODE_TEMPLATES.strapiPublication.name);
  if (strapiNode) {
    strapiNode.parameters.url = `${config.tunnelUrl}/api/articles`;
    strapiNode.parameters.headerParameters.parameters[1].value = `Bearer ${config.strapiToken}`;
  }

  return workflow;
}

// Fonction principale
function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parser les arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    if (key && value) {
      options[key] = value;
    }
  }

  console.log('📋 Configuration:');
  console.log('   Nom:', options.name || 'Reddit Tech Problem Analysis');
  console.log('   Subreddit:', options.subreddit || 'Intune');
  console.log('   Keyword:', options.keyword || 'android');
  console.log('   Limit:', options.limit || '50');
  console.log('   Tunnel URL:', options.tunnelUrl || 'https://pipeline-robinson-msgid-step.trycloudflare.com');
  console.log('');

  // Générer le workflow
  const workflow = generateCustomWorkflow(options);

  // Sauvegarder le fichier
  const outputFile = options.output || 'generated-n8n-workflow.json';
  fs.writeFileSync(outputFile, JSON.stringify(workflow, null, 2));

  console.log('✅ Workflow généré avec succès!');
  console.log('📁 Fichier:', outputFile);
  console.log('');
  console.log('🚀 IMPORT DANS N8N:');
  console.log('1. Ouvrir N8N');
  console.log('2. Cliquer sur "Import"');
  console.log('3. Sélectionner le fichier:', outputFile);
  console.log('4. Configurer les credentials:');
  console.log('   - Reddit OAuth2 API');
  console.log('   - Perplexity API');
  console.log('   - OpenAI API');
  console.log('5. Mettre à jour le token Strapi');
  console.log('6. Activer le workflow');
  console.log('');
  console.log('📊 STATISTIQUES:');
  console.log('   Nodes:', workflow.nodes.length);
  console.log('   Connexions:', Object.keys(workflow.connections).length);
  console.log('   ID Workflow:', workflow.id);
}

// Exporter les fonctions
module.exports = {
  createWorkflow,
  generateCustomWorkflow,
  NODE_TEMPLATES,
  generateVersionId,
  generateInstanceId,
  generateWorkflowId,
  generateNodeId
};

// Exécuter si appelé directement
if (require.main === module) {
  main();
}