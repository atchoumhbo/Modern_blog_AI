/**
 * Module de génération de summaries automatiques avec détection de langue
 * 
 * Fonctionnalités :
 * - Détection automatique de la langue (FR, EN, ES, DE)
 * - Génération de summaries concis (2-3 phrases)
 * - Support de différents LLM (OpenAI, Perplexity, Groq)
 * - Fallback intelligent si l'API échoue
 */

const axios = require('axios');

/**
 * Patterns de détection de langue
 */
const LANGUAGE_PATTERNS = {
  'fr': /\b(le|la|les|un|une|des|et|ou|dans|pour|avec|sur|par|qui|que|est|sont|cette|ce)\b/gi,
  'en': /\b(the|a|an|and|or|in|for|with|on|by|at|is|are|this|that|these|those)\b/gi,
  'es': /\b(el|la|los|las|un|una|y|o|en|para|con|es|son|este|esta|estos|estas)\b/gi,
  'de': /\b(der|die|das|ein|eine|und|oder|in|für|mit|ist|sind|dieser|diese|dieses)\b/gi
};

/**
 * Noms de langues
 */
const LANGUAGE_NAMES = {
  'fr': 'français',
  'en': 'anglais',
  'es': 'espagnol',
  'de': 'allemand'
};

/**
 * Détecte la langue d'un texte
 * @param {string} text - Texte à analyser
 * @returns {string} Code langue (fr, en, es, de)
 */
function detectLanguage(text) {
  if (!text || text.trim().length === 0) {
    return 'en'; // Défaut anglais
  }

  const scores = {};
  
  // Compter les occurrences de mots-clés par langue
  for (const [lang, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
    const matches = text.match(pattern);
    scores[lang] = matches ? matches.length : 0;
  }

  // Langue avec le plus de matches
  const detectedLang = Object.keys(scores).reduce((a, b) => 
    scores[a] > scores[b] ? a : b
  );

  // Si aucun match significatif (< 3), défaut anglais
  if (scores[detectedLang] < 3) {
    return 'en';
  }

  return detectedLang;
}

/**
 * Prompts de génération par langue
 */
const SUMMARY_PROMPTS = {
  'fr': (title, content) => `Résume cet article en 2-3 phrases courtes et percutantes en français.

Titre: ${title}

Contenu:
${content.substring(0, 2000)}

Instructions:
- 2-3 phrases maximum
- Style concis et informatif
- Capture l'essentiel du sujet
- Pas de markdown, texte brut uniquement`,

  'en': (title, content) => `Summarize this article in 2-3 short, punchy sentences in English.

Title: ${title}

Content:
${content.substring(0, 2000)}

Instructions:
- 2-3 sentences maximum
- Concise and informative style
- Capture the essence of the topic
- No markdown, plain text only`,

  'es': (title, content) => `Resume este artículo en 2-3 frases cortas e impactantes en español.

Título: ${title}

Contenido:
${content.substring(0, 2000)}

Instrucciones:
- 2-3 frases máximo
- Estilo conciso e informativo
- Captura la esencia del tema
- Sin markdown, solo texto plano`,

  'de': (title, content) => `Fasse diesen Artikel in 2-3 kurzen, prägnanten Sätzen auf Deutsch zusammen.

Titel: ${title}

Inhalt:
${content.substring(0, 2000)}

Anweisungen:
- 2-3 Sätze maximal
- Prägnanter und informativer Stil
- Erfasse das Wesentliche des Themas
- Kein Markdown, nur Klartext`
};

/**
 * Génère un summary avec OpenAI
 * @param {string} content - Contenu de l'article
 * @param {string} title - Titre de l'article
 * @param {string} language - Langue détectée
 * @param {object} options - Options de génération
 * @returns {Promise<string>} Summary généré
 */
async function generateWithOpenAI(content, title, language, options = {}) {
  const {
    model = 'gpt-4o-mini',
    temperature = 0.7,
    maxTokens = 200,
    apiKey = process.env.OPENAI_API_KEY
  } = options;

  if (!apiKey) {
    throw new Error('OpenAI API key non configurée');
  }

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model,
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en résumés concis et percutants. Crée des résumés de 2-3 phrases maximum, sans markdown.'
        },
        {
          role: 'user',
          content: SUMMARY_PROMPTS[language](title, content)
        }
      ],
      temperature,
      max_tokens: maxTokens
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  return response.data.choices[0].message.content.trim();
}

/**
 * Génère un summary avec Perplexity
 * @param {string} content - Contenu de l'article
 * @param {string} title - Titre de l'article
 * @param {string} language - Langue détectée
 * @param {object} options - Options de génération
 * @returns {Promise<string>} Summary généré
 */
async function generateWithPerplexity(content, title, language, options = {}) {
  const {
    model = 'llama-3.1-sonar-small-128k-online',
    temperature = 0.7,
    maxTokens = 200,
    apiKey = process.env.PERPLEXITY_API_KEY
  } = options;

  if (!apiKey) {
    throw new Error('Perplexity API key non configurée');
  }

  const response = await axios.post(
    'https://api.perplexity.ai/chat/completions',
    {
      model,
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en résumés concis. Crée des résumés de 2-3 phrases maximum.'
        },
        {
          role: 'user',
          content: SUMMARY_PROMPTS[language](title, content)
        }
      ],
      temperature,
      max_tokens: maxTokens
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  return response.data.choices[0].message.content.trim();
}

/**
 * Génère un summary avec Groq
 * @param {string} content - Contenu de l'article
 * @param {string} title - Titre de l'article
 * @param {string} language - Langue détectée
 * @param {object} options - Options de génération
 * @returns {Promise<string>} Summary généré
 */
async function generateWithGroq(content, title, language, options = {}) {
  const {
    model = 'llama-3.1-70b-versatile',
    temperature = 0.7,
    maxTokens = 200,
    apiKey = process.env.GROQ_API_KEY
  } = options;

  if (!apiKey) {
    throw new Error('Groq API key non configurée');
  }

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model,
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en résumés concis. Crée des résumés de 2-3 phrases maximum.'
        },
        {
          role: 'user',
          content: SUMMARY_PROMPTS[language](title, content)
        }
      ],
      temperature,
      max_tokens: maxTokens
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  return response.data.choices[0].message.content.trim();
}

/**
 * Fallback : extrait le premier paragraphe
 * @param {string} content - Contenu de l'article
 * @param {number} maxLength - Longueur maximum
 * @returns {string} Premier paragraphe tronqué
 */
function generateFallbackSummary(content, maxLength = 200) {
  if (!content || content.trim().length === 0) {
    return 'Article disponible.';
  }

  // Nettoyer le Markdown
  const cleanContent = content
    .replace(/#{1,6}\s/g, '')           // Headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Liens
    .replace(/[*_~`]/g, '')             // Formatage
    .replace(/\n{2,}/g, '\n\n')         // Double newlines
    .trim();

  // Premier paragraphe
  const firstParagraph = cleanContent.split('\n\n')[0];

  if (firstParagraph.length <= maxLength) {
    return firstParagraph;
  }

  // Tronquer à la dernière phrase complète
  const truncated = firstParagraph.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  
  if (lastPeriod > maxLength * 0.5) {
    return truncated.substring(0, lastPeriod + 1);
  }

  return truncated.trim() + '...';
}

/**
 * Génère un summary automatique avec détection de langue
 * @param {string} content - Contenu de l'article
 * @param {string} title - Titre de l'article
 * @param {object} options - Options de génération
 * @returns {Promise<object>} { summary, language, languageName }
 */
async function generateSummary(content, title, options = {}) {
  const {
    provider = 'openai',  // 'openai', 'perplexity', 'groq'
    forceLanguage = null, // Forcer une langue (null = auto-détection)
    maxLength = 200,
    verbose = false
  } = options;

  // Détection de la langue
  const language = forceLanguage || detectLanguage(content);
  const languageName = LANGUAGE_NAMES[language] || 'anglais';

  if (verbose) {
    console.log(`📊 Génération du summary...`);
    console.log(`   🌍 Langue: ${languageName} (${language})`);
    console.log(`   🤖 Provider: ${provider}`);
  }

  try {
    let summary;

    // Sélection du provider
    switch (provider.toLowerCase()) {
      case 'openai':
        summary = await generateWithOpenAI(content, title, language, options);
        break;
      case 'perplexity':
        summary = await generateWithPerplexity(content, title, language, options);
        break;
      case 'groq':
        summary = await generateWithGroq(content, title, language, options);
        break;
      default:
        throw new Error(`Provider inconnu: ${provider}`);
    }

    // Nettoyer le summary (enlever markdown éventuel)
    summary = summary
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .trim();

    if (verbose) {
      console.log(`   ✅ Summary généré (${summary.length} caractères)`);
      console.log(`   📝 "${summary.substring(0, 100)}..."`);
    }

    return {
      summary,
      language,
      languageName,
      provider,
      length: summary.length
    };
  } catch (error) {
    if (verbose) {
      console.error(`   ❌ Erreur génération summary:`, error.message);
      console.log(`   🔄 Utilisation du fallback...`);
    }

    // Fallback
    const fallbackSummary = generateFallbackSummary(content, maxLength);

    return {
      summary: fallbackSummary,
      language,
      languageName,
      provider: 'fallback',
      length: fallbackSummary.length,
      error: error.message
    };
  }
}

module.exports = {
  generateSummary,
  detectLanguage,
  generateFallbackSummary,
  LANGUAGE_NAMES,
  LANGUAGE_PATTERNS
};
