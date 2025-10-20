import type { ReactNode } from 'react';

// Types d'erreur Strapi
interface StrapiErrorResponse {
  status: number;
  data: {
    error?: {
      message?: string;
      details?: {
        errors?: Array<{ message: string }>;
      };
    };
  };
}

interface StrapiError extends Error {
  response: StrapiErrorResponse;
  config?: {
    url?: string;
    method?: string;
  };
}

interface StrapiErrorBoundaryProps {
  error: Error | StrapiError | null;
  children: ReactNode;
  fallback?: (error: Error | StrapiError) => ReactNode;
  retry?: () => void;
}

/**
 * Composant de gestion d'erreur spécialisé pour Strapi
 */
export function StrapiErrorBoundary({ 
  error, 
  children, 
  fallback,
  retry 
}: StrapiErrorBoundaryProps) {
  if (!error) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback(error)}</>;
  }

  return <StrapiErrorDisplay error={error} retry={retry} />;
}

/**
 * Composant d'affichage d'erreur Strapi
 */
export function StrapiErrorDisplay({ 
  error, 
  retry 
}: { 
  error: Error | StrapiError; 
  retry?: () => void;
}) {
  const isStrapiError = 'response' in error;
  
  if (isStrapiError) {
    const strapiError = error as StrapiError;
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Erreur du serveur ({strapiError.response.status})
            </h3>
            <div className="mt-2 text-sm text-red-700">
              {formatStrapiError(strapiError.response)}
            </div>
            {retry && (
              <div className="mt-4">
                <button
                  onClick={retry}
                  className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Erreur générique
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-800">
            Une erreur est survenue
          </h3>
          <div className="mt-2 text-sm text-gray-600">
            {error.message || 'Erreur inconnue'}
          </div>
          {retry && (
            <div className="mt-4">
              <button
                onClick={retry}
                className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-200 transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Formate l'erreur Strapi pour l'affichage
 */
function formatStrapiError(response: StrapiErrorResponse): string {
  if (response.data?.error?.message) {
    return response.data.error.message;
  }

  if (response.data?.error?.details?.errors) {
    return response.data.error.details.errors
      .map((err: any) => err.message)
      .join(', ');
  }

  switch (response.status) {
    case 400:
      return 'Requête invalide';
    case 401:
      return 'Non autorisé - Veuillez vous connecter';
    case 403:
      return 'Accès interdit';
    case 404:
      return 'Ressource non trouvée';
    case 429:
      return 'Trop de requêtes - Veuillez patienter';
    case 500:
      return 'Erreur interne du serveur';
    case 503:
      return 'Service temporairement indisponible';
    default:
      return `Erreur ${response.status}`;
  }
}

/**
 * Hook pour gérer les erreurs avec retry automatique
 */
export function useErrorHandler() {
  return {
    handleError: (error: Error | StrapiError) => {
      console.error('API Error:', error);
      
      // Log spécialisé pour les erreurs Strapi
      if ('response' in error) {
        const strapiError = error as StrapiError;
        console.error('Strapi Error Details:', {
          status: strapiError.response.status,
          data: strapiError.response.data,
          url: strapiError.config?.url,
          method: strapiError.config?.method,
        });
      }
    },

    shouldRetry: (error: Error | StrapiError, attemptNumber: number): boolean => {
      // Ne pas retry plus de 3 fois
      if (attemptNumber >= 3) return false;

      if ('response' in error) {
        const strapiError = error as StrapiError;
        // Retry seulement pour les erreurs temporaires
        return [408, 429, 500, 502, 503, 504].includes(strapiError.response.status);
      }

      // Retry pour les erreurs réseau
      return error.name === 'NetworkError' || error.message.includes('fetch');
    },

    getRetryDelay: (attemptNumber: number): number => {
      // Délai exponentiel : 1s, 2s, 4s
      return Math.min(1000 * Math.pow(2, attemptNumber - 1), 4000);
    }
  };
}