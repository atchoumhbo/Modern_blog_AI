/**
 * Rate Limiter - Limite le nombre de requêtes par fenêtre temporelle
 */

class RateLimiter {
  constructor(maxRequests, timeWindow, name = 'API') {
    this.maxRequests = maxRequests; // Nombre max de requêtes
    this.timeWindow = timeWindow;   // Fenêtre temporelle en ms
    this.name = name;                // Nom du limiter (pour logging)
    this.requests = [];              // Timestamps des requêtes
  }

  /**
   * Attendre qu'un slot soit disponible
   */
  async waitForSlot() {
    const now = Date.now();
    
    // Nettoyer les anciennes requêtes (hors de la fenêtre)
    this.requests = this.requests.filter(timestamp => now - timestamp < this.timeWindow);

    // Vérifier si on a atteint la limite
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest);
      
      console.log(`⏸️  [${this.name}] Rate limit atteint (${this.requests.length}/${this.maxRequests})`);
      console.log(`   Attente de ${Math.ceil(waitTime / 1000)}s avant la prochaine requête...`);
      
      // Attendre que la fenêtre se libère
      await this._sleep(waitTime + 100); // +100ms de marge
      
      // Relancer la vérification après l'attente
      return this.waitForSlot();
    }

    // Enregistrer cette requête
    this.requests.push(now);
    
    // Log de debug
    if (this.requests.length > this.maxRequests * 0.8) {
      console.log(`⚠️  [${this.name}] Rate limit proche: ${this.requests.length}/${this.maxRequests}`);
    }
  }

  /**
   * Exécuter une fonction avec rate limiting
   */
  async execute(fn) {
    await this.waitForSlot();
    return await fn();
  }

  /**
   * Obtenir les stats du limiter
   */
  getStats() {
    const now = Date.now();
    const activeRequests = this.requests.filter(t => now - t < this.timeWindow);
    
    return {
      name: this.name,
      active: activeRequests.length,
      max: this.maxRequests,
      windowMs: this.timeWindow,
      utilizationPercent: Math.round((activeRequests.length / this.maxRequests) * 100)
    };
  }

  /**
   * Réinitialiser le limiter
   */
  reset() {
    this.requests = [];
    console.log(`🔄 [${this.name}] Rate limiter réinitialisé`);
  }

  /**
   * Helper sleep
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Manager global de rate limiters
 */
class RateLimiterManager {
  constructor() {
    this.limiters = new Map();
  }

  /**
   * Créer ou obtenir un rate limiter
   */
  getLimiter(name, maxRequests, timeWindow) {
    if (!this.limiters.has(name)) {
      this.limiters.set(name, new RateLimiter(maxRequests, timeWindow, name));
    }
    return this.limiters.get(name);
  }

  /**
   * Obtenir les stats de tous les limiters
   */
  getAllStats() {
    const stats = {};
    for (const [name, limiter] of this.limiters.entries()) {
      stats[name] = limiter.getStats();
    }
    return stats;
  }

  /**
   * Réinitialiser tous les limiters
   */
  resetAll() {
    for (const limiter of this.limiters.values()) {
      limiter.reset();
    }
  }
}

// Instance globale
const rateLimiterManager = new RateLimiterManager();

module.exports = {
  RateLimiter,
  RateLimiterManager,
  rateLimiterManager
};
