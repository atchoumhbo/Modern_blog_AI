// Déclaration des types globaux pour gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Configuration GA4
export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Types pour TypeScript
interface GAEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

interface PageViewEvent {
  page_title: string;
  page_location: string;
  page_path: string;
  language?: string;
  content_group1?: string; // Pour catégoriser (blog, projects, etc.)
}

interface ArticleEvent {
  article_id: string;
  article_title: string;
  article_category?: string;
  article_author?: string;
  reading_time?: number;
}

// Initialiser GA4
export const initGA = (): void => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;
  
  // Charger le script GA4
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Configuration gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    // Configuration avancée
    page_title: document.title,
    page_location: window.location.href,
    custom_map: {
      dimension1: 'user_language',
      dimension2: 'content_type',
      dimension3: 'article_category'
    },
    // Respect de la vie privée
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });

  console.log('📊 Google Analytics 4 initialized:', GA_MEASUREMENT_ID);
};

// Suivre une page vue
export const trackPageView = (data: PageViewEvent): void => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;
  
  window.gtag?.('config', GA_MEASUREMENT_ID, {
    page_title: data.page_title,
    page_location: data.page_location,
    page_path: data.page_path,
    custom_map: {
      dimension1: data.language,
      dimension2: data.content_group1
    }
  });

  console.log('📄 Page view tracked:', data.page_path);
};

// Suivre un événement personnalisé
export const trackEvent = (event: GAEvent): void => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;
  
  window.gtag?.('event', event.action, {
    event_category: event.category,
    event_label: event.label,
    value: event.value,
    ...event.custom_parameters
  });

  console.log('🎯 Event tracked:', event.action, event.category);
};

// Événements spécifiques au blog
export const trackArticleView = (article: ArticleEvent): void => {
  trackEvent({
    action: 'view_article',
    category: 'content',
    label: article.article_title,
    custom_parameters: {
      article_id: article.article_id,
      article_title: article.article_title,
      article_category: article.article_category,
      article_author: article.article_author,
      reading_time: article.reading_time
    }
  });
};

export const trackArticleShare = (article: ArticleEvent, platform: string): void => {
  trackEvent({
    action: 'share_article',
    category: 'social',
    label: `${platform}_${article.article_title}`,
    custom_parameters: {
      article_id: article.article_id,
      platform: platform,
      article_title: article.article_title
    }
  });
};

export const trackReadingProgress = (article: ArticleEvent, progress: number): void => {
  // Ne tracker que certains pourcentages (25%, 50%, 75%, 100%)
  const milestones = [25, 50, 75, 100];
  if (!milestones.includes(progress)) return;

  trackEvent({
    action: 'reading_progress',
    category: 'content',
    label: `${progress}%_${article.article_title}`,
    value: progress,
    custom_parameters: {
      article_id: article.article_id,
      progress_percentage: progress,
      article_title: article.article_title
    }
  });
};

// Suivre les interactions utilisateur
export const trackUserInteraction = (element: string, action: string, location?: string): void => {
  trackEvent({
    action: 'user_interaction',
    category: 'engagement',
    label: `${element}_${action}`,
    custom_parameters: {
      element_name: element,
      interaction_type: action,
      page_location: location || window.location.pathname
    }
  });
};

// Suivre les erreurs
export const trackError = (error: string, location: string): void => {
  trackEvent({
    action: 'error',
    category: 'technical',
    label: error,
    custom_parameters: {
      error_message: error,
      page_location: location,
      timestamp: new Date().toISOString()
    }
  });
};

// Suivre les performances (Core Web Vitals)
export const trackWebVitals = (): void => {
  if (typeof window === 'undefined') return;

  // CLS (Cumulative Layout Shift)
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
        trackEvent({
          action: 'web_vitals',
          category: 'performance',
          label: 'CLS',
          value: Math.round((entry as any).value * 1000),
          custom_parameters: {
            metric_name: 'CLS',
            metric_value: (entry as any).value
          }
        });
      }
    }
  }).observe({ entryTypes: ['layout-shift'] });

  // FID (First Input Delay)
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      trackEvent({
        action: 'web_vitals',
        category: 'performance',
        label: 'FID',
        value: Math.round((entry as any).processingStart - entry.startTime),
        custom_parameters: {
          metric_name: 'FID',
          metric_value: (entry as any).processingStart - entry.startTime
        }
      });
    }
  }).observe({ entryTypes: ['first-input'] });

  // LCP (Largest Contentful Paint)
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    trackEvent({
      action: 'web_vitals',
      category: 'performance',
      label: 'LCP',
      value: Math.round(lastEntry.startTime),
      custom_parameters: {
        metric_name: 'LCP',
        metric_value: lastEntry.startTime
      }
    });
  }).observe({ entryTypes: ['largest-contentful-paint'] });
};

// Déclarations TypeScript pour window
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export default {
  initGA,
  trackPageView,
  trackEvent,
  trackArticleView,
  trackArticleShare,
  trackReadingProgress,
  trackUserInteraction,
  trackError,
  trackWebVitals
};