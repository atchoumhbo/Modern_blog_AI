import { useEffect } from 'react';
import { monitoring } from '~/lib/monitoring';

// Hook pour initialiser le monitoring
export function useMonitoring() {
  useEffect(() => {
    // Le monitoring est déjà initialisé automatiquement
    console.log('🔍 Monitoring system initialized');
  }, []);

  return {
    reportError: (error: Error, context?: Record<string, any>) => {
      monitoring.reportError({
        message: error.message,
        stack: error.stack,
        error,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date(),
        sessionId: (monitoring as any).sessionId,
        userId: (monitoring as any).userId,
        ...context,
      });
    },
    reportCustomEvent: monitoring.reportCustomEvent.bind(monitoring),
    setUserId: monitoring.setUserId.bind(monitoring),
  };
}

// Hook pour surveiller les erreurs de composants React
export function useErrorBoundary() {
  const { reportError } = useMonitoring();

  return {
    onError: (error: Error, errorInfo: { componentStack: string }) => {
      reportError(error, {
        type: 'react_error',
        componentStack: errorInfo.componentStack,
      });
    },
  };
}

// Hook pour surveiller les performances d'un composant
export function useComponentPerformance(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      monitoring.reportCustomEvent('component_render_time', {
        component: componentName,
        duration: renderTime,
        rating: renderTime <= 16 ? 'good' : renderTime <= 50 ? 'needs-improvement' : 'poor',
      });
    };
  }, [componentName]);
}

// Hook pour surveiller les interactions utilisateur
export function useUserInteractionTracking() {
  useEffect(() => {
    const trackClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target) {
        monitoring.reportCustomEvent('user_click', {
          element: target.tagName.toLowerCase(),
          className: target.className,
          text: target.textContent?.substring(0, 50),
          timestamp: new Date().toISOString(),
        });
      }
    };

    const trackKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        const target = event.target as HTMLElement;
        if (target) {
          monitoring.reportCustomEvent('user_keypress', {
            key: event.key,
            element: target.tagName.toLowerCase(),
            timestamp: new Date().toISOString(),
          });
        }
      }
    };

    document.addEventListener('click', trackClick);
    document.addEventListener('keypress', trackKeyPress);

    return () => {
      document.removeEventListener('click', trackClick);
      document.removeEventListener('keypress', trackKeyPress);
    };
  }, []);
}

// Hook pour surveiller la visibilité de la page
export function usePageVisibility() {
  useEffect(() => {
    let startTime = Date.now();
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page devient invisible
        const timeSpent = Date.now() - startTime;
        monitoring.reportCustomEvent('page_visibility', {
          action: 'hidden',
          timeSpent,
          url: window.location.href,
        });
      } else {
        // Page devient visible
        startTime = Date.now();
        monitoring.reportCustomEvent('page_visibility', {
          action: 'visible',
          url: window.location.href,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}