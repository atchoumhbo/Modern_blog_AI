/**
 * SYSTÈME DE TRACKING DES ARTICLES REDDIT (Version SQLite)
 * Évite le retraitement des mêmes posts avec base de données SQLite
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Base de données SQLite
const dbPath = path.join(__dirname, 'reddit-tracking.db');

class RedditTracker {
  constructor() {
    this.db = new sqlite3.Database(dbPath);
    this.initDatabase();
  }

  /**
   * Initialiser la base de données SQLite
   */
  initDatabase() {
    const createTable = `
      CREATE TABLE IF NOT EXISTS processed_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        subreddit TEXT NOT NULL,
        url TEXT NOT NULL,
        processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        strapi_id_fr INTEGER,
        strapi_id_en INTEGER,
        impact_score INTEGER,
        processing_priority INTEGER
      )
    `;

    this.db.run(createTable, (err) => {
      if (err) {
        console.error('❌ Erreur création table SQLite:', err.message);
      } else {
        console.log('✅ Table processed_posts créée/vérifiée');
      }
    });
  }

  /**
   * Vérifier si un post a déjà été traité
   */
  async isPostProcessed(postId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id FROM processed_posts WHERE post_id = ?';
      this.db.get(query, [postId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      });
    });
  }

  /**
   * Marquer un post comme traité
   */
  async markPostAsProcessed(post, strapiIds = {}) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO processed_posts 
        (post_id, title, subreddit, url, strapi_id_fr, strapi_id_en, impact_score, processing_priority)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        post.id,
        post.title,
        post.subreddit || '',
        post.url || '',
        strapiIds.fr || null,
        strapiIds.en || null,
        post.impactScore || 0,
        post.processingPriority || 0
      ];

      this.db.run(query, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  /**
   * Obtenir les statistiques
   */
  async getStats() {
    return new Promise((resolve, reject) => {
      const queries = {
        total: 'SELECT COUNT(*) as count FROM processed_posts',
        today: 'SELECT COUNT(*) as count FROM processed_posts WHERE DATE(processed_at) = DATE("now")',
        week: 'SELECT COUNT(*) as count FROM processed_posts WHERE processed_at >= datetime("now", "-7 days")'
      };

      const stats = {};
      const promises = Object.entries(queries).map(([key, query]) => {
        return new Promise((res, rej) => {
          this.db.get(query, (err, row) => {
            if (err) rej(err);
            else {
              stats[key] = row.count;
              res();
            }
          });
        });
      });

      Promise.all(promises)
        .then(() => resolve(stats))
        .catch(reject);
    });
  }

  /**
   * Filtrer les posts non traités
   */
  async filterUnprocessedPosts(posts) {
    const unprocessedPosts = [];
    
    for (const post of posts) {
      try {
        const isProcessed = await this.isPostProcessed(post.id);
        if (!isProcessed) {
          unprocessedPosts.push(post);
        }
      } catch (error) {
        console.error(`Erreur vérification post ${post.id}:`, error.message);
        // En cas d'erreur, on considère le post comme non traité
        unprocessedPosts.push(post);
      }
    }

    return unprocessedPosts;
  }

  /**
   * Nettoyer les anciens posts (optionnel)
   */
  async cleanOldPosts(daysOld = 30) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM processed_posts WHERE processed_at < datetime("now", "-' + daysOld + ' days")';
      
      this.db.run(query, function(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`🧹 ${this.changes} anciens posts nettoyés (>${daysOld} jours)`);
          resolve(this.changes);
        }
      });
    });
  }

  /**
   * Fermer la connexion SQLite
   */
  close() {
    this.db.close((err) => {
      if (err) {
        console.error('❌ Erreur fermeture DB:', err.message);
      } else {
        console.log('✅ Connexion SQLite fermée');
      }
    });
  }
}

module.exports = RedditTracker;