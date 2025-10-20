/**
 * Système de retry avec backoff exponentiel
 */

/**
 * Retry une fonction asynchrone avec backoff exponentiel
 * @param {Function} fn - Fonction async à exécuter
 * @param {number} maxRetries - Nombre maximum de tentatives
 * @param {number} baseDelay - Délai de base en ms
 * @param {string} operationName - Nom de l'opération (pour logging)
 * @returns {Promise<any>}
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000, operationName = 'operation') {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Tentative d'exécution
      const result = await fn();
      
      // Succès
      if (attempt > 0) {
        console.log(`✅ ${operationName} réussi après ${attempt + 1} tentative(s)`);
      }
      
      return result;

    } catch (error) {
      lastError = error;
      
      // Dernière tentative échouée
      if (attempt === maxRetries - 1) {
        console.error(`❌ ${operationName} échoué après ${maxRetries} tentatives`);
        throw error;
      }

      // Calculer le délai avec backoff exponentiel + jitter
      const exponentialDelay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 1000; // Ajouter jusqu'à 1s de jitter
      const delay = Math.min(exponentialDelay + jitter, 30000); // Max 30s

      console.log(`⏳ ${operationName} échoué (tentative ${attempt + 1}/${maxRetries})`);
      console.log(`   Erreur: ${error.message}`);
      console.log(`   Nouvelle tentative dans ${Math.ceil(delay / 1000)}s...`);

      // Attendre avant la prochaine tentative
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry avec conditions spécifiques (erreurs retryable)
 */
async function retryWithConditions(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    operationName = 'operation',
    shouldRetry = (error) => true, // Fonction pour déterminer si on doit retry
    onRetry = null // Callback appelé avant chaque retry
  } = options;

  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Vérifier si on doit retry cette erreur
      if (attempt < maxRetries - 1 && shouldRetry(error)) {
        const delay = baseDelay * Math.pow(2, attempt);
        
        console.log(`⏳ ${operationName} - Retry ${attempt + 1}/${maxRetries} dans ${delay}ms`);
        console.log(`   Raison: ${error.message}`);

        // Callback optionnel
        if (onRetry) {
          await onRetry(attempt, error);
        }

        await sleep(delay);
      } else {
        // Erreur non-retryable ou dernière tentative
        throw error;
      }
    }
  }

  throw lastError;
}

/**
 * Vérifier si une erreur est retryable (erreurs réseau, timeouts, rate limits)
 */
function isRetryableError(error) {
  // Erreurs HTTP retryables
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  if (error.response && retryableStatusCodes.includes(error.response.status)) {
    return true;
  }

  // Erreurs réseau
  const networkErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'];
  if (error.code && networkErrors.includes(error.code)) {
    return true;
  }

  // Rate limiting
  if (error.message && error.message.toLowerCase().includes('rate limit')) {
    return true;
  }

  return false;
}

module.exports = {
  retryWithBackoff,
  retryWithConditions,
  isRetryableError,
  sleep
};
