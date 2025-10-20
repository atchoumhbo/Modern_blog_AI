import { useEffect } from 'react';
import { InputSanitizer, SecurityMonitor, ClientRateLimit } from '~/lib/security';

// Hook pour la sécurité globale
export function useSecurity() {
  useEffect(() => {
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

    addSecurityMeta();

    // Écouter les événements suspects
    const handleSuspiciousActivity = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target && target.tagName === 'SCRIPT') {
        SecurityMonitor.logSecurityEvent({
          type: 'xss_attempt',
          timestamp: new Date(),
          userAgent: navigator.userAgent,
        });
      }
    };

    document.addEventListener('DOMNodeInserted', handleSuspiciousActivity);

    return () => {
      document.removeEventListener('DOMNodeInserted', handleSuspiciousActivity);
    };
  }, []);
}

// Hook pour valider et nettoyer les formulaires
export function useSecureForm() {
  const validateAndSanitize = (data: Record<string, any>) => {
    const sanitized: Record<string, any> = {};
    const errors: Record<string, string> = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Détecter les tentatives malveillantes
        if (SecurityMonitor.detectMaliciousInput(value)) {
          SecurityMonitor.logSecurityEvent({
            type: 'xss_attempt',
            timestamp: new Date(),
            input: value,
            userAgent: navigator.userAgent,
          });
          errors[key] = 'Contenu non autorisé détecté';
          continue;
        }

        // Nettoyer selon le type de champ
        switch (key) {
          case 'email':
            if (!InputSanitizer.validateEmail(value)) {
              errors[key] = 'Email invalide';
            } else {
              sanitized[key] = InputSanitizer.sanitizeString(value.toLowerCase());
            }
            break;
          case 'url':
          case 'website':
            if (value && !InputSanitizer.validateUrl(value)) {
              errors[key] = 'URL invalide';
            } else {
              sanitized[key] = value;
            }
            break;
          case 'content':
          case 'message':
          case 'comment':
            sanitized[key] = InputSanitizer.sanitizeHtml(value);
            break;
          default:
            sanitized[key] = InputSanitizer.sanitizeString(value);
        }
      } else {
        sanitized[key] = value;
      }
    }

    return { sanitized, errors, isValid: Object.keys(errors).length === 0 };
  };

  const checkRateLimit = (action: string, maxRequests = 5) => {
    const key = `${action}_${navigator.userAgent.slice(0, 50)}`;
    return ClientRateLimit.canMakeRequest(key, maxRequests);
  };

  return { validateAndSanitize, checkRateLimit };
}

// Hook pour la protection CSRF
export function useCSRFProtection() {
  const generateToken = (): string => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  const validateToken = (token: string, storedToken: string): boolean => {
    return token === storedToken;
  };

  useEffect(() => {
    // Générer et stocker un token CSRF
    const token = generateToken();
    sessionStorage.setItem('csrf_token', token);
    
    // Ajouter le token aux formulaires
    const addCSRFTokenToForms = () => {
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        let csrfInput = form.querySelector('input[name="csrf_token"]') as HTMLInputElement;
        if (!csrfInput) {
          csrfInput = document.createElement('input');
          csrfInput.type = 'hidden';
          csrfInput.name = 'csrf_token';
          form.appendChild(csrfInput);
        }
        csrfInput.value = token;
      });
    };

    // Observer pour les nouveaux formulaires
    const observer = new MutationObserver(addCSRFTokenToForms);
    observer.observe(document.body, { childList: true, subtree: true });

    addCSRFTokenToForms();

    return () => observer.disconnect();
  }, []);

  return { generateToken, validateToken };
}

// Hook pour la sécurité des images
export function useImageSecurity() {
  const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      // Vérifier le type MIME
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        resolve(false);
        return;
      }

      // Vérifier la taille
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        resolve(false);
        return;
      }

      // Vérifier les métadonnées
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as ArrayBuffer;
        const view = new Uint8Array(result);
        
        // Vérifier les magic numbers (signatures de fichier)
        const signatures = {
          'image/jpeg': [0xFF, 0xD8, 0xFF],
          'image/png': [0x89, 0x50, 0x4E, 0x47],
          'image/gif': [0x47, 0x49, 0x46],
          'image/webp': [0x52, 0x49, 0x46, 0x46] // RIFF
        };

        const signature = signatures[file.type as keyof typeof signatures];
        if (signature) {
          const matches = signature.every((byte, index) => view[index] === byte);
          resolve(matches);
        } else {
          resolve(false);
        }
      };
      
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file.slice(0, 8));
    });
  };

  const sanitizeImageUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      // Autoriser seulement certains domaines
      const allowedDomains = [
        'localhost',
        '127.0.0.1',
        // Ajoutez vos domaines autorisés ici
      ];
      
      if (!allowedDomains.some(domain => urlObj.hostname.includes(domain))) {
        return '';
      }
      
      return url;
    } catch {
      return '';
    }
  };

  return { validateImage, sanitizeImageUrl };
}