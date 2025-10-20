/**
 * TanStack Query configuration et provider
 * Configuration optimisée pour le backend MERN avec authentification sécurisée
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import type { ReactNode } from 'react';

// Configuration optimisée pour MERN
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Cache pendant 5 minutes pour éviter trop de requêtes
      staleTime: 5 * 60 * 1000,
      // Garde en mémoire pendant 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry automatique en cas d'erreur réseau
      retry: (failureCount, error: any) => {
        // Ne retry pas les erreurs 4xx (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry jusqu'à 3 fois pour les autres erreurs
        return failureCount < 3;
      },
      // Refetch quand la fenêtre reprend le focus
      refetchOnWindowFocus: true,
      // Refetch quand la connexion réseau est restaurée
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry automatique pour les mutations critiques
      retry: 1,
      // Timeout pour éviter les mutations qui traînent
      networkMode: 'online',
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Créer le client une seule fois par composant
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools uniquement en développement */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom"
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  );
}

// Hook pour accéder au QueryClient si nécessaire
export { useQueryClient } from '@tanstack/react-query';