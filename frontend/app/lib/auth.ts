/**
 * Service d'authentification sécurisé pour Strapi
 * Gestion JWT, refresh tokens, et sécurité
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { config } from './utils';

// Configuration de l'authentification
export const AUTH_CONFIG = {
  tokenKey: 'strapi_jwt',
  refreshTokenKey: 'strapi_refresh_token',
  userKey: 'strapi_user',
  apiUrl: process.env.NODE_ENV === 'production' 
    ? 'https://your-strapi-domain.com/api' 
    : 'http://localhost:1337/api',
  endpoints: {
    login: '/auth/local',
    register: '/auth/local/register',
    refresh: '/auth/refresh',
    me: '/users/me',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
};

// Types pour l'authentification
interface LoginCredentials {
  identifier: string; // email ou username
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface AuthUser {
  id: number;
  username: string;
  email: string;
  confirmed: boolean;
  blocked: boolean;
  role?: {
    id: number;
    name: string;
    description: string;
  };
}

interface AuthResponse {
  jwt: string;
  user: AuthUser;
}

// Clés de stockage sécurisé
const AUTH_TOKEN_KEY = 'strapi_jwt';
const USER_KEY = 'strapi_user';
const REFRESH_TOKEN_KEY = 'strapi_refresh_token';

// ========================================
// UTILITAIRES DE STOCKAGE SÉCURISÉ
// ========================================

export const authStorage = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },
  
  setToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  },
  
  getUser: (): AuthUser | null => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },
  
  setUser: (user: AuthUser): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  
  setRefreshToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  
  clear: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

// ========================================
// REQUÊTES API AUTHENTIFIÉES
// ========================================

/**
 * Fetch sécurisé avec token automatique et gestion refresh
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = authStorage.getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  
  let response = await fetch(`${config.strapiUrl}${url}`, {
    ...options,
    headers,
  });
  
  // Si le token a expiré, essayer de le renouveler
  if (response.status === 401 && token) {
    const refreshed = await refreshAuthToken();
    if (refreshed) {
      // Retry avec le nouveau token
      headers.Authorization = `Bearer ${authStorage.getToken()}`;
      response = await fetch(`${config.strapiUrl}${url}`, {
        ...options,
        headers,
      });
    } else {
      // Refresh impossible, déconnecter l'utilisateur
      authStorage.clear();
      window.location.href = '/login';
      throw new Error('Session expirée');
    }
  }
  
  if (!response.ok) {
    const error = await response.text().catch(() => response.statusText);
    throw new Error(`API Error ${response.status}: ${error}`);
  }
  
  return response;
}

/**
 * Tenter de renouveler le token avec le refresh token
 */
async function refreshAuthToken(): Promise<boolean> {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) return false;
  
  try {
    const response = await fetch(`${config.strapiUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (response.ok) {
      const { jwt } = await response.json();
      authStorage.setToken(jwt);
      return true;
    }
  } catch (error) {
    console.error('Erreur refresh token:', error);
  }
  
  return false;
}

// ========================================
// HOOKS D'AUTHENTIFICATION
// ========================================

/**
 * Hook pour l'état d'authentification de l'utilisateur
 */
export function useAuth() {
  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async (): Promise<AuthUser | null> => {
      const token = authStorage.getToken();
      if (!token) return null;
      
      try {
        const response = await authenticatedFetch('/users/me');
        const user = await response.json();
        authStorage.setUser(user);
        return user;
      } catch (error) {
        // Token invalide, nettoyer le stockage
        authStorage.clear();
        return null;
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000,     // 30 minutes
    retry: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook pour la connexion
 */
export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      const response = await fetch(`${config.strapiUrl}/auth/local`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erreur de connexion' }));
        throw new Error(error.message || 'Identifiants invalides');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Stocker les tokens et données utilisateur
      authStorage.setToken(data.jwt);
      authStorage.setUser(data.user);
      
      // Mettre à jour le cache utilisateur
      queryClient.setQueryData(['auth', 'user'], data.user);
      
      console.log('✅ Connexion réussie:', data.user.username);
    },
    onError: (error) => {
      console.error('❌ Erreur connexion:', error);
      authStorage.clear();
    }
  });
}

/**
 * Hook pour l'inscription
 */
export function useRegister() {
  return useMutation({
    mutationFn: async (userData: RegisterData): Promise<AuthResponse> => {
      const response = await fetch(`${config.strapiUrl}/auth/local/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erreur d\'inscription' }));
        throw new Error(error.message || 'Impossible de créer le compte');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      authStorage.setToken(data.jwt);
      authStorage.setUser(data.user);
      console.log('✅ Inscription réussie:', data.user.username);
    },
    onError: (error) => {
      console.error('❌ Erreur inscription:', error);
    }
  });
}

/**
 * Hook pour la déconnexion
 */
export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Optionnel: appeler un endpoint de logout côté serveur
      try {
        await authenticatedFetch('/auth/logout', { method: 'POST' });
      } catch (error) {
        // Ignorer les erreurs de logout côté serveur
        console.warn('Erreur logout serveur:', error);
      }
    },
    onSettled: () => {
      // Nettoyer le stockage local et le cache
      authStorage.clear();
      queryClient.clear(); // Vider tout le cache
      
      console.log('✅ Déconnexion effectuée');
    }
  });
}

/**
 * Hook pour changer le mot de passe
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await authenticatedFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      return response.json();
    },
    onSuccess: () => {
      console.log('✅ Mot de passe modifié');
    },
    onError: (error) => {
      console.error('❌ Erreur changement mot de passe:', error);
    }
  });
}

/**
 * Hook pour vérifier les permissions utilisateur
 */
export function usePermissions() {
  const { data: user } = useAuth();
  
  return {
    isAuthenticated: !!user,
    isAdmin: user?.role?.name === 'Administrator',
    isEditor: user?.role?.name === 'Editor' || user?.role?.name === 'Administrator',
    canCreateContent: user?.role?.name === 'Editor' || user?.role?.name === 'Administrator',
    canPublish: user?.role?.name === 'Administrator',
    user,
  };
}