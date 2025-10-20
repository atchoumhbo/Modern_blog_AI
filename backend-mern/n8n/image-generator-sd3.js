#!/usr/bin/env node

/**
 * Service de génération d'images pour articles N8N - Version SD3
 * Support Stability AI SD3 avec nouvelle API multipart/form-data
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuration optimisée pour Stability AI SD3
const IMAGE_CONFIG = {
  DEFAULT_PROVIDER: process.env.IMAGE_PROVIDER || 'stability-ai',
  
  PROVIDERS: {
    'stability-ai': {
      name: 'Stability AI SD3',
      baseURL: 'https://api.stability.ai',
      endpoint: '/v2beta/stable-image/generate/sd3',
      apiKey: process.env.STABILITY_API_KEY,
      costPerImage: 0.003, // 3 crédits ≈ $0.003
      supportedAspectRatios: ['16:9', '1:1', '21:9', '2:3', '3:2', '4:5', '5:4', '9:16', '9:21'],
      supportedFormats: ['jpeg', 'png', 'webp'],
      supportedStyles: [
        '3d-model', 'analog-film', 'anime', 'cinematic', 'comic-book', 
        'digital-art', 'enhance', 'fantasy-art', 'isometric', 'line-art',
        'low-poly', 'modeling-compound', 'neon-punk', 'origami', 
        'photographic', 'pixel-art', 'tile-texture'
      ]
    },
    'openai-dalle': {
      name: 'OpenAI DALL-E 3',
      baseURL: 'https://api.openai.com/v1',
      endpoint: '/images/generations',
      apiKey: process.env.OPENAI_API_KEY,
      costPerImage: 0.04, // $0.04 par image
      supportedSizes: ['1024x1024', '1792x1024', '1024x1792']
    }
  }
};

/**
 * Générer un prompt optimisé pour l'image
 */
function generateImagePrompt(articleTitle, subreddit = 'programming') {
  const subredditStyles = {
    'webdev': 'modern web development workspace, clean code editor interface, blue and white theme',
    'programming': 'abstract programming concept, colorful code visualization, tech illustration',
    'javascript': 'JavaScript development, yellow JS logo, modern coding environment',
    'reactjs': 'React.js components diagram, blue theme, modern UI design',
    'nextjs': 'Next.js full-stack development, black framework logo, professional',
    'learnprogramming': 'learning programming concept, books with laptop, educational theme',
    'node': 'Node.js backend server, green theme, network connections',
    'Frontend': 'frontend user interface, colorful modern design, responsive layout'
  };

  const baseStyle = subredditStyles[subreddit] || 'technology illustration, digital art, modern design';
  
  // Extraire mots-clés du titre (éviter les mots trop techniques)
  const titleKeywords = articleTitle
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(' ')
    .filter(word => word.length > 3 && !['tutorial', 'guide', 'tips', 'best', 'practices'].includes(word))
    .slice(0, 2)
    .join(' ');

  const prompt = `${titleKeywords} ${baseStyle}, professional digital illustration, clean design, high quality, 4k, no text`;
  
  return {
    prompt: prompt.trim(),
    negativePrompt: 'text, words, letters, watermark, signature, blurry, low quality, distorted',
    style: 'digital-art'
  };
}

/**
 * Déterminer l'aspect ratio optimal
 */
function getOptimalAspectRatio(width = 1024, height = 1024) {
  const ratio = width / height;
  
  if (ratio >= 2.2) return '21:9';    // Ultra-wide
  if (ratio >= 1.7) return '16:9';    // Widescreen
  if (ratio >= 1.4) return '3:2';     // Photo standard
  if (ratio >= 1.1) return '5:4';     // Carré élargi
  if (ratio >= 0.9) return '1:1';     // Carré parfait
  if (ratio >= 0.7) return '4:5';     // Portrait léger
  if (ratio >= 0.6) return '2:3';     // Portrait standard
  if (ratio >= 0.5) return '9:16';    // Portrait mobile
  
  return '1:1'; // Défaut carré
}

/**
 * Générer image avec Stability AI SD3 (nouvelle API)
 */
async function generateWithStabilitySD3(promptData, options = {}) {
  const provider = IMAGE_CONFIG.PROVIDERS['stability-ai'];
  
  if (!provider.apiKey) {
    throw new Error('❌ STABILITY_API_KEY manquante dans le fichier .env');
  }

  const {
    aspectRatio = '1:1',
    outputFormat = 'png',
    stylePreset = 'digital-art',
    seed = 0
  } = options;

  try {
    console.log(`🎨 Génération SD3: "${promptData.prompt.substring(0, 60)}..."`);
    
    // Créer FormData pour multipart/form-data
    const formData = new FormData();
    formData.append('prompt', promptData.prompt);
    formData.append('aspect_ratio', aspectRatio);
    formData.append('output_format', outputFormat);
    
    if (stylePreset && provider.supportedStyles.includes(stylePreset)) {
      formData.append('style_preset', stylePreset);
    }
    
    if (promptData.negativePrompt) {
      formData.append('negative_prompt', promptData.negativePrompt);
    }
    
    if (seed > 0) {
      formData.append('seed', seed);
    }

    const startTime = Date.now();
    
    const response = await axios.post(
      `${provider.baseURL}${provider.endpoint}`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Accept': 'image/*', // Demander l'image directement
          ...formData.getHeaders()
        },
        responseType: 'arraybuffer', // Pour recevoir les bytes de l'image
        timeout: 120000 // 2 minutes
      }
    );

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(1);

    if (response.status === 200) {
      return {
        imageBuffer: Buffer.from(response.data),
        provider: 'stability-sd3',
        cost: provider.costPerImage,
        aspectRatio: aspectRatio,
        format: outputFormat,
        prompt: promptData.prompt,
        generationTime: `${generationTime}s`,
        filename: `stability-sd3-${Date.now()}.${outputFormat}`
      };
    }

    throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);

  } catch (error) {
    console.error('❌ Erreur Stability AI SD3:', error.response?.data || error.message);
    
    // Si erreur de contenu (code 403), essayer sans negative prompt
    if (error.response?.status === 403 && promptData.negativePrompt) {
      console.log('🔄 Retry sans negative prompt...');
      return generateWithStabilitySD3({
        ...promptData,
        negativePrompt: null
      }, options);
    }
    
    throw error;
  }
}

/**
 * Générer image avec DALL-E 3 (fallback)
 */
async function generateWithDALLE(promptData, options = {}) {
  const provider = IMAGE_CONFIG.PROVIDERS['openai-dalle'];
  
  if (!provider.apiKey) {
    throw new Error('❌ OPENAI_API_KEY manquante dans le fichier .env');
  }

  const { size = '1024x1024', quality = 'standard' } = options;

  try {
    console.log(`🎨 Génération DALL-E 3: "${promptData.prompt.substring(0, 60)}..."`);
    
    const payload = {
      model: 'dall-e-3',
      prompt: promptData.prompt,
      n: 1,
      size: size,
      quality: quality,
      response_format: 'b64_json'
    };

    const startTime = Date.now();
    
    const response = await axios.post(
      `${provider.baseURL}${provider.endpoint}`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(1);

    if (response.data.data && response.data.data.length > 0) {
      const imageBase64 = response.data.data[0].b64_json;
      const buffer = Buffer.from(imageBase64, 'base64');
      
      return {
        imageBuffer: buffer,
        provider: 'dall-e-3',
        cost: provider.costPerImage,
        size: size,
        quality: quality,
        prompt: promptData.prompt,
        generationTime: `${generationTime}s`,
        filename: `dalle3-${Date.now()}.png`
      };
    }

    throw new Error('Aucune image dans la réponse DALL-E');

  } catch (error) {
    console.error('❌ Erreur DALL-E 3:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Sauvegarder image localement
 */
async function saveImageLocally(imageBuffer, filename) {
  const outputDir = path.join(__dirname, '../public/uploads/generated-images');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, imageBuffer);
  
  const fileSizeKB = Math.round(imageBuffer.length / 1024);
  console.log(`💾 Image sauvée: ${filename} (${fileSizeKB} KB)`);
  
  return {
    path: filePath,
    filename: filename,
    size: fileSizeKB,
    url: `/uploads/generated-images/${filename}`
  };
}

/**
 * Upload image vers Strapi
 */
async function uploadToStrapi(imageBuffer, filename, metadata = {}) {
  try {
    const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
    const API_TOKEN = process.env.STRAPI_N8N_API_TOKEN;

    if (!API_TOKEN) {
      throw new Error('STRAPI_N8N_API_TOKEN manquant');
    }

    const formData = new FormData();
    formData.append('files', imageBuffer, {
      filename: filename,
      contentType: `image/${path.extname(filename).slice(1)}`
    });

    const response = await axios.post(
      `${STRAPI_URL}/api/upload`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          ...formData.getHeaders()
        }
      }
    );

    if (response.data && response.data.length > 0) {
      const uploadedFile = response.data[0];
      console.log(`☁️ Upload Strapi réussi: ID ${uploadedFile.id}`);
      
      return {
        id: uploadedFile.id,
        url: uploadedFile.url,
        filename: uploadedFile.name,
        size: uploadedFile.size
      };
    }

    throw new Error('Pas de fichier dans la réponse Strapi');

  } catch (error) {
    console.error('❌ Erreur upload Strapi:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Fonction principale de génération d'image
 */
async function generateArticleImage(articleTitle, subreddit = 'programming', options = {}) {
  console.log(`\n🎨 === GÉNÉRATION D'IMAGE ===`);
  console.log(`📰 Article: ${articleTitle}`);
  console.log(`📂 Subreddit: r/${subreddit}`);
  
  const {
    provider = IMAGE_CONFIG.DEFAULT_PROVIDER,
    aspectRatio = '1:1',
    outputFormat = 'png',
    saveLocal = true,
    uploadStrapi = true
  } = options;

  try {
    // 1. Générer le prompt optimisé
    const promptData = generateImagePrompt(articleTitle, subreddit);
    console.log(`📝 Prompt: ${promptData.prompt}`);

    // 2. Générer l'image selon le provider
    let imageResult;
    
    if (provider === 'stability-ai') {
      imageResult = await generateWithStabilitySD3(promptData, {
        aspectRatio,
        outputFormat,
        stylePreset: promptData.style
      });
    } else if (provider === 'openai-dalle') {
      imageResult = await generateWithDALLE(promptData, {
        size: '1024x1024'
      });
    } else {
      throw new Error(`Provider non supporté: ${provider}`);
    }

    console.log(`✅ Image générée: ${imageResult.filename} (${imageResult.generationTime})`);
    console.log(`💰 Coût estimé: $${imageResult.cost.toFixed(4)}`);

    // Créer un nom de fichier descriptif basé sur le titre
    const titleSlug = articleTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')  // Enlever caractères spéciaux
      .replace(/\s+/g, '-')           // Remplacer espaces par tirets
      .replace(/-+/g, '-')            // Éviter tirets multiples
      .substring(0, 50);              // Limiter à 50 caractères
    
    const timestamp = Date.now();
    const extension = imageResult.filename.split('.').pop();
    const descriptiveFilename = `${titleSlug}-${timestamp}.${extension}`;
    
    console.log(`📝 Nom de fichier: ${imageResult.filename} → ${descriptiveFilename}`);

    const results = {
      prompt: promptData.prompt,
      provider: imageResult.provider,
      cost: imageResult.cost,
      generationTime: imageResult.generationTime,
      filename: descriptiveFilename  // Utiliser le nom descriptif
    };

    // 3. Sauvegarder localement si demandé
    if (saveLocal) {
      const localFile = await saveImageLocally(imageResult.imageBuffer, descriptiveFilename);
      results.local = localFile;
    }

    // 4. Upload vers Strapi si demandé
    if (uploadStrapi) {
      const strapiFile = await uploadToStrapi(imageResult.imageBuffer, descriptiveFilename, {
        title: articleTitle,
        subreddit: subreddit,
        prompt: promptData.prompt
      });
      results.strapi = strapiFile;
    }

    console.log(`🎉 Génération terminée avec succès!`);
    return results;

  } catch (error) {
    console.error(`❌ Erreur génération d'image:`, error.message);
    throw error;
  }
}

// Export des fonctions
module.exports = {
  generateArticleImage,
  generateImagePrompt,
  generateWithStabilitySD3,
  generateWithDALLE,
  saveImageLocally,
  uploadToStrapi,
  IMAGE_CONFIG
};

// Test direct si appelé en script
if (require.main === module) {
  const testTitle = "Advanced React Hooks Patterns for Modern Applications";
  const testSubreddit = "reactjs";
  
  generateArticleImage(testTitle, testSubreddit, {
    provider: 'stability-ai',
    aspectRatio: '16:9',
    outputFormat: 'png'
  })
  .then(result => {
    console.log('\n🎯 Résultat final:', result);
  })
  .catch(error => {
    console.error('\n💥 Erreur test:', error.message);
    process.exit(1);
  });
}