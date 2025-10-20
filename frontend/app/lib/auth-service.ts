/**
 * Service d'authentification unifié
 * Compatible Strapi v5 ET Backend MERN
 */

import { CONFIG, BACKEND_TYPE } from './api-config';

// Types d'authentification
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  isAdmin?: boolean; // Spécifique MERN
  confirmed?: boolean; // Spécifique Strapi
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string; // Optionnel selon backend
}

export interface AuthResponse {
  user: AuthUser;
  jwt?: string; // Strapi
  accessToken?: string; // MERN
  refreshToken?: string; // MERN
}

// Clés de stockage (LocalStorage)
const STORAGE_KEYS = {
  accessToken: 'auth_access_token',
  refreshToken: 'auth_refresh_token',
  user: 'auth_user',
};

/**
 * Service d'authentification adaptatif
 */
export class AuthService {
  private baseURL: string;

  constructor() {
    this.baseURL = CONFIG.baseURL;
  }

  /**
   * Login - Compatible Strapi et MERN
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const endpoint = `${this.baseURL}${CONFIG.auth.login}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: credentials.email, // Strapi
        email: credentials.email,       // MERN
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || error.error?.message || 'Authentication failed');
    }

    const data = await response.json();
    
    // Adapter la réponse selon le backend
    const authResponse = this.normalizeAuthResponse(data);
    
    // Stocker les tokens
    this.storeTokens(authResponse);
    
    return authResponse;
  }

  /**
   * Register - Compatible Strapi et MERN
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    const endpoint = `${this.baseURL}${CONFIG.auth.register}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(error.message || error.error?.message || 'Registration failed');
    }

    const data = await response.json();
    const authResponse = this.normalizeAuthResponse(data);
    this.storeTokens(authResponse);
    
    return authResponse;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    // Pour MERN, appeler l'endpoint logout (révoque refresh token)
    if (BACKEND_TYPE === 'mern' && 'logout' in CONFIG.auth) {
      try {
        const refreshToken = this.getRefreshToken();
        if (refreshToken) {
          await fetch(`${this.baseURL}${CONFIG.auth.logout}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.getAccessToken()}`,
            },
            body: JSON.stringify({ refreshToken }),
          });
        }
      } catch (error) {
        console.warn('Logout endpoint failed:', error);
      }
    }

    // Nettoyer le stockage local
    this.clearTokens();
  }

  /**
   * Refresh token - Spécifique MERN
   */
  async refreshAccessToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const endpoint = `${this.baseURL}${CONFIG.auth.refresh}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      this.clearTokens();
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    const newAccessToken = data.accessToken || data.jwt;
    
    // Stocker le nouveau token
    localStorage.setItem(STORAGE_KEYS.accessToken, newAccessToken);
    
    return newAccessToken;
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const endpoint = `${this.baseURL}${CONFIG.auth.me}`;
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        this.clearTokens();
        return null;
      }

      const data = await response.json();
      
      // Adapter selon le backend
      if (BACKEND_TYPE === 'mern') {
        return data.user || data;
      } else {
        // Strapi
        return data;
      }
    } catch (error) {
      console.error('Get current user failed:', error);
      return null;
    }
  }

  /**
   * Normalize auth response between backends
   */
  private normalizeAuthResponse(data: any): AuthResponse {
    if (BACKEND_TYPE === 'mern') {
      // Backend MERN format
      return {
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
    } else {
      // Strapi format
      return {
        user: data.user,
        jwt: data.jwt,
      };
    }
  }

  /**
   * Store tokens in localStorage
   */
  private storeTokens(auth: AuthResponse): void {
    const token = auth.accessToken || auth.jwt;
    if (token) {
      localStorage.setItem(STORAGE_KEYS.accessToken, token);
    }
    
    if (auth.refreshToken) {
      localStorage.setItem(STORAGE_KEYS.refreshToken, auth.refreshToken);
    }
    
    if (auth.user) {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(auth.user));
    }
  }

  /**
   * Clear all tokens
   */
  private clearTokens(): void {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.user);
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.accessToken);
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.refreshToken);
  }

  /**
   * Get stored user
   */
  getStoredUser(): AuthUser | null {
    const user = localStorage.getItem(STORAGE_KEYS.user);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Check if user is admin (MERN only)
   */
  isAdmin(): boolean {
    const user = this.getStoredUser();
    return user?.isAdmin === true;
  }
}

// Singleton instance
export const authService = new AuthService();
