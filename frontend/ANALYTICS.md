# 📊 Google Analytics 4 - Configuration et Utilisation

## 🚀 Configuration GA4

### 1. Créer un compte Google Analytics 4

1. Allez sur [analytics.google.com](https://analytics.google.com)
2. Créez un nouveau compte ou utilisez un existant
3. Créez une propriété GA4 (pas Universal Analytics)
4. Notez votre **Measurement ID** (format: G-XXXXXXXXXX)

### 2. Configuration des variables d'environnement

Modifiez le fichier `.env` :

```bash
# Google Analytics - REMPLACEZ par votre vrai ID GA4
VITE_GA_MEASUREMENT_ID=G-VOTRE_VRAI_ID

# Site Configuration
VITE_SITE_URL=https://votre-domaine.com
VITE_SITE_NAME="Votre Site"
```

### 3. Configuration GA4 recommandée

Dans votre propriété GA4, configurez :

#### Événements personnalisés :
- `view_article` : Vue d'un article
- `share_article` : Partage d'un article  
- `reading_progress` : Progression de lecture (25%, 50%, 75%, 100%)
- `reading_time` : Temps passé sur un article
- `scroll_depth` : Profondeur de scroll
- `user_interaction` : Interactions utilisateur
- `external_link_click` : Clics sur liens externes

#### Dimensions personnalisées :
- `user_language` : Langue de l'utilisateur
- `content_type` : Type de contenu (blog, projects, etc.)
- `article_category` : Catégorie d'article

#### Audiences recommandées :
- Lecteurs engagés (>50% scroll + >30s sur site)
- Lecteurs d'articles longs (articles >1000 mots)
- Utilisateurs récurrents
- Utilisateurs par langue

## 📈 Métriques Trackées

### Automatiques
- ✅ **Pages vues** avec langue et type de contenu
- ✅ **Core Web Vitals** (LCP, FID, CLS)
- ✅ **Scroll depth** (25%, 50%, 75%, 90%)
- ✅ **Clics liens externes**
- ✅ **Erreurs JavaScript**

### Articles de blog
- ✅ **Vue d'article** avec métadonnées complètes
- ✅ **Progression de lecture** (25%, 50%, 75%, 100%)
- ✅ **Temps de lecture** (toutes les 30 secondes)
- ✅ **Partage social** par plateforme
- ✅ **Copie de lien**

### Interactions utilisateur
- ✅ **Navigation** entre pages
- ✅ **Changements de langue**
- ✅ **Clics sur boutons**

## 🎯 Tableaux de Bord Recommandés

### 1. Performance du Contenu
- Articles les plus lus
- Temps de lecture moyen par article
- Taux de completion de lecture
- Articles les plus partagés

### 2. Engagement Utilisateur
- Profondeur de scroll moyenne
- Sessions par utilisateur
- Durée moyenne des sessions
- Pages par session

### 3. Performance Technique
- Core Web Vitals par page
- Temps de chargement
- Erreurs JavaScript
- Performance mobile vs desktop

### 4. Acquisition
- Sources de trafic
- Référents principaux
- Performance par canal
- Conversion objectifs

## 🔧 Utilisation dans le Code

### Hook principal
```tsx
import { useAnalytics } from '~/hooks/useAnalytics';

function App() {
  useAnalytics({
    enableWebVitals: true,
    enableScrollTracking: true,
    enableClickTracking: true
  });
}
```

### Hook pour articles
```tsx
import { useArticleAnalytics } from '~/hooks/useAnalytics';

function Article({ post }) {
  useArticleAnalytics({
    id: post.id,
    title: post.title,
    category: post.category,
    author: post.author,
    readingTime: post.readingTime
  });
}
```

### Événements manuels
```tsx
import { trackEvent, trackUserInteraction } from '~/lib/analytics';

// Événement personnalisé
trackEvent({
  action: 'newsletter_signup',
  category: 'conversion',
  label: 'header_form'
});

// Interaction utilisateur
trackUserInteraction('button', 'click', '/contact');
```

## 🚫 Respect de la Vie Privée

### Configuration respectueuse RGPD
- ✅ IP anonymisées
- ✅ Pas de publicité personnalisée
- ✅ Pas de signaux Google
- ✅ Données minimales collectées

### Bannière de cookies (optionnel)
Si vous voulez être 100% conforme, ajoutez une bannière de cookies pour demander le consentement avant d'initialiser GA4.

## 🏆 Objectifs et Conversions

Configurez ces objectifs dans GA4 :

1. **Engagement Article** : Lecture >75% + >2min
2. **Lecteur Fidèle** : >3 pages vues dans une session
3. **Partage Social** : Partage d'un article
4. **Navigation Profonde** : Visite de 3+ types de contenu

## 📊 Métriques Clés à Surveiller

### Quotidien
- Utilisateurs actifs
- Pages vues
- Durée moyenne des sessions
- Core Web Vitals

### Hebdomadaire  
- Articles les plus performants
- Sources de trafic
- Progression de lecture moyenne
- Performance mobile

### Mensuel
- Croissance audience
- Rétention utilisateurs
- Performance SEO
- Objectifs de conversion

---

**🎯 Votre tracking GA4 est maintenant configuré avec des métriques avancées pour optimiser votre blog !**