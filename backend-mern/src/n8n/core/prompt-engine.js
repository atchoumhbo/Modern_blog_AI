/**
 * Moteur de génération de prompts contextuels intelligents
 * Analyse le titre et le subreddit pour créer des prompts optimaux
 */

const { CONTEXTS, SUBREDDIT_CONTEXT_MAP, DEFAULT_CONTEXT } = require('../config/contexts');

class PromptEngine {
  constructor() {
    this.contexts = CONTEXTS;
    this.subredditMap = SUBREDDIT_CONTEXT_MAP;
    this.defaultContext = DEFAULT_CONTEXT;
  }

  /**
   * Générer un prompt enrichi et contextualisé
   */
  generateEnrichedPrompt(articleTitle, subreddit = 'programming', metadata = {}) {
    console.log(`\n🎨 ═══════════════════════════════════════════`);
    console.log(`   Génération de prompt enrichi`);
    console.log(`   Titre: "${articleTitle}"`);
    console.log(`   Subreddit: r/${subreddit}`);
    console.log(`🎨 ═══════════════════════════════════════════`);

    // 1. Détecter le contexte depuis le titre
    const titleContext = this.detectContextFromTitle(articleTitle);
    
    // 2. Détecter le contexte depuis le subreddit
    const subredditContext = this.getContextFromSubreddit(subreddit);
    
    // 3. Fusionner les contextes (priorité au titre)
    const finalContext = this.mergeContexts(titleContext, subredditContext);
    
    // 4. Extraire les mots-clés du titre
    const keywords = this.extractKeywords(articleTitle);
    
    // 5. Construire le prompt final
    const prompt = this.buildPrompt(articleTitle, keywords, finalContext, metadata);
    
    // 6. Construire le negative prompt
    const negativePrompt = this.buildNegativePrompt(finalContext);
    
    // 7. Déterminer le style
    const style = finalContext.style || 'digital-art';

    const result = {
      prompt,
      negativePrompt,
      style,
      metadata: {
        category: finalContext.category,
        keywords,
        dominantColors: finalContext.dominantColors,
        technicalElements: finalContext.technicalElements,
        mood: finalContext.mood,
        detectedContext: titleContext ? titleContext.category : 'Default'
      }
    };

    console.log(`\n📝 Prompt généré:`);
    console.log(`   Catégorie: ${result.metadata.category}`);
    console.log(`   Style: ${style}`);
    console.log(`   Keywords: ${keywords.join(', ')}`);
    console.log(`   Prompt: "${prompt.substring(0, 100)}..."`);
    console.log(`🎨 ═══════════════════════════════════════════\n`);

    return result;
  }

  /**
   * Détecter le contexte depuis le titre de l'article
   */
  detectContextFromTitle(title) {
    const titleLower = title.toLowerCase();
    
    // Chercher une correspondance exacte avec les keywords
    for (const [contextKey, context] of Object.entries(this.contexts)) {
      for (const keyword of context.keywords) {
        if (titleLower.includes(keyword)) {
          console.log(`   ✓ Contexte détecté depuis titre: ${context.category}`);
          return context;
        }
      }
    }
    
    return null;
  }

  /**
   * Obtenir le contexte depuis le subreddit
   */
  getContextFromSubreddit(subreddit) {
    const contextKey = this.subredditMap[subreddit];
    
    if (contextKey && this.contexts[contextKey]) {
      console.log(`   ✓ Contexte depuis subreddit: ${this.contexts[contextKey].category}`);
      return this.contexts[contextKey];
    }
    
    return this.defaultContext;
  }

  /**
   * Fusionner deux contextes (priorité au premier)
   */
  mergeContexts(primaryContext, secondaryContext) {
    if (primaryContext) {
      console.log(`   → Utilisation contexte primaire: ${primaryContext.category}`);
      return primaryContext;
    }
    
    console.log(`   → Utilisation contexte secondaire: ${secondaryContext.category}`);
    return secondaryContext;
  }

  /**
   * Extraire les mots-clés pertinents du titre
   */
  extractKeywords(title) {
    // Mots à ignorer (stop words)
    const stopWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'tutorial', 'guide', 'tips', 'best', 'practices', 'how', 'what', 'why',
      'when', 'where', 'which', 'who', 'that', 'this', 'these', 'those'
    ];

    // Nettoyer et extraire les mots
    const words = title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // Remplacer ponctuation par espaces
      .split(/\s+/)               // Séparer par espaces
      .filter(word => 
        word.length > 3 &&        // Au moins 4 caractères
        !stopWords.includes(word) // Pas un stop word
      );

    // Prendre les 3 premiers mots pertinents
    return words.slice(0, 3);
  }

  /**
   * Construire le prompt final optimisé pour Stability AI
   */
  buildPrompt(title, keywords, context, metadata = {}) {
    const parts = [];

    // 1. Sujet principal (keywords)
    if (keywords.length > 0) {
      parts.push(`A professional illustration about ${keywords.join(' and ')}`);
    }

    // 2. Style visuel du contexte
    if (context.visualStyle) {
      parts.push(context.visualStyle);
    }

    // 3. Éléments techniques
    if (context.technicalElements && context.technicalElements.length > 0) {
      parts.push(`featuring ${context.technicalElements.join(', ')}`);
    }

    // 4. Mood/ambiance
    if (context.mood) {
      parts.push(`${context.mood} atmosphere`);
    }

    // 5. Qualité et style général
    parts.push('high quality, 4k, professional digital art, clean modern design, no text overlay');

    // Assembler le prompt
    return parts.join(', ');
  }

  /**
   * Construire le negative prompt
   */
  buildNegativePrompt(context) {
    const baseForbidden = [
      'text', 'words', 'letters', 'watermark', 'signature', 
      'blurry', 'low quality', 'distorted', 'ugly', 'deformed',
      'pixelated', 'grainy', 'noise'
    ];

    // Ajouter des interdictions spécifiques au contexte
    const contextualForbidden = [];
    
    // Pour les contextes de sécurité, éviter les images trop sensationnalistes
    if (context.category && context.category.includes('Security')) {
      contextualForbidden.push('gore', 'violence', 'blood');
    }

    return [...baseForbidden, ...contextualForbidden].join(', ');
  }

  /**
   * Ajouter un contexte personnalisé
   */
  addCustomContext(key, contextData) {
    const requiredFields = ['category', 'keywords', 'visualStyle'];
    
    for (const field of requiredFields) {
      if (!contextData[field]) {
        throw new Error(`Champ requis manquant: ${field}`);
      }
    }

    this.contexts[key] = {
      category: contextData.category,
      keywords: contextData.keywords,
      visualStyle: contextData.visualStyle,
      technicalElements: contextData.technicalElements || [],
      dominantColors: contextData.dominantColors || [],
      style: contextData.style || 'digital-art',
      mood: contextData.mood || 'professional'
    };

    console.log(`✅ Contexte personnalisé ajouté: ${key} (${contextData.category})`);
  }

  /**
   * Lister tous les contextes disponibles
   */
  listContexts() {
    const contextList = Object.entries(this.contexts).map(([key, ctx]) => ({
      key,
      category: ctx.category,
      keywords: ctx.keywords
    }));

    return contextList;
  }

  /**
   * Obtenir les statistiques des contextes
   */
  getStats() {
    return {
      totalContexts: Object.keys(this.contexts).length,
      categories: [...new Set(Object.values(this.contexts).map(c => c.category))],
      subredditMappings: Object.keys(this.subredditMap).length
    };
  }
}

// Instance globale
const promptEngine = new PromptEngine();

module.exports = {
  PromptEngine,
  promptEngine
};
