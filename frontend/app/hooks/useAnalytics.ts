import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { useI18n } from '~/i18n';
import { 
  initGA, 
  trackPageView, 
  trackWebVitals,
  GA_MEASUREMENT_ID 
} from '~/lib/analytics';

// Types
interface UseAnalyticsOptions {
  enableWebVitals?: boolean;
  enableScrollTracking?: boolean;
  enableClickTracking?: boolean;
}

// Hook principal pour Analytics
export const useAnalytics = (options: UseAnalyticsOptions = {}) => {
  const location = useLocation();
  const { language } = useI18n();
  
  const {
    enableWebVitals = true,
    enableScrollTracking = true,
    enableClickTracking = true
  } = options;

  // Initialiser GA4 au premier chargement
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) {
      console.warn('⚠️ GA_MEASUREMENT_ID not configured');
      return;
    }
    
    initGA();
    
    if (enableWebVitals) {
      trackWebVitals();
    }
  }, [enableWebVitals]);

  // Tracker les changements de page
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    const pageTitle = document.title;
    const pagePath = location.pathname + location.search;
    const pageLocation = window.location.href;
    
    // Déterminer le type de contenu
    let contentType = 'other';
    if (pagePath.startsWith('/blog')) contentType = 'blog';
    else if (pagePath.startsWith('/projects')) contentType = 'projects';
    else if (pagePath === '/') contentType = 'home';
    else if (pagePath.startsWith('/about')) contentType = 'about';
    else if (pagePath.startsWith('/contact')) contentType = 'contact';

    trackPageView({
      page_title: pageTitle,
      page_location: pageLocation,
      page_path: pagePath,
      language,
      content_group1: contentType
    });

    // Scroll vers le haut à chaque changement de page
    window.scrollTo(0, 0);
  }, [location, language]);

  // Tracking du scroll (pour mesurer l'engagement)
  useEffect(() => {
    if (!enableScrollTracking || !GA_MEASUREMENT_ID) return;

    let scrollTimer: NodeJS.Timeout;
    let maxScroll = 0;
    let scrollMilestones: number[] = [];

    const handleScroll = () => {
      clearTimeout(scrollTimer);
      
      scrollTimer = setTimeout(() => {
        const scrollPercent = Math.round(
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );
        
        maxScroll = Math.max(maxScroll, scrollPercent);
        
        // Tracker les jalons de scroll (25%, 50%, 75%, 90%)
        const milestones = [25, 50, 75, 90];
        milestones.forEach(milestone => {
          if (scrollPercent >= milestone && !scrollMilestones.includes(milestone)) {
            scrollMilestones.push(milestone);
            
            // Import dynamique pour éviter les problèmes SSR
            import('~/lib/analytics').then(({ trackEvent }) => {
              trackEvent({
                action: 'scroll_depth',
                category: 'engagement',
                label: `${milestone}%`,
                value: milestone,
                custom_parameters: {
                  page_path: location.pathname,
                  scroll_percentage: milestone
                }
              });
            });
          }
        });
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimer);
    };
  }, [location.pathname, enableScrollTracking]);

  // Tracking des clics sur les liens externes
  useEffect(() => {
    if (!enableClickTracking || !GA_MEASUREMENT_ID) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (!link) return;

      const href = link.href;
      const isExternal = href && (
        href.startsWith('http') && 
        !href.includes(window.location.hostname)
      );

      if (isExternal) {
        import('~/lib/analytics').then(({ trackEvent }) => {
          trackEvent({
            action: 'external_link_click',
            category: 'navigation',
            label: href,
            custom_parameters: {
              link_url: href,
              link_text: link.textContent?.trim() || '',
              page_path: location.pathname
            }
          });
        });
      }
    };

    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [location.pathname, enableClickTracking]);
};

// Hook spécialisé pour les articles de blog
export const useArticleAnalytics = (article: {
  id: string;
  title: string;
  category?: string;
  author?: string;
  readingTime?: number;
}) => {
  const location = useLocation();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !article.id) return;

    // Tracker la vue d'article
    import('~/lib/analytics').then(({ trackArticleView }) => {
      trackArticleView({
        article_id: article.id,
        article_title: article.title,
        article_category: article.category,
        article_author: article.author,
        reading_time: article.readingTime
      });
    });

    // Tracking de la progression de lecture
    let readingTimer: NodeJS.Timeout;
    let readingStartTime = Date.now();
    let progressMilestones: number[] = [];

    const trackReadingTime = () => {
      const timeSpent = Math.round((Date.now() - readingStartTime) / 1000);
      
      // Tracker le temps passé toutes les 30 secondes
      if (timeSpent > 0 && timeSpent % 30 === 0) {
        import('~/lib/analytics').then(({ trackEvent }) => {
          trackEvent({
            action: 'reading_time',
            category: 'content',
            label: article.title,
            value: timeSpent,
            custom_parameters: {
              article_id: article.id,
              time_spent_seconds: timeSpent,
              article_title: article.title
            }
          });
        });
      }
    };

    const handleScroll = () => {
      clearTimeout(readingTimer);
      
      readingTimer = setTimeout(() => {
        const scrollPercent = Math.round(
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );
        
        // Tracker la progression de lecture
        const milestones = [25, 50, 75, 100];
        milestones.forEach(milestone => {
          if (scrollPercent >= milestone && !progressMilestones.includes(milestone)) {
            progressMilestones.push(milestone);
            
            import('~/lib/analytics').then(({ trackReadingProgress }) => {
              trackReadingProgress(article, milestone);
            });
          }
        });

        trackReadingTime();
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(readingTimer);
    };
  }, [article]);
};

export default useAnalytics;