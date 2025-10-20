/**
 * Logger structuré avec métriques et statistiques
 */

class Logger {
  constructor(context = 'ImageGenerator') {
    this.context = context;
    this.metrics = {
      totalGenerations: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      totalCost: 0,
      totalTime: 0,
      errors: [],
      startTime: Date.now()
    };
    this.logLevel = process.env.LOG_LEVEL || 'info'; // debug, info, warn, error
  }

  /**
   * Niveaux de log
   */
  get levels() {
    return {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
  }

  /**
   * Vérifier si on doit logger ce niveau
   */
  shouldLog(level) {
    return this.levels[level] >= this.levels[this.logLevel];
  }

  /**
   * Log debug (détails techniques)
   */
  debug(message, data = null) {
    if (this.shouldLog('debug')) {
      console.log(`🔍 [${this.context}] ${message}`);
      if (data) console.log('   Data:', JSON.stringify(data, null, 2));
    }
  }

  /**
   * Log info (informations générales)
   */
  info(message, data = null) {
    if (this.shouldLog('info')) {
      console.log(`ℹ️  [${this.context}] ${message}`);
      if (data) console.log('   ', data);
    }
  }

  /**
   * Log success (opération réussie)
   */
  success(message, data = null) {
    if (this.shouldLog('info')) {
      console.log(`✅ [${this.context}] ${message}`);
      if (data) console.log('   ', data);
    }
  }

  /**
   * Log warning (avertissement)
   */
  warn(message, data = null) {
    if (this.shouldLog('warn')) {
      console.warn(`⚠️  [${this.context}] ${message}`);
      if (data) console.warn('   ', data);
    }
  }

  /**
   * Log error (erreur)
   */
  error(message, error = null) {
    if (this.shouldLog('error')) {
      console.error(`❌ [${this.context}] ${message}`);
      if (error) {
        console.error('   Erreur:', error.message);
        if (error.stack && this.logLevel === 'debug') {
          console.error('   Stack:', error.stack);
        }
      }
    }

    // Enregistrer l'erreur dans les métriques
    this.metrics.errors.push({
      message,
      error: error ? error.message : null,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Logger une génération d'image
   */
  logGeneration(result) {
    this.metrics.totalGenerations++;
    
    if (result.success) {
      this.metrics.successfulGenerations++;
      this.metrics.totalCost += result.cost || 0;
      this.metrics.totalTime += parseFloat(result.generationTime) || 0;

      const avgTime = (this.metrics.totalTime / this.metrics.successfulGenerations).toFixed(1);
      
      this.success(
        `Image générée (#${this.metrics.totalGenerations})`,
        {
          provider: result.provider,
          cost: `$${result.cost?.toFixed(4)}`,
          time: `${result.generationTime}s`,
          avgTime: `${avgTime}s`
        }
      );
    } else {
      this.metrics.failedGenerations++;
      this.error(`Génération échouée (#${this.metrics.totalGenerations})`);
    }
  }

  /**
   * Afficher les statistiques
   */
  logStats() {
    const uptime = Math.round((Date.now() - this.metrics.startTime) / 1000);
    const successRate = this.metrics.totalGenerations > 0
      ? Math.round((this.metrics.successfulGenerations / this.metrics.totalGenerations) * 100)
      : 0;

    console.log('\n📊 ═══════════════════════════════════════════');
    console.log('📊 STATISTIQUES DE GÉNÉRATION D\'IMAGES');
    console.log('📊 ═══════════════════════════════════════════');
    console.log(`   Total générations:      ${this.metrics.totalGenerations}`);
    console.log(`   ✅ Réussies:            ${this.metrics.successfulGenerations}`);
    console.log(`   ❌ Échouées:            ${this.metrics.failedGenerations}`);
    console.log(`   📈 Taux de succès:      ${successRate}%`);
    console.log(`   💰 Coût total:          $${this.metrics.totalCost.toFixed(4)}`);
    
    if (this.metrics.successfulGenerations > 0) {
      const avgCost = this.metrics.totalCost / this.metrics.successfulGenerations;
      const avgTime = this.metrics.totalTime / this.metrics.successfulGenerations;
      console.log(`   💵 Coût moyen:          $${avgCost.toFixed(4)}/image`);
      console.log(`   ⏱️  Temps moyen:         ${avgTime.toFixed(1)}s/image`);
    }
    
    console.log(`   ⏰ Uptime:              ${uptime}s`);
    console.log('📊 ═══════════════════════════════════════════\n');
  }

  /**
   * Obtenir les métriques
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: Math.round((Date.now() - this.metrics.startTime) / 1000),
      successRate: this.metrics.totalGenerations > 0
        ? Math.round((this.metrics.successfulGenerations / this.metrics.totalGenerations) * 100)
        : 0,
      averageCost: this.metrics.successfulGenerations > 0
        ? this.metrics.totalCost / this.metrics.successfulGenerations
        : 0,
      averageTime: this.metrics.successfulGenerations > 0
        ? this.metrics.totalTime / this.metrics.successfulGenerations
        : 0
    };
  }

  /**
   * Réinitialiser les métriques
   */
  resetMetrics() {
    this.metrics = {
      totalGenerations: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      totalCost: 0,
      totalTime: 0,
      errors: [],
      startTime: Date.now()
    };
    this.info('Métriques réinitialisées');
  }

  /**
   * Logger une étape de processus
   */
  logStep(stepNumber, totalSteps, stepName) {
    this.info(`[${stepNumber}/${totalSteps}] ${stepName}`);
  }

  /**
   * Logger un timer
   */
  startTimer(name) {
    const startTime = Date.now();
    return {
      stop: () => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        this.debug(`⏱️  ${name} terminé en ${elapsed}s`);
        return parseFloat(elapsed);
      }
    };
  }
}

// Instance globale
const logger = new Logger('ImageGeneratorV2');

module.exports = {
  Logger,
  logger
};
