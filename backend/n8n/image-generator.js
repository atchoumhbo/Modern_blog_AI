#!/usr/bin/env node

/**
 * Service de génération d'images pour articles N8N
 * Support multiple APIs: Stability AI, getimg.ai, Replicate, DALL-E 3
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuration des APIs d'images
const IMAGE_CONFIG = {
  // Provider par défaut (sera modifiable dans le .env)
  DEFAULT_PROVIDER: process.env.IMAGE_PROVIDER || 'openai-dalle',
  
  // APIs disponibles
  PROVIDERS: {
    'stability-ai': {
      name: 'Stability AI DreamStudio',
      baseURL: 'https://api.stability.ai',
      endpoint: '/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
      apiKey: process.env.STABILITY_API_KEY,
      costPerImage: 0.004, // $0.004 par image
      maxSize: 1024,
      supportedSizes: ['512x512', '768x768', '1024x1024']
    },
    'getimg-ai': {
      name: 'GetImg.ai',
      baseURL: 'https://api.getimg.ai/v1',
      endpoint: '/stable-diffusion/text-to-image',
      apiKey: process.env.GETIMG_API_KEY,
      costPerImage: 0.01, // $0.01 par image
      maxSize: 1024,
      supportedSizes: ['512x512', '768x768', '1024x1024']
    },
    'replicate': {
      name: 'Replicate Stable Diffusion',
      baseURL: 'https://api.replicate.com/v1',
      endpoint: '/predictions',
      apiKey: process.env.REPLICATE_API_TOKEN,
      costPerImage: 0.005, // $0.005 par image (variable)
      maxSize: 1024,
      supportedSizes: ['512x512', '768x768', '1024x1024']
    },
    'openai-dalle': {
      name: 'OpenAI DALL-E 3',
      baseURL: 'https://api.openai.com/v1',
      endpoint: '/images/generations',
      apiKey: process.env.OPENAI_API_KEY,
      costPerImage: 0.04, // $0.04 par image (1024x1024)
      maxSize: 1024,
      supportedSizes: ['1024x1024', '1792x1024', '1024x1792']
    }
  },
  
  // Paramètres par défaut
  DEFAULT_SIZE: '768x768',
  DEFAULT_STEPS: 30,
  DEFAULT_SAMPLES: 1,
  SAVE_TO_STRAPI: true,
  SAVE_LOCAL_BACKUP: true
};

/**
 * Générer un prompt optimisé pour l'image basé sur l'article
 */
function generateImagePrompt(articleTitle, subreddit, analysis) {
  // Prompts de base selon le subreddit
  const subredditStyles = {
    'webdev': 'modern web development, clean interface, code editor, tech workspace',
    'programming': 'programming concept, abstract code visualization, digital art',
    'javascript': 'JavaScript logo, modern coding environment, yellow accents',
    'reactjs': 'React.js components, blue theme, modern UI/UX design',
    'nextjs': 'Next.js framework, full-stack development, black and white theme',
    'learnprogramming': 'learning concept, books, computer, educational theme',
    'node': 'Node.js server, backend development, green theme',
    'Frontend': 'frontend development, user interface, colorful design'
  };

  const baseStyle = subredditStyles[subreddit] || 'technology, digital art, modern design';
  
  // Extraire des mots-clés du titre
  const titleKeywords = articleTitle
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(' ')
    .filter(word => word.length > 3)
    .slice(0, 3)
    .join(', ');

  // Construire le prompt final
  const prompt = `${titleKeywords}, ${baseStyle}, professional illustration, high quality, digital art, clean design, modern style, tech theme, 4k quality`;
  
  // Prompt négatif pour éviter les éléments indésirables
  const negativePrompt = 'text, words, letters, watermark, signature, blurry, low quality, distorted, ugly';

  return {
    prompt: prompt,
    negativePrompt: negativePrompt,
    style: baseStyle,
    keywords: titleKeywords
  };
}

/**
 * Générer une image avec Stability AI DreamStudio
 */
async function generateWithStabilityAI(promptData, size = '768x768') {
  const provider = IMAGE_CONFIG.PROVIDERS['stability-ai'];
  
  if (!provider.apiKey) {
    throw new Error('STABILITY_API_KEY non configurée');
  }

  const [width, height] = size.split('x').map(Number);

  // Payload JSON pour la nouvelle API v2
  const payload = {
    text_prompts: [
      {
        text: promptData.prompt,
        weight: 1
      },
      {
        text: promptData.negativePrompt,
        weight: -1
      }
    ],
    cfg_scale: 7,
    height: height,
    width: width,
    samples: IMAGE_CONFIG.DEFAULT_SAMPLES,
    steps: IMAGE_CONFIG.DEFAULT_STEPS,
    style_preset: 'digital-art'
  };

  try {
    console.log(`🎨 Génération image Stability AI: "${promptData.prompt.substring(0, 50)}..."`);
    
    const response = await axios.post(
      `${provider.baseURL}${provider.endpoint}`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'  // Header requis par l'API
        },
        timeout: 60000 // 60 secondes
      }
    );

    // Structure de réponse Stability AI v1
    if (response.data.artifacts && response.data.artifacts.length > 0) {
      return {
        imageData: response.data.artifacts[0].base64, // Base64
        provider: 'stability-ai',
        cost: provider.costPerImage,
        size: size,
        prompt: promptData.prompt
      };
    }

    throw new Error('Pas de données image dans la réponse Stability AI');

  } catch (error) {
    console.error('❌ Erreur Stability AI:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Générer une image avec GetImg.ai
 */
async function generateWithGetImg(promptData, size = '768x768') {
  const provider = IMAGE_CONFIG.PROVIDERS['getimg-ai'];
  
  if (!provider.apiKey) {
    throw new Error('GETIMG_API_KEY non configurée');
  }

  const [width, height] = size.split('x').map(Number);

  const payload = {
    model: 'stable-diffusion-v1-5',
    prompt: promptData.prompt,
    negative_prompt: promptData.negativePrompt,
    width: width,
    height: height,
    steps: IMAGE_CONFIG.DEFAULT_STEPS,
    guidance: 7.5,
    output_format: 'jpeg'
  };

  try {
    console.log(`🎨 Génération image GetImg.ai: "${promptData.prompt.substring(0, 50)}..."`);
    
    const response = await axios.post(
      `${provider.baseURL}${provider.endpoint}`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    if (response.data.image) {
      return {
        imageData: response.data.image, // Base64
        provider: 'getimg-ai',
        cost: provider.costPerImage,
        size: size,
        prompt: promptData.prompt
      };
    }

    throw new Error('Pas de données image dans la réponse');

  } catch (error) {
    console.error('❌ Erreur GetImg.ai:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Générer une image avec OpenAI DALL-E 3
 */
async function generateWithDALLE3(promptData, size = '1024x1024') {
  const provider = IMAGE_CONFIG.PROVIDERS['openai-dalle'];
  
  if (!provider.apiKey) {
    throw new Error('OPENAI_API_KEY non configurée');
  }

  // DALL-E 3 a des tailles spécifiques
  const dalleSize = size === '768x768' ? '1024x1024' : size;

  const payload = {
    model: 'dall-e-3',
    prompt: promptData.prompt,
    n: 1,
    size: dalleSize,
    quality: 'standard',
    response_format: 'b64_json'
  };

  try {
    console.log(`🎨 Génération image DALL-E 3: "${promptData.prompt.substring(0, 50)}..."`);
    
    const response = await axios.post(
      `${provider.baseURL}${provider.endpoint}`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 90000 // DALL-E 3 peut prendre plus de temps
      }
    );

    if (response.data.data && response.data.data[0].b64_json) {
      return {
        imageData: response.data.data[0].b64_json,
        provider: 'openai-dalle',
        cost: provider.costPerImage,
        size: dalleSize,
        prompt: promptData.prompt,
        revisedPrompt: response.data.data[0].revised_prompt // DALL-E 3 modifie souvent le prompt
      };
    }

    throw new Error('Pas de données image dans la réponse DALL-E');

  } catch (error) {
    console.error('❌ Erreur DALL-E 3:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Sauvegarder l'image localement
 */
async function saveImageLocally(imageResult, articleTitle, postId) {
  try {
    // Créer le dossier images s'il n'existe pas
    const imagesDir = path.join(__dirname, '..', 'public', 'generated-images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // Générer un nom de fichier unique
    const sanitizedTitle = articleTitle
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    const timestamp = Date.now();
    const filename = `${sanitizedTitle}-${postId}-${timestamp}.jpg`;
    const filepath = path.join(imagesDir, filename);

    // Convertir base64 en buffer et sauvegarder
    const imageBuffer = Buffer.from(imageResult.imageData, 'base64');
    fs.writeFileSync(filepath, imageBuffer);

    console.log(`💾 Image sauvegardée localement: ${filename}`);

    return {
      filename: filename,
      filepath: filepath,
      size: imageBuffer.length,
      url: `/generated-images/${filename}`
    };

  } catch (error) {
    console.error('❌ Erreur sauvegarde locale:', error.message);
    return null;
  }
}

/**
 * Uploader l'image vers Strapi Media Library
 */
async function uploadToStrapi(imageResult, articleTitle, strapiClient) {
  try {
    // Créer FormData pour l'upload Strapi
    const FormData = require('form-data');
    const form = new FormData();

    // Convertir base64 en buffer
    const imageBuffer = Buffer.from(imageResult.imageData, 'base64');
    
    // Générer un nom de fichier
    const sanitizedTitle = articleTitle
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
    
    const filename = `${sanitizedTitle}-${Date.now()}.jpg`;

    // Ajouter le fichier au FormData
    form.append('files', imageBuffer, {
      filename: filename,
      contentType: 'image/jpeg'
    });

    // Métadonnées pour Strapi
    form.append('fileInfo', JSON.stringify({
      name: filename,
      alternativeText: `Image générée pour: ${articleTitle}`,
      caption: `Générée par ${imageResult.provider} - Prompt: ${imageResult.prompt.substring(0, 100)}...`
    }));

    console.log(`📤 Upload vers Strapi Media Library: ${filename}`);

    const uploadResponse = await strapiClient.post('/api/upload', form, {
      headers: {
        ...form.getHeaders()
      },
      timeout: 30000
    });

    if (uploadResponse.data && uploadResponse.data[0]) {
      const uploadedFile = uploadResponse.data[0];
      console.log(`✅ Image uploadée dans Strapi: ID ${uploadedFile.id}`);
      
      return {
        id: uploadedFile.id,
        url: uploadedFile.url,
        formats: uploadedFile.formats,
        name: uploadedFile.name,
        alternativeText: uploadedFile.alternativeText
      };
    }

    throw new Error('Réponse upload Strapi invalide');

  } catch (error) {
    console.error('❌ Erreur upload Strapi:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Fonction principale de génération d'image
 */
async function generateArticleImage(articleTitle, subreddit, analysis, strapiClient, postId) {
  console.log('🎨 Génération d\'image pour l\'article...');
  
  try {
    // 1. Générer le prompt optimisé
    const promptData = generateImagePrompt(articleTitle, subreddit, analysis);
    console.log(`🎯 Prompt généré: "${promptData.prompt}"`);

    // 2. Choisir le provider selon la configuration
    const provider = IMAGE_CONFIG.DEFAULT_PROVIDER;
    const size = IMAGE_CONFIG.DEFAULT_SIZE;

    let imageResult;

    // 3. Générer l'image selon le provider
    switch (provider) {
      case 'stability-ai':
        imageResult = await generateWithStabilityAI(promptData, size);
        break;
      case 'getimg-ai':
        imageResult = await generateWithGetImg(promptData, size);
        break;
      case 'openai-dalle':
        imageResult = await generateWithDALLE3(promptData, size);
        break;
      default:
        throw new Error(`Provider non supporté: ${provider}`);
    }

    console.log(`✅ Image générée avec ${imageResult.provider} - Coût: $${imageResult.cost}`);

    // 4. Sauvegarder localement si configuré
    let localSave = null;
    if (IMAGE_CONFIG.SAVE_LOCAL_BACKUP) {
      localSave = await saveImageLocally(imageResult, articleTitle, postId);
    }

    // 5. Uploader vers Strapi si configuré
    let strapiUpload = null;
    if (IMAGE_CONFIG.SAVE_TO_STRAPI && strapiClient) {
      strapiUpload = await uploadToStrapi(imageResult, articleTitle, strapiClient);
    }

    // 6. Retourner les résultats
    return {
      success: true,
      provider: imageResult.provider,
      cost: imageResult.cost,
      size: imageResult.size,
      prompt: imageResult.prompt,
      revisedPrompt: imageResult.revisedPrompt,
      local: localSave,
      strapi: strapiUpload,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Erreur génération image:', error.message);
    
    return {
      success: false,
      error: error.message,
      provider: IMAGE_CONFIG.DEFAULT_PROVIDER,
      generatedAt: new Date().toISOString()
    };
  }
}

/**
 * Test de génération d'image
 */
async function testImageGeneration() {
  console.log('🧪 Test génération d\'image...');
  
  const testData = {
    title: 'Guide Complet JavaScript ES6 - Best Practices 2025',
    subreddit: 'javascript',
    analysis: {
      summary: 'Guide des meilleures pratiques JavaScript ES6',
      sources: []
    }
  };

  try {
    const result = await generateArticleImage(
      testData.title,
      testData.subreddit,
      testData.analysis,
      null, // Pas de client Strapi pour le test
      'test-' + Date.now()
    );

    console.log('📊 Résultat test:', result);
    return result;

  } catch (error) {
    console.error('❌ Erreur test:', error.message);
    return { success: false, error: error.message };
  }
}

// Export des fonctions
module.exports = {
  generateArticleImage,
  generateImagePrompt,
  testImageGeneration,
  IMAGE_CONFIG
};

// Test si exécuté directement
if (require.main === module) {
  testImageGeneration();
}