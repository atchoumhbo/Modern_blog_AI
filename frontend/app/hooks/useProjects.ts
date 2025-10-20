import { useQuery, useQueryClient } from '@tanstack/react-query';
import { projectService, queryKeys } from '../lib/strapi-services';
import { getProjects, getProjectBySlug } from '../lib/api';

/**
 * Hook pour récupérer tous les projets avec options
 */
export function useProjects(options: {
  pageSize?: number;
  page?: number;
  category?: string;
  status?: 'active' | 'completed' | 'archived';
  sort?: string[];
} = {}) {
  return useQuery({
    queryKey: queryKeys.projects.list(options),
    queryFn: async () => {
      try {
        const response = await projectService.getProjects(options);
        return { projects: response.data, meta: response.meta };
      } catch (error) {
        console.warn('Projects service failed:', error);
        // Fallback vers l'API existante
        return getProjects(options);
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Hook pour récupérer un projet par slug
 */
export function useProject(slug: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(slug),
    queryFn: async () => {
      try {
        const response = await projectService.getProjectBySlug(slug);
        return response.data;
      } catch (error) {
        console.warn('Project service failed:', error);
        return getProjectBySlug(slug);
      }
    },
    enabled: !!slug,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Hook pour récupérer les projets récents
 */
export function useRecentProjects(limit: number = 3) {
  return useQuery({
    queryKey: queryKeys.projects.recent(limit),
    queryFn: async () => {
      try {
        const response = await projectService.getRecentProjects(limit);
        return { projects: response.data, meta: response.meta };
      } catch (error) {
        console.warn('Recent projects service failed:', error);
        return getProjects({
          pageSize: limit,
          sort: ['createdAt:desc']
        });
      }
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Hook pour récupérer les projets par catégorie
 */
export function useProjectsByCategory(categorySlug: string) {
  return useQuery({
    queryKey: queryKeys.projects.byCategory(categorySlug),
    queryFn: async () => {
      try {
        const response = await projectService.getProjectsByCategory(categorySlug);
        return { projects: response.data, meta: response.meta };
      } catch (error) {
        console.warn('Projects by category service failed:', error);
        return getProjects({
          filters: {
            category: { slug: { $eq: categorySlug } }
          }
        });
      }
    },
    enabled: !!categorySlug,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}

/**
 * Hook pour récupérer les projets par statut
 */
export function useProjectsByStatus(status: 'active' | 'completed' | 'archived') {
  return useQuery({
    queryKey: queryKeys.projects.byStatus(status),
    queryFn: async () => {
      try {
        const response = await projectService.getProjectsByStatus(status);
        return { projects: response.data, meta: response.meta };
      } catch (error) {
        console.warn('Projects by status service failed:', error);
        return getProjects({
          filters: {
            status: { $eq: status }
          }
        });
      }
    },
    enabled: !!status,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}

/**
 * Hook pour précharger un projet (utile au hover des liens)
 */
export function usePrefetchProject() {
  const queryClient = useQueryClient();

  return (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.projects.detail(slug),
      queryFn: () => projectService.getProjectBySlug(slug),
      staleTime: 10 * 60 * 1000,
    });
  };
}

/**
 * Hook pour les statistiques des projets
 */
export function useProjectsStats() {
  return useQuery({
    queryKey: queryKeys.projects.stats(),
    queryFn: async () => {
      try {
        return await projectService.getProjectsStats();
      } catch (error) {
        console.warn('Projects stats service failed:', error);
        // Fallback basique
        const allProjects = await getProjects({ pageSize: 1000 });
        const projects = allProjects.projects || [];
        
        return {
          total: projects.length,
          active: projects.filter(p => p.status === 'active').length,
          completed: projects.filter(p => p.status === 'completed').length,
          archived: projects.filter(p => p.status === 'archived').length,
        };
      }
    },
    staleTime: 30 * 60 * 1000, // Cache long pour les stats
    gcTime: 60 * 60 * 1000,
  });
}