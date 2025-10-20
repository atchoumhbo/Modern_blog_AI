/**
 * Lifecycle hooks pour les articles
 * Automatise le calcul du temps de lecture et autres tâches
 */

export default {
  
  // Avant la création d'un article
  beforeCreate(event: any) {
    const { data } = event.params;
    
    // Calculer le temps de lecture automatiquement
    if (data.content && !data.readingTime) {
      const wordsPerMinute = 200;
      const words = data.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
      data.readingTime = Math.ceil(words / wordsPerMinute);
    }
    
    // Générer l'excerpt automatiquement
    if (data.content && !data.excerpt) {
      const plainText = data.content.replace(/<[^>]*>/g, '').trim();
      const maxLength = 160;
      data.excerpt = plainText.length <= maxLength 
        ? plainText 
        : plainText.substring(0, maxLength - 3).trim() + '...';
    }
    
    // Initialiser les données de schema structuré
    if (!data.schema) {
      data.schema = {
        type: 'Article',
        datePublished: new Date(),
        dateModified: new Date(),
        wordCount: data.content ? data.content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0
      };
    }
    
    // Initialiser le compteur de vues
    if (!data.viewCount) {
      data.viewCount = 0;
    }
  },
  
  // Avant la mise à jour d'un article
  beforeUpdate(event: any) {
    const { data } = event.params;
    
    // Recalculer le temps de lecture si le contenu a changé
    if (data.content) {
      const wordsPerMinute = 200;
      const words = data.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
      data.readingTime = Math.ceil(words / wordsPerMinute);
      
      // Mettre à jour les données structurées
      if (!data.schema) {
        data.schema = {};
      }
      data.schema.dateModified = new Date();
      data.schema.wordCount = words;
    }
  },
  
  // Après la création d'un article
  afterCreate(event: any) {
    const { result } = event;
    console.log(`📝 Nouvel article créé: "${result.title}" avec ${result.readingTime} min de lecture`);
  },
  
  // Après la mise à jour d'un article
  afterUpdate(event: any) {
    const { result } = event;
    console.log(`✏️ Article mis à jour: "${result.title}"`);
  }
  
};