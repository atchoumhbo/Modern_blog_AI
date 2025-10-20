import type { Plugin } from 'vite';
import { generateSecurityHeaders, defaultSecurityConfig } from '../app/lib/security';

interface SecurityOptions {
  enabled?: boolean;
  development?: boolean;
  headers?: Record<string, string>;
}

export function securityPlugin(options: SecurityOptions = {}): Plugin {
  const { enabled = true, development = true } = options;
  
  return {
    name: 'security-headers',
    configureServer(server) {
      if (!enabled || (!development && process.env.NODE_ENV === 'development')) {
        return;
      }

      server.middlewares.use((req, res, next) => {
        // Générer les headers de sécurité
        const securityHeaders = generateSecurityHeaders(defaultSecurityConfig);
        
        // Configuration spécifique pour le développement
        if (process.env.NODE_ENV === 'development') {
          // Relaxer CSP pour le développement
          securityHeaders['Content-Security-Policy'] = securityHeaders['Content-Security-Policy']
            ?.replace("'unsafe-inline'", "'unsafe-inline' 'unsafe-eval'")
            .replace('ws://localhost:*', 'ws://localhost:* ws://127.0.0.1:*');
        }

        // Appliquer les headers
        Object.entries(securityHeaders).forEach(([name, value]) => {
          res.setHeader(name, value);
        });

        // Headers additionnels personnalisés
        if (options.headers) {
          Object.entries(options.headers).forEach(([name, value]) => {
            res.setHeader(name, value);
          });
        }

        // Headers de développement
        if (process.env.NODE_ENV === 'development') {
          res.setHeader('X-Development-Mode', 'true');
        }

        next();
      });
    },
  };
}

// Plugin pour la validation des assets
export function assetSecurityPlugin(): Plugin {
  return {
    name: 'asset-security',
    generateBundle(options, bundle) {
      // Vérifier les assets pour des vulnérabilités potentielles
      Object.keys(bundle).forEach(fileName => {
        const chunk = bundle[fileName];
        
        if (chunk.type === 'chunk' && chunk.code) {
          // Vérifier les patterns dangereux dans le code
          const dangerousPatterns = [
            /eval\(/g,
            /Function\(/g,
            /document\.write/g,
            /innerHTML\s*=/g,
          ];

          dangerousPatterns.forEach(pattern => {
            if (pattern.test(chunk.code)) {
              console.warn(`⚠️  Pattern potentiellement dangereux détecté dans ${fileName}`);
            }
          });
        }
      });
    },
  };
}

// Configuration de sécurité pour la production
export const productionSecurityConfig = {
  enabled: true,
  development: false,
  headers: {
    'X-Powered-By': '', // Masquer le serveur
    'Server': '', // Masquer les infos serveur
    'X-Request-ID': () => Math.random().toString(36).substring(7),
  },
};