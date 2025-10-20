/**
 * Configuration de l'API Backend
 * Supporte Strapi v5 ET Backend MERN
 */

// Type du backend utilisé
export type BackendType = 'strapi' | 'mern';

// Détection automatique du backend (via variable d'environnement Vite)
export const BACKEND_TYPE: BackendType = 
  (import.meta.env.VITE_BACKEND_TYPE as BackendType) || 'mern';

// Configuration selon le backend
const BACKEND_CONFIG = {
  strapi: {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:1337/api',
    authEndpoints: {
      register: '/auth/local/register',
      login: '/auth/local',
      refresh: '/auth/refresh',
      me: '/users/me',
      forgotPassword: '/auth/forgot-password',
      resetPassword: '/auth/reset-password',
    },
  },
  mern: {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    authEndpoints: {
      register: '/auth/register',
      login: '/auth/login',
      refresh: '/auth/refresh',
      me: '/auth/me',
      logout: '/auth/logout',
      changePassword: '/auth/change-password',
    },
  },
};

// Export de la configuration active
export const API_CONFIG = BACKEND_CONFIG[BACKEND_TYPE];

// Endpoints communs (compatibles Strapi et MERN)
export const API_ENDPOINTS = {
  articles: '/articles',
  projects: '/projects',
  categories: '/categories',
  tags: '/tags',
  apiKeys: '/api-keys', // Spécifique MERN
  upload: '/upload',
} as const;

// Configuration globale
export const CONFIG = {
  backend: BACKEND_TYPE,
  baseURL: API_CONFIG.baseURL,
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  
  // Endpoints auth selon le backend
  auth: API_CONFIG.authEndpoints,
  
  // Endpoints data (identiques)
  endpoints: API_ENDPOINTS,
} as const;

// Helper pour construire une URL complète
export function buildApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${CONFIG.baseURL}${cleanEndpoint}`;
}

// Helper pour logger la configuration
export function logApiConfig(): void {
  console.log('🔧 API Configuration:');
  console.log('  Backend Type:', CONFIG.backend);
  console.log('  Base URL:', CONFIG.baseURL);
  console.log('  Environment:', import.meta.env.MODE);
}

// Log automatique en dev
if (import.meta.env.DEV) {
  logApiConfig();
}
