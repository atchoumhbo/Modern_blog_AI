/**
 * Composants de protection et authentification React
 */

import { useAuth } from '~/hooks/useAuth';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  fallback?: ReactNode;
}

/**
 * Composant pour protéger les routes
 */
export function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  requireAdmin = false,
  fallback 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Chargement...</div>;
  }

  if (requireAuth && !isAuthenticated) {
    return fallback || <div>Accès refusé - Connexion requise</div>;
  }

  if (requireAdmin && !user?.isAdmin) {
    return fallback || <div>Accès refusé - Droits administrateur requis</div>;
  }
  
  return <>{children}</>;
}