/**
 * SERVICE DE TRADUCTION AVEC GROQ
 * Traduction automatique d'articles avec conservation du format Markdown
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');

// Configuration Groq
const groqClient = axios.create({
  baseURL: 'https://api.groq.com/openai/v1',
  headers: {
    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Détecter la langue d'un texte
 */
async function detectLanguage(text) {
  const payload = {
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: "Tu es un détecteur de langue. Réponds UNIQUEMENT par 'fr' ou 'en' selon la langue principale du texte."
      },
      {
        role: "user", 
        content: `Quelle est la langue de ce texte ?\n\n${text.substring(0, 500)}`
      }
    ],
    temperature: 0.1,
    max_tokens: 10
  };

  try {
    const response = await groqClient.post('/chat/completions', payload);
    const detectedLang = response.data.choices[0].message.content.trim().toLowerCase();
    return detectedLang === 'fr' ? 'fr' : 'en';
  } catch (error) {
    console.error('❌ Erreur détection langue Groq:', error.message);
    return 'en'; // Langue par défaut
  }
}

/**
 * Traduire un article en conservant le format Markdown
 */
async function translateArticle(content, fromLang, toLang) {
  const langNames = {
    'fr': 'français',
    'en': 'anglais'
  };

  const payload = {
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content: `Tu es un traducteur expert spécialisé dans les contenus techniques. 
        
        INSTRUCTIONS STRICTES:
        - Traduis du ${langNames[fromLang]} vers le ${langNames[toLang]}
        - CONSERVE ABSOLUMENT le format Markdown (titres #, listes, liens, etc.)
        - Traduis le vocabulaire technique avec précision
        - Garde la structure et mise en forme originale
        - Ne modifie PAS les URLs ou codes
        - Réponds UNIQUEMENT avec la traduction, sans explications`
      },
      {
        role: "user",
        content: `Traduis ce contenu technique du ${langNames[fromLang]} vers le ${langNames[toLang]} :\n\n${content}`
      }
    ],
    temperature: 0.3,
    max_tokens: 4000
  };

  try {
    const response = await groqClient.post('/chat/completions', payload);
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('❌ Erreur traduction Groq:', error.message);
    if (error.response) {
      console.error('📄 Réponse API:', error.response.data);
    }
    throw error;
  }
}

/**
 * Générer un slug dans la langue cible
 */
function generateSlug(title, language, postId) {
  const slugBase = title
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${slugBase}-${language}-${postId}`;
}

module.exports = {
  detectLanguage,
  translateArticle,
  generateSlug
};