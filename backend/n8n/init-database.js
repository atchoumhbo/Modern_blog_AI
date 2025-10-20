/**
 * INITIALISATION BASE DE DONNÉES SQLITE
 * Crée les tables nécessaires pour le tracking Reddit
 */

const RedditTracker = require('./reddit-tracker');

async function initDatabase() {
  console.log('🗄️  INITIALISATION BASE DE DONNÉES SQLITE');
  console.log('==========================================');
  
  try {
    // Créer une instance du tracker (va créer la DB et les tables)
    const tracker = new RedditTracker();
    
    // Attendre que l'initialisation soit terminée
    await new Promise((resolve) => {
      setTimeout(resolve, 1000); // Laisser le temps à SQLite de créer la table
    });
    
    // Tester la connexion
    const stats = await tracker.getStats();
    console.log('✅ Base de données initialisée avec succès');
    console.log('📊 Statistiques initiales:', stats);
    
    // Fermer la connexion
    tracker.close();
    
    console.log('🎉 Initialisation terminée !');
    
  } catch (error) {
    console.error('❌ Erreur initialisation DB:', error.message);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };