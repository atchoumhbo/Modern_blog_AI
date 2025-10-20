/**
 * Lifecycle hooks pour les projets
 */

export default {
  
  // Avant la création d'un projet
  beforeCreate(event: any) {
    const { data } = event.params;
    
    // Générer l'excerpt automatiquement si absent
    if (data.description && !data.excerpt) {
      const plainText = data.description.replace(/<[^>]*>/g, '').trim();
      const maxLength = 200;
      data.excerpt = plainText.length <= maxLength 
        ? plainText 
        : plainText.substring(0, maxLength - 3).trim() + '...';
    }
    
    // Initialiser les données de schema structuré pour les projets
    if (!data.schema) {
      data.schema = {
        type: 'Article', // Peut être adapté selon le contexte
        datePublished: data.start_date || new Date(),
        dateModified: new Date(),
        headline: data.title
      };
    }
    
    // Initialiser le compteur de vues
    if (!data.viewCount) {
      data.viewCount = 0;
    }

    // Valider les dates
    if (data.start_date && data.end_date && new Date(data.start_date) > new Date(data.end_date)) {
      throw new Error('La date de fin ne peut pas être antérieure à la date de début');
    }
  },
  
  // Avant la mise à jour d'un projet
  beforeUpdate(event: any) {
    const { data } = event.params;
    
    // Mettre à jour les données structurées
    if (data.schema) {
      data.schema.dateModified = new Date();
      if (data.title) {
        data.schema.headline = data.title;
      }
    }

    // Valider les dates
    if (data.start_date && data.end_date && new Date(data.start_date) > new Date(data.end_date)) {
      throw new Error('La date de fin ne peut pas être antérieure à la date de début');
    }
  },
  
  // Après la création d'un projet
  afterCreate(event: any) {
    const { result } = event;
    console.log(`🚀 Nouveau projet créé: "${result.title}" (${result.project_type})`);
  },
  
  // Après la mise à jour d'un projet
  afterUpdate(event: any) {
    const { result } = event;
    console.log(`✏️ Projet mis à jour: "${result.title}" - Status: ${result.status}`);
  }
  
};