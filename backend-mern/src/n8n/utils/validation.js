/**
 * Validation des inputs avec messages d'erreur clairs
 */

/**
 * Valider le titre de l'article
 */
function validateArticleTitle(title) {
  const errors = [];

  if (!title) {
    errors.push('Le titre est requis');
  }

  if (typeof title !== 'string') {
    errors.push('Le titre doit être une chaîne de caractères');
  }

  if (title && title.length < 3) {
    errors.push('Le titre doit contenir au moins 3 caractères');
  }

  if (title && title.length > 255) {
    errors.push('Le titre ne peut pas dépasser 255 caractères');
  }

  if (title && title.trim().length === 0) {
    errors.push('Le titre ne peut pas être vide ou contenir uniquement des espaces');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Valider le subreddit
 */
function validateSubreddit(subreddit) {
  const errors = [];

  if (subreddit && typeof subreddit !== 'string') {
    errors.push('Le subreddit doit être une chaîne de caractères');
  }

  if (subreddit && subreddit.length > 50) {
    errors.push('Le subreddit ne peut pas dépasser 50 caractères');
  }

  // Validation du format (lettres, chiffres, underscore)
  if (subreddit && !/^[a-zA-Z0-9_]+$/.test(subreddit)) {
    errors.push('Le subreddit ne peut contenir que des lettres, chiffres et underscores');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Valider les options de génération
 */
function validateGenerationOptions(options, provider) {
  const errors = [];

  if (!options || typeof options !== 'object') {
    errors.push('Les options doivent être un objet');
    return { valid: false, errors };
  }

  // Validation du provider
  if (options.provider && typeof options.provider !== 'string') {
    errors.push('Le provider doit être une chaîne de caractères');
  }

  // Validation selon le provider
  if (provider === 'stability-ai') {
    // Aspect ratio
    if (options.aspectRatio) {
      const validRatios = ['16:9', '1:1', '21:9', '2:3', '3:2', '4:5', '5:4', '9:16', '9:21'];
      if (!validRatios.includes(options.aspectRatio)) {
        errors.push(`Aspect ratio invalide. Valeurs acceptées: ${validRatios.join(', ')}`);
      }
    }

    // Output format
    if (options.outputFormat) {
      const validFormats = ['jpeg', 'png', 'webp'];
      if (!validFormats.includes(options.outputFormat)) {
        errors.push(`Format de sortie invalide. Valeurs acceptées: ${validFormats.join(', ')}`);
      }
    }

    // Style
    if (options.style) {
      const validStyles = [
        '3d-model', 'analog-film', 'anime', 'cinematic', 'comic-book', 
        'digital-art', 'enhance', 'fantasy-art', 'isometric', 'line-art',
        'low-poly', 'modeling-compound', 'neon-punk', 'origami', 
        'photographic', 'pixel-art', 'tile-texture'
      ];
      if (!validStyles.includes(options.style)) {
        errors.push(`Style invalide. Valeurs acceptées: ${validStyles.join(', ')}`);
      }
    }
  } else if (provider === 'openai-dalle') {
    // Size
    if (options.size) {
      const validSizes = ['1024x1024', '1792x1024', '1024x1792'];
      if (!validSizes.includes(options.size)) {
        errors.push(`Taille invalide. Valeurs acceptées: ${validSizes.join(', ')}`);
      }
    }

    // Quality
    if (options.quality) {
      const validQualities = ['standard', 'hd'];
      if (!validQualities.includes(options.quality)) {
        errors.push(`Qualité invalide. Valeurs acceptées: ${validQualities.join(', ')}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Valider tous les inputs d'un coup
 */
function validateAllInputs(articleTitle, subreddit, options, provider) {
  const titleValidation = validateArticleTitle(articleTitle);
  const subredditValidation = validateSubreddit(subreddit);
  const optionsValidation = validateGenerationOptions(options, provider);

  const allErrors = [
    ...titleValidation.errors.map(e => `Titre: ${e}`),
    ...subredditValidation.errors.map(e => `Subreddit: ${e}`),
    ...optionsValidation.errors.map(e => `Options: ${e}`)
  ];

  if (allErrors.length > 0) {
    throw new ValidationError('Erreurs de validation', allErrors);
  }

  return true;
}

/**
 * Classe d'erreur personnalisée pour la validation
 */
class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    this.isValidationError = true;
  }

  toString() {
    return `${this.message}:\n${this.errors.map(e => `  - ${e}`).join('\n')}`;
  }
}

/**
 * Valider les variables d'environnement requises
 */
function validateEnvironment(requiredVars = []) {
  const missing = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new ValidationError(
      'Variables d\'environnement manquantes',
      missing.map(v => `${v} n'est pas définie`)
    );
  }

  return true;
}

/**
 * Valider une clé API (non vide et format correct)
 */
function validateApiKey(apiKey, serviceName) {
  const errors = [];

  if (!apiKey) {
    errors.push(`Clé API ${serviceName} manquante`);
  }

  if (apiKey && typeof apiKey !== 'string') {
    errors.push(`Clé API ${serviceName} doit être une chaîne de caractères`);
  }

  if (apiKey && apiKey.length < 10) {
    errors.push(`Clé API ${serviceName} trop courte (min 10 caractères)`);
  }

  if (errors.length > 0) {
    throw new ValidationError(`Validation clé API ${serviceName}`, errors);
  }

  return true;
}

module.exports = {
  validateArticleTitle,
  validateSubreddit,
  validateGenerationOptions,
  validateAllInputs,
  validateEnvironment,
  validateApiKey,
  ValidationError
};
