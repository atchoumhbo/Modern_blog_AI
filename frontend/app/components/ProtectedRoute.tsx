/**
 * Composants de protection et authentification React
 */

import { useAuth, usePermissions } from '~/lib/auth';
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
  const { data: user, isLoading } = useAuth();
  const permissions = usePermissions();
  
  if (isLoading) {
    return <div className="loading">Chargement...</div>;
  }
  
  if (requireAuth && !permissions.isAuthenticated) {
    return fallback || <div>Accès refusé - Connexion requise</div>;
  }
  
  if (requireAdmin && !permissions.isAdmin) {
    return fallback || <div>Accès refusé - Droits administrateur requis</div>;
  }
  
  return <>{children}</>;
}