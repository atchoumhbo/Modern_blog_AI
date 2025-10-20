/**
 * API Client sécurisé avec authentification automatique
 * Compatible avec Strapi v5 et TanStack Query
 */

import { AUTH_CONFIG } from './auth';

// Types pour les réponses Strapi
export interface StrapiErrorResponse {
  error: {
    status: number;
    name: string;
    message: string;
    details?: any;
  };
}

export interface StrapiSuccessResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export type StrapiResponse<T> = StrapiSuccessResponse<T> | StrapiErrorResponse;

// Configuration de l'API
const API_CONFIG = {
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://your-strapi-domain.com/api' 
    : 'http://localhost:1337/api',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
};

// Classe d'erreur personnalisée
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Client API sécurisé avec gestion automatique des tokens
 */
class SecureApiClient {
  private baseURL: string;
  private timeout: number;
  private retries: number;
  private retryDelay: number;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
    this.retries = API_CONFIG.retries;
    this.retryDelay = API_CONFIG.retryDelay;
  }

  /**
   * Récupère le token d'authentification
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_CONFIG.tokenKey);
  }

  /**
   * Récupère les headers par défaut
   */
  private getDefaultHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Gère les erreurs de réponse
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails = null;

      if (contentType?.includes('application/json')) {
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error.message || errorMessage;
            errorDetails = errorData.error.details;
          }
        } catch (e) {
          // Si on ne peut pas parser le JSON, on garde le message par défaut
        }
      }

      // Gestion spéciale pour les erreurs d'authentification
      if (response.status === 401) {
        // Token expiré ou invalide - nettoyer le localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem(AUTH_CONFIG.tokenKey);
          localStorage.removeItem(AUTH_CONFIG.refreshTokenKey);
          localStorage.removeItem(AUTH_CONFIG.userKey);
        }
        
        // Rediriger vers la page de connexion si on est côté client
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      throw new ApiError(errorMessage, response.status, errorDetails);
    }

    // Gestion des réponses vides
    if (response.status === 204) {
      return {} as T;
    }

    if (contentType?.includes('application/json')) {
      return response.json();
    }

    return response.text() as unknown as T;
  }

  /**
   * Retry logic avec backoff exponentiel
   */
  private async withRetry<T>(
    operation: () => Promise<Response>,
    attempt: number = 1
  ): Promise<T> {
    try {
      const response = await operation();
      return this.handleResponse<T>(response);
    } catch (error) {
      if (attempt >= this.retries) {
        throw error;
      }

      // Retry seulement pour certaines erreurs
      if (error instanceof ApiError) {
        const shouldRetry = error.status >= 500 || error.status === 429;
        if (!shouldRetry) {
          throw error;
        }
      }

      // Attendre avant de retry avec backoff exponentiel
      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.withRetry<T>(operation, attempt + 1);
    }
  }

  /**
   * GET request sécurisé
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object') {
            url.searchParams.append(key, JSON.stringify(value));
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      });
    }

    return this.withRetry<T>(() =>
      fetch(url.toString(), {
        method: 'GET',
        headers: this.getDefaultHeaders(),
        signal: AbortSignal.timeout(this.timeout),
      })
    );
  }

  /**
   * POST request sécurisé
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.withRetry<T>(() =>
      fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getDefaultHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal: AbortSignal.timeout(this.timeout),
      })
    );
  }

  /**
   * PUT request sécurisé
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.withRetry<T>(() =>
      fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: this.getDefaultHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal: AbortSignal.timeout(this.timeout),
      })
    );
  }

  /**
   * DELETE request sécurisé
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.withRetry<T>(() =>
      fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getDefaultHeaders(),
        signal: AbortSignal.timeout(this.timeout),
      })
    );
  }

  /**
   * Upload de fichiers
   */
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const headers = { ...this.getDefaultHeaders() };
    // Supprimer Content-Type pour les uploads - le navigateur le définira automatiquement
    delete (headers as any)['Content-Type'];

    return this.withRetry<T>(() =>
      fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
        signal: AbortSignal.timeout(this.timeout * 2), // Timeout plus long pour les uploads
      })
    );
  }

  /**
   * Health check de l'API
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Instance singleton
export const apiClient = new SecureApiClient();

/**
 * Hooks utilitaires pour TanStack Query
 */
export const createQueryKey = (resource: string, params?: any) => {
  return params ? [resource, params] : [resource];
};

export const createMutationKey = (resource: string, action: string) => {
  return [resource, action];
};

/**
 * Wrapper pour les erreurs d'API
 */
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Une erreur inattendue s\'est produite';
};

/**
 * Utilitaires pour Strapi
 */
export const strapiHelpers = {
  /**
   * Construit les paramètres de population Strapi
   */
  buildPopulate: (fields: string[] | Record<string, any>): string => {
    if (Array.isArray(fields)) {
      return fields.join(',');
    }
    return JSON.stringify(fields);
  },

  /**
   * Construit les filtres Strapi
   */
  buildFilters: (filters: Record<string, any>): string => {
    return JSON.stringify(filters);
  },

  /**
   * Construit les paramètres de tri Strapi
   */
  buildSort: (sort: string[] | string): string => {
    if (Array.isArray(sort)) {
      return sort.join(',');
    }
    return sort;
  },
};

export default apiClient;