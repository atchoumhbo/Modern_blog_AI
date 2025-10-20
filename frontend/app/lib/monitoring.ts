// Système de monitoring et surveillance des erreurs
export interface ErrorEvent {
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  error?: Error;
  stack?: string;
  userAgent: string;
  url: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: Date;
}

class MonitoringService {
  private sessionId: string;
  private userId?: string;
  private errorQueue: ErrorEvent[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private isOnline = true;
  private isInitialized = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    
    // Ne pas initialiser côté serveur
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      this.initializeErrorHandling();
      this.initializePerformanceMonitoring();
      this.initializeNetworkMonitoring();
      
      // Envoyer les données en lot toutes les 30 secondes
      setInterval(() => this.flushQueues(), 30000);
      
      // Envoyer les données avant la fermeture de la page
      window.addEventListener('beforeunload', () => this.flushQueues());
      
      this.isInitialized = true;
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }

  private initializeErrorHandling(): void {
    if (typeof window === 'undefined') return;
    
    // Erreurs JavaScript globales
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date(),
        sessionId: this.sessionId,
        userId: this.userId,
      });
    });

    // Promesses rejetées non gérées
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        stack: event.reason instanceof Error ? event.reason.stack : String(event.reason),
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date(),
        sessionId: this.sessionId,
        userId: this.userId,
      });
    });

    // Erreurs de ressources (images, scripts, etc.)
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement;
        this.reportError({
          message: `Resource loading error: ${target.tagName}`,
          filename: (target as any).src || (target as any).href,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date(),
          sessionId: this.sessionId,
          userId: this.userId,
        });
      }
    }, true);
  }

  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;
    
    // Core Web Vitals
    this.observeWebVitals();
    
    // Navigation Timing
    this.observeNavigationTiming();
    
    // Resource Timing
    this.observeResourceTiming();
    
    // Long Tasks
    this.observeLongTasks();
  }

  private observeWebVitals(): void {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const lcp = entry as PerformanceEventTiming;
        this.reportPerformance({
          name: 'lcp',
          value: lcp.startTime,
          rating: lcp.startTime <= 2500 ? 'good' : lcp.startTime <= 4000 ? 'needs-improvement' : 'poor',
          timestamp: new Date(),
        });
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = entry as PerformanceEventTiming;
        this.reportPerformance({
          name: 'fid',
          value: fid.processingStart - fid.startTime,
          rating: fid.processingStart - fid.startTime <= 100 ? 'good' : 
                  fid.processingStart - fid.startTime <= 300 ? 'needs-improvement' : 'poor',
          timestamp: new Date(),
        });
      }
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const cls = entry as any;
        if (!cls.hadRecentInput) {
          clsValue += cls.value;
        }
      }
      
      // Reporter CLS périodiquement
      setTimeout(() => {
        this.reportPerformance({
          name: 'cls',
          value: clsValue,
          rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor',
          timestamp: new Date(),
        });
      }, 5000);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  private observeNavigationTiming(): void {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        this.reportPerformance({
          name: 'ttfb',
          value: navigation.responseStart - navigation.requestStart,
          rating: navigation.responseStart - navigation.requestStart <= 200 ? 'good' : 
                  navigation.responseStart - navigation.requestStart <= 500 ? 'needs-improvement' : 'poor',
          timestamp: new Date(),
        });

        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        this.reportPerformance({
          name: 'load_time',
          value: loadTime,
          rating: loadTime <= 3000 ? 'good' : 
                  loadTime <= 5000 ? 'needs-improvement' : 'poor',
          timestamp: new Date(),
        });
      }, 0);
    });
  }

  private observeResourceTiming(): void {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resource = entry as PerformanceResourceTiming;
        
        // Surveiller les ressources lentes
        if (resource.duration > 1000) {
          this.reportPerformance({
            name: 'slow_resource',
            value: resource.duration,
            rating: 'poor',
            timestamp: new Date(),
          });
        }
      }
    }).observe({ entryTypes: ['resource'] });
  }

  private observeLongTasks(): void {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.reportPerformance({
          name: 'long_task',
          value: entry.duration,
          rating: 'poor',
          timestamp: new Date(),
        });
      }
    }).observe({ entryTypes: ['longtask'] });
  }

  private initializeNetworkMonitoring(): void {
    if (typeof window === 'undefined') return;
    
    // Surveiller la connectivité
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushQueues(); // Envoyer les données en attente
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  public reportError(error: ErrorEvent): void {
    if (typeof window === 'undefined') return;
    
    console.error('🚨 Error reported:', error);
    this.errorQueue.push(error);
    
    // Envoyer immédiatement les erreurs critiques
    if (this.isCriticalError(error)) {
      this.flushQueues();
    }
  }

  public reportPerformance(metric: PerformanceMetric): void {
    if (typeof window === 'undefined') return;
    
    console.log('📊 Performance metric:', metric);
    this.performanceQueue.push(metric);
    
    // Analytics integration
    if (window.gtag) {
      window.gtag('event', 'web_vitals', {
        event_category: 'performance',
        event_label: metric.name,
        value: Math.round(metric.value),
        custom_parameters: {
          rating: metric.rating,
        },
      });
    }
  }

  public reportCustomEvent(name: string, data: Record<string, any>): void {
    if (typeof window === 'undefined') return;
    
    console.log('📈 Custom event:', name, data);
    
    if (window.gtag) {
      window.gtag('event', name, {
        event_category: 'custom',
        custom_parameters: data,
      });
    }
  }

  private isCriticalError(error: ErrorEvent): boolean {
    const criticalPatterns = [
      /chunk.*failed/i,
      /network.*error/i,
      /failed.*fetch/i,
      /script.*error/i,
    ];
    
    return criticalPatterns.some(pattern => pattern.test(error.message));
  }

  private async flushQueues(): Promise<void> {
    if (!this.isOnline || (this.errorQueue.length === 0 && this.performanceQueue.length === 0)) {
      return;
    }

    const payload = {
      sessionId: this.sessionId,
      userId: this.userId,
      errors: [...this.errorQueue],
      performance: [...this.performanceQueue],
      timestamp: new Date().toISOString(),
    };

    try {
      // En production, envoyez à votre endpoint de monitoring
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/monitoring', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      // Vider les queues après envoi réussi
      this.errorQueue = [];
      this.performanceQueue = [];
      
    } catch (error) {
      console.error('Failed to send monitoring data:', error);
      // Ne pas vider les queues en cas d'échec
    }
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }
}

// Instance globale
export const monitoring = new MonitoringService();

// Hook React pour le monitoring
export function useMonitoring() {
  return {
    reportError: (error: Error, context?: Record<string, any>) => {
      monitoring.reportError({
        message: error.message,
        stack: error.stack,
        error,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date(),
        sessionId: monitoring['sessionId'],
        userId: monitoring['userId'],
        ...context,
      });
    },
    reportCustomEvent: monitoring.reportCustomEvent.bind(monitoring),
    setUserId: monitoring.setUserId.bind(monitoring),
  };
}