/**
 * Gestionnaire de cache pour éviter les générations en double
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CacheManager {
  constructor(cacheDir = null) {
    this.cacheDir = cacheDir || path.join(__dirname, '../../cache');
    this.cacheDuration = 24 * 60 * 60 * 1000; // 24h par défaut
    this.ensureCacheDir();
  }

  /**
   * S'assurer que le dossier cache existe
   */
  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      console.log(`📁 Dossier cache créé: ${this.cacheDir}`);
    }
  }

  /**
   * Générer une clé de cache unique
   */
  getCacheKey(articleTitle, subreddit, options = {}) {
    const data = JSON.stringify({
      title: articleTitle.toLowerCase().trim(),
      subreddit: subreddit?.toLowerCase(),
      provider: options.provider,
      aspectRatio: options.aspectRatio,
      style: options.style
    });
    
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * Obtenir le chemin du fichier cache
   */
  getCacheFilePath(cacheKey) {
    return path.join(this.cacheDir, `${cacheKey}.json`);
  }

  /**
   * Vérifier si un résultat est en cache
   */
  has(cacheKey) {
    const cacheFile = this.getCacheFilePath(cacheKey);
    
    if (!fs.existsSync(cacheFile)) {
      return false;
    }

    // Vérifier si le cache est encore valide
    try {
      const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      const age = Date.now() - cacheData.timestamp;
      
      return age < this.cacheDuration;
    } catch (error) {
      console.error(`⚠️  Erreur lecture cache ${cacheKey}:`, error.message);
      return false;
    }
  }

  /**
   * Récupérer un résultat du cache
   */
  get(cacheKey) {
    const cacheFile = this.getCacheFilePath(cacheKey);

    if (!this.has(cacheKey)) {
      return null;
    }

    try {
      const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      const age = Math.round((Date.now() - cacheData.timestamp) / 1000 / 60); // en minutes
      
      console.log(`📦 Image trouvée dans le cache (age: ${age}min)`);
      
      return cacheData.result;
    } catch (error) {
      console.error(`⚠️  Erreur lecture cache ${cacheKey}:`, error.message);
      return null;
    }
  }

  /**
   * Sauvegarder un résultat dans le cache
   */
  set(cacheKey, result) {
    const cacheFile = this.getCacheFilePath(cacheKey);

    try {
      const cacheData = {
        timestamp: Date.now(),
        cacheKey,
        result
      };

      fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2), 'utf8');
      console.log(`💾 Résultat sauvegardé dans le cache: ${cacheKey}`);
      
      return true;
    } catch (error) {
      console.error(`⚠️  Erreur écriture cache ${cacheKey}:`, error.message);
      return false;
    }
  }

  /**
   * Supprimer un élément du cache
   */
  delete(cacheKey) {
    const cacheFile = this.getCacheFilePath(cacheKey);

    if (fs.existsSync(cacheFile)) {
      try {
        fs.unlinkSync(cacheFile);
        console.log(`🗑️  Cache supprimé: ${cacheKey}`);
        return true;
      } catch (error) {
        console.error(`⚠️  Erreur suppression cache ${cacheKey}:`, error.message);
        return false;
      }
    }

    return false;
  }

  /**
   * Nettoyer les caches expirés
   */
  cleanup() {
    try {
      const files = fs.readdirSync(this.cacheDir);
      let cleaned = 0;

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(this.cacheDir, file);
        
        try {
          const cacheData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const age = Date.now() - cacheData.timestamp;

          if (age > this.cacheDuration) {
            fs.unlinkSync(filePath);
            cleaned++;
          }
        } catch (error) {
          // Fichier corrompu, le supprimer
          fs.unlinkSync(filePath);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`🧹 ${cleaned} cache(s) expiré(s) nettoyé(s)`);
      }

      return cleaned;
    } catch (error) {
      console.error('⚠️  Erreur nettoyage cache:', error.message);
      return 0;
    }
  }

  /**
   * Vider tout le cache
   */
  clear() {
    try {
      const files = fs.readdirSync(this.cacheDir);
      let cleared = 0;

      for (const file of files) {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(this.cacheDir, file));
          cleared++;
        }
      }

      console.log(`🗑️  Cache vidé: ${cleared} fichier(s) supprimé(s)`);
      return cleared;
    } catch (error) {
      console.error('⚠️  Erreur vidage cache:', error.message);
      return 0;
    }
  }

  /**
   * Obtenir les statistiques du cache
   */
  getStats() {
    try {
      const files = fs.readdirSync(this.cacheDir).filter(f => f.endsWith('.json'));
      const now = Date.now();
      
      let totalSize = 0;
      let validCount = 0;
      let expiredCount = 0;

      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;

        try {
          const cacheData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const age = now - cacheData.timestamp;
          
          if (age < this.cacheDuration) {
            validCount++;
          } else {
            expiredCount++;
          }
        } catch (error) {
          expiredCount++;
        }
      }

      return {
        total: files.length,
        valid: validCount,
        expired: expiredCount,
        sizeBytes: totalSize,
        sizeMB: (totalSize / 1024 / 1024).toFixed(2),
        cacheDir: this.cacheDir
      };
    } catch (error) {
      return {
        total: 0,
        valid: 0,
        expired: 0,
        sizeBytes: 0,
        sizeMB: '0.00',
        error: error.message
      };
    }
  }

  /**
   * Définir la durée de validité du cache
   */
  setCacheDuration(durationMs) {
    this.cacheDuration = durationMs;
    console.log(`⏰ Durée de cache définie: ${durationMs / 1000 / 60}min`);
  }
}

// Instance globale
const cacheManager = new CacheManager();

module.exports = {
  CacheManager,
  cacheManager
};
