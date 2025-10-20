// Configuration de sécurité pour l'application
export interface SecurityConfig {
  csp: {
    enabled: boolean;
    reportOnly: boolean;
    directives: Record<string, string[]>;
  };
  headers: {
    hsts: boolean;
    nosniff: boolean;
    frameOptions: string;
    xssProtection: boolean;
    referrerPolicy: string;
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
  };
}

// Configuration par défaut
export const defaultSecurityConfig: SecurityConfig = {
  csp: {
    enabled: true,
    reportOnly: false,
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Nécessaire pour React et Vite en dev
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Nécessaire pour Tailwind CSS
        'https://fonts.googleapis.com',
      ],
      'img-src': [
        "'self'",
        'data:',
        'https:',
        'http://localhost:1337', // Strapi backend (développement local)
        'http://localhost:1339', // Strapi backend (Docker)
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'https://r2cdn.perplexity.ai', // Perplexity fonts
      ],
      'connect-src': [
        "'self'",
        'http://localhost:1337', // Strapi API (développement local)
        'http://localhost:1339', // Strapi API (Docker)
        'https://www.google-analytics.com',
        'https://analytics.google.com',
      ],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
    },
  },
  headers: {
    hsts: true,
    nosniff: true,
    frameOptions: 'DENY',
    xssProtection: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
  },
  rateLimit: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // limite par IP
  },
};

// Génération des headers de sécurité
export function generateSecurityHeaders(config: SecurityConfig = defaultSecurityConfig): Record<string, string> {
  const headers: Record<string, string> = {};

  // Content Security Policy
  if (config.csp.enabled) {
    const cspDirectives = Object.entries(config.csp.directives)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
    
    const headerName = config.csp.reportOnly 
      ? 'Content-Security-Policy-Report-Only' 
      : 'Content-Security-Policy';
    
    headers[headerName] = cspDirectives;
  }

  // HSTS (HTTP Strict Transport Security)
  if (config.headers.hsts) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  // X-Content-Type-Options
  if (config.headers.nosniff) {
    headers['X-Content-Type-Options'] = 'nosniff';
  }

  // X-Frame-Options
  if (config.headers.frameOptions) {
    headers['X-Frame-Options'] = config.headers.frameOptions;
  }

  // X-XSS-Protection
  if (config.headers.xssProtection) {
    headers['X-XSS-Protection'] = '1; mode=block';
  }

  // Referrer-Policy
  if (config.headers.referrerPolicy) {
    headers['Referrer-Policy'] = config.headers.referrerPolicy;
  }

  // Permissions Policy (anciennement Feature Policy)
  headers['Permissions-Policy'] = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()', // Disable FLoC
  ].join(', ');

  return headers;
}

// Validation et nettoyage des entrées utilisateur
export class InputSanitizer {
  // Nettoyer les chaînes de caractères
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>\"']/g, '') // Supprimer les caractères dangereux
      .substring(0, 1000); // Limiter la longueur
  }

  // Valider un email
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // Valider une URL
  static validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  // Nettoyer le contenu HTML (pour les commentaires par exemple)
  static sanitizeHtml(html: string): string {
    // Liste des balises autorisées
    const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'];
    
    // Supprimer toutes les balises sauf celles autorisées
    let cleaned = html.replace(/<(?!\/?(?:p|br|strong|em|u|a|ul|ol|li)\b)[^>]*>/gi, '');
    
    // Nettoyer les attributs dangereux
    cleaned = cleaned.replace(/on\w+="[^"]*"/gi, ''); // Supprimer les event handlers
    cleaned = cleaned.replace(/javascript:/gi, ''); // Supprimer javascript:
    
    return cleaned.substring(0, 5000); // Limiter la longueur
  }
}

// Détection d'attaques communes
export class SecurityMonitor {
  private static suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /exec\s*\(/i,
  ];

  // Détecter des tentatives d'injection
  static detectMaliciousInput(input: string): boolean {
    return this.suspiciousPatterns.some(pattern => pattern.test(input));
  }

  // Logger les tentatives d'attaque
  static logSecurityEvent(event: {
    type: 'xss_attempt' | 'sql_injection' | 'csrf_attempt' | 'rate_limit_exceeded';
    ip?: string;
    userAgent?: string;
    input?: string;
    timestamp: Date;
  }): void {
    // En production, envoyez cela à votre service de monitoring
    console.warn('🚨 Security Event Detected:', {
      ...event,
      input: event.input ? event.input.substring(0, 100) + '...' : undefined,
    });

    // En production, vous pourriez envoyer à un service comme Sentry
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'security_event', {
        event_category: 'security',
        event_label: event.type,
        custom_parameters: {
          user_agent: event.userAgent,
          timestamp: event.timestamp.toISOString(),
        },
      });
    }
  }
}

// Rate limiting côté client (basique)
export class ClientRateLimit {
  private static requests = new Map<string, number[]>();

  static canMakeRequest(key: string, maxRequests = 10, windowMs = 60000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Nettoyer les anciennes requêtes
    const currentRequests = (this.requests.get(key) || [])
      .filter(timestamp => timestamp > windowStart);
    
    // Vérifier la limite
    if (currentRequests.length >= maxRequests) {
      SecurityMonitor.logSecurityEvent({
        type: 'rate_limit_exceeded',
        timestamp: new Date(),
      });
      return false;
    }
    
    // Ajouter la nouvelle requête
    currentRequests.push(now);
    this.requests.set(key, currentRequests);
    
    return true;
  }
}

// Hook React pour la sécurité
export function useSecurityHeaders() {
  if (typeof document !== 'undefined') {
    // Ajouter des meta tags de sécurité
    const addSecurityMeta = () => {
      // X-Content-Type-Options
      let meta = document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('http-equiv', 'X-Content-Type-Options');
        meta.setAttribute('content', 'nosniff');
        document.head.appendChild(meta);
      }

      // Referrer Policy
      meta = document.querySelector('meta[name="referrer"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'referrer');
        meta.setAttribute('content', 'strict-origin-when-cross-origin');
        document.head.appendChild(meta);
      }
    };

    // Exécuter au chargement
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', addSecurityMeta);
    } else {
      addSecurityMeta();
    }
  }
}