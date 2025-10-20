import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseInfiniteQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { articleService, projectService, queryKeys, webhookService } from '../lib/strapi-services';
import type { Post, Project, BaseQueryParams, StrapiSuccessResponse } from '../lib/strapi-services';
import { useErrorHandler } from '../components/StrapiErrorBoundary';

/**
 * Hook principal pour les articles avec gestion d'erreur avancée
 */
export function useStrapiArticles(
  params: BaseQueryParams = {},
  options?: Partial<UseQueryOptions<StrapiSuccessResponse<Post[]>, Error>>
) {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: queryKeys.articles.list(params),
    queryFn: async () => {
      try {
        return await articleService.getArticles(params);
      } catch (error) {
        handleError(error as Error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: (failureCount, error) => {
      const { shouldRetry } = useErrorHandler();
      return shouldRetry(error, failureCount);
    },
    retryDelay: (attemptIndex) => {
      const { getRetryDelay } = useErrorHandler();
      return getRetryDelay(attemptIndex);
    },
    ...options,
  });
}

/**
 * Hook pour récupération infinie d'articles (pagination)
 */
export function useStrapiArticlesInfinite(
  baseParams: BaseQueryParams = {},
  options?: Partial<UseInfiniteQueryOptions<StrapiSuccessResponse<Post[]>, Error>>
) {
  const { handleError } = useErrorHandler();

  return useInfiniteQuery({
    queryKey: queryKeys.articles.list(baseParams),
    queryFn: async ({ pageParam = 1 }) => {
      try {
        return await articleService.getArticles({
          ...baseParams,
          page: pageParam as number,
        });
      } catch (error) {
        handleError(error as Error);
        throw error;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage.meta;
      if (pagination.page < pagination.pageCount) {
        return pagination.page + 1;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook pour un article spécifique
 */
export function useStrapiArticle(
  slug: string,
  options?: Partial<UseQueryOptions<StrapiSuccessResponse<Post[]>, Error>>
) {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: queryKeys.articles.detail(slug),
    queryFn: async () => {
      try {
        return await articleService.getArticleBySlug(slug);
      } catch (error) {
        handleError(error as Error);
        throw error;
      }
    },
    enabled: !!slug,
    staleTime: 15 * 60 * 1000, // Cache plus long pour les détails
    gcTime: 30 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook pour les projets avec gestion d'erreur
 */
export function useStrapiProjects(
  params: BaseQueryParams = {},
  options?: Partial<UseQueryOptions<StrapiSuccessResponse<Project[]>, Error>>
) {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: queryKeys.projects.list(params),
    queryFn: async () => {
      try {
        return await projectService.getProjects(params);
      } catch (error) {
        handleError(error as Error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook pour un projet spécifique
 */
export function useStrapiProject(
  slug: string,
  options?: Partial<UseQueryOptions<StrapiSuccessResponse<Project[]>, Error>>
) {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: queryKeys.projects.detail(slug),
    queryFn: async () => {
      try {
        return await projectService.getProjectBySlug(slug);
      } catch (error) {
        handleError(error as Error);
        throw error;
      }
    },
    enabled: !!slug,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook pour déclencher les webhooks N8N
 */
export function useN8NWebhook() {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async ({ event, data }: { event: string; data: any }) => {
      try {
        return await webhookService.triggerWebhook(event, data);
      } catch (error) {
        handleError(error as Error);
        throw error;
      }
    },
    onSuccess: (_, { event }) => {
      // Invalide les caches selon le type d'événement
      if (event.includes('article')) {
        queryClient.invalidateQueries({ queryKey: queryKeys.articles.all() });
      } else if (event.includes('project')) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() });
      }
    },
  });
}

/**
 * Hook pour notification automatique de création d'article
 */
export function useNotifyArticleCreated() {
  return useMutation({
    mutationFn: async (article: Post) => {
      return await webhookService.notifyArticleCreated(article);
    },
  });
}

/**
 * Hook pour notification automatique de mise à jour d'article
 */
export function useNotifyArticleUpdated() {
  return useMutation({
    mutationFn: async (article: Post) => {
      return await webhookService.notifyArticleUpdated(article);
    },
  });
}

/**
 * Hook pour précharger le contenu (optimisation UX)
 */
export function useStrapiPrefetch() {
  const queryClient = useQueryClient();

  return {
    prefetchArticle: (slug: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.articles.detail(slug),
        queryFn: () => articleService.getArticleBySlug(slug),
        staleTime: 10 * 60 * 1000,
      });
    },

    prefetchProject: (slug: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.projects.detail(slug),
        queryFn: () => projectService.getProjectBySlug(slug),
        staleTime: 10 * 60 * 1000,
      });
    },

    prefetchArticles: (params: BaseQueryParams = {}) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.articles.list(params),
        queryFn: () => articleService.getArticles(params),
        staleTime: 5 * 60 * 1000,
      });
    },

    prefetchProjects: (params: BaseQueryParams = {}) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.projects.list(params),
        queryFn: () => projectService.getProjects(params),
        staleTime: 10 * 60 * 1000,
      });
    },
  };
}

/**
 * Hook pour la synchronisation en arrière-plan
 */
export function useStrapiSync() {
  const queryClient = useQueryClient();

  return {
    syncArticles: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.articles.all(),
        refetchType: 'active'
      });
    },

    syncProjects: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.projects.all(),
        refetchType: 'active'
      });
    },

    syncAll: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === 'articles' || key === 'projects';
        },
        refetchType: 'active'
      });
    },
  };
}