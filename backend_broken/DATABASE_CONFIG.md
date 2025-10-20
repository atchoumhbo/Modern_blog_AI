# Configuration Base de Données - Blog Strapi

## Configuration Actuelle : SQLite (Développement)

**Pourquoi SQLite temporairement ?**

Bien que vous ayez configuré PostgreSQL durant l'installation Strapi, nous utilisons temporairement SQLite pour les raisons suivantes :

### ✅ Avantages SQLite pour le développement :
- **Installation immédiate** : Pas de configuration serveur requise
- **Portabilité** : Base de données dans un fichier
- **Simplicité** : Parfait pour prototyper les Content Types
- **Performance locale** : Idéal pour le développement

### 🎯 Migration PostgreSQL Prévue :

```bash
# Configuration PostgreSQL (production)
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapidb
DATABASE_PASSWORD=Dtiti..1982
DATABASE_SSL=false
```

### 📋 Étapes pour Migration PostgreSQL :

1. **Configurer PostgreSQL** avec les bonnes permissions
2. **Créer la base de données** `strapi` 
3. **Créer l'utilisateur** `strapidb`
4. **Migrer les données** avec `strapi export/import`
5. **Changer la configuration** dans `.env`

### 🚀 Workflow de Développement :

1. **Phase 1** : Développement avec SQLite ✅
   - Créer les Content Types (Posts, Projects, Authors)
   - Développer l'API Strapi
   - Connecter le frontend React Router

2. **Phase 2** : Migration PostgreSQL 
   - Configuration production
   - Migration des données
   - Tests de performance

Cette approche nous permet de commencer immédiatement le développement des fonctionnalités métier sans perdre de temps sur la configuration serveur.

---
**Note** : Strapi supporte parfaitement la migration entre bases de données via son système d'export/import.