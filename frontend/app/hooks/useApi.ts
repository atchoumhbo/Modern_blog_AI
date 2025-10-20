/**
 * Hooks TanStack Query pour l'API Strapi
 * Hooks optimisés avec cache, authentification et gestion d'erreur
 */

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  useInfiniteQuery 
} from '@tanstack/react-query';
import { 
  getPosts, 
  getPostBySlug, 
  getProjects, 
  getProjectBySlug
} from '~/lib/api';
import { articleService, projectService, webhookService, queryKeys } from '~/lib/strapi-services';
import type { Post, Project } from '~/lib/types';
import type { StrapiSuccessResponse } from '~/lib/api-client';

// Types pour les paramètres de requête
interface PostsParams {
  page?: number;
  pageSize?: number;
  sort?: any;
  filters?: any;
  populate?: any;
}

interface ProjectsParams {
  page?: number;
  pageSize?: number;
  sort?: any;
  filters?: any;
  populate?: any;
  language?: string;
}

/**
 * Hook pour récupérer les articles avec pagination et filtres
 * Compatible avec l'API existante + Strapi services
 */
export function useArticles(params: PostsParams = {}) {
  return useQuery({
    queryKey: queryKeys.articles.list(params),
    queryFn: async () => {
      try {
        // Essayer d'abord avec le nouveau service Strapi
        const response = await articleService.getArticles(params);
        return {
          posts: response.data,
          meta: response.meta
        };
      } catch (error) {
        // Fallback vers l'ancienne API
        console.warn('Strapi service failed, falling back to legacy API:', error);
        return getPosts(params);
      }
    },
    staleTime: 2 * 60 * 1000, // Cache 2 minutes pour les listes
    gcTime: 5 * 60 * 1000,    // Garde en mémoire 5 minutes
    refetchOnWindowFocus: true,
    placeholderData: { posts: [], meta: null }, // Données placeholder pendant le chargement
  });
}

/**
 * Alias pour useArticles avec une API plus simple
 * Compatible avec l'existant + filtrage par langue
 */
export function usePosts(params: { page?: number; pageSize?: number; language?: string } = {}) {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: () => getPosts(params),
    staleTime: 2 * 60 * 1000, // Cache 2 minutes pour les listes
    gcTime: 5 * 60 * 1000,    // Garde en mémoire 5 minutes
    refetchOnWindowFocus: true,
    placeholderData: { posts: [], meta: null }, // Données placeholder pendant le chargement
  });
}

/**
 * Hook pour récupérer un article par son slug avec cache long
 */
export function useArticle(slug: string) {
  return useQuery({
    queryKey: queryKeys.articles.detail(slug),
    queryFn: async () => {
      try {
        // Essayer avec le nouveau service Strapi
        const response = await articleService.getArticleBySlug(slug);
        return response.data[0] || null; // Strapi retourne un array
      } catch (error) {
        // Fallback vers l'ancienne API
        console.warn('Strapi service failed, falling back to legacy API:', error);
        return getPostBySlug(slug);
      }
    },
    enabled: !!slug, // Ne lance la requête que si le slug existe
    staleTime: 10 * 60 * 1000, // Cache 10 minutes pour les articles individuels
    gcTime: 30 * 60 * 1000,    // Garde en mémoire 30 minutes
  });
}

/**
 * Hook pour récupérer les projets avec pagination
 */
export function useProjects(params: ProjectsParams = {}) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => getProjects(params),
    staleTime: 5 * 60 * 1000, // Cache 5 minutes pour les projets
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false, // Moins de refetch pour les projets
  });
}

/**
 * Hook pour récupérer un projet par son slug
 */
export function useProject(slug: string) {
  return useQuery({
    queryKey: ['project', slug],
    queryFn: () => getProjectBySlug(slug),
    enabled: !!slug,
    staleTime: 15 * 60 * 1000, // Cache long pour les projets
    gcTime: 60 * 60 * 1000,    // 1 heure en mémoire
  });
}

/**
 * Hook pour la recherche d'articles avec debounce
 */
export function useSearchPosts(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['search', 'posts', query],
    queryFn: () => getPosts({
      filters: {
        $or: [
          { title: { $containsi: query } },
          { excerpt: { $containsi: query } },
          { content: { $containsi: query } }
        ]
      },
      pageSize: 50,
    }),
    enabled: enabled && query.length > 2, // Active seulement si query > 2 caractères
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook pour récupérer les articles populaires/recommandés
 */
export function usePopularPosts(limit: number = 5) {
  return useQuery({
    queryKey: ['posts', 'popular', limit],
    queryFn: () => getPosts({
      sort: ['viewCount:desc', 'publishedAt:desc'],
      pageSize: limit,
      filters: {
        publishedAt: { $notNull: true }
      }
    }),
    staleTime: 15 * 60 * 1000, // Cache 15 minutes
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Hook pour récupérer les articles récents
 */
export function useRecentPosts(limit: number = 5) {
  return useQuery({
    queryKey: ['posts', 'recent', limit],
    queryFn: () => getPosts({
      sort: ['publishedAt:desc'],
      pageSize: limit,
      filters: {
        publishedAt: { $notNull: true }
      }
    }),
    staleTime: 5 * 60 * 1000, // Cache court pour les récents
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Hook avec pagination infinie pour le scroll infini
 */
export function useInfinitePosts(pageSize: number = 10) {
  return useInfiniteQuery({
    queryKey: ['posts', 'infinite'],
    queryFn: ({ pageParam = 1 }) => getPosts({
      page: pageParam,
      pageSize,
      sort: ['publishedAt:desc']
    }),
    getNextPageParam: (lastPage, pages) => {
      const nextPage = pages.length + 1;
      return nextPage <= (lastPage.meta?.pagination?.pageCount || 1) ? nextPage : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Hook pour récupérer les articles populaires
 */
export function usePopularArticles(limit: number = 5) {
  return useQuery({
    queryKey: queryKeys.articles.popular(limit),
    queryFn: async () => {
      try {
        const response = await articleService.getPopularArticles(limit);
        return { posts: response.data, meta: response.meta };
      } catch (error) {
        console.warn('Popular articles service failed:', error);
        // Fallback vers l'API existante
        return getPosts({
          pageSize: limit,
          sort: ['date:desc']
        });
      }
    },
    staleTime: 15 * 60 * 1000, // Cache plus long pour le contenu populaire
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Hook pour récupérer les articles récents
 */
export function useRecentArticles(limit: number = 5) {
  return useQuery({
    queryKey: queryKeys.articles.recent(limit),
    queryFn: async () => {
      try {
        const response = await articleService.getRecentArticles(limit);
        return { posts: response.data, meta: response.meta };
      } catch (error) {
        console.warn('Recent articles service failed:', error);
        return getPosts({
          pageSize: limit,
          sort: ['date:desc']
        });
      }
    },
    staleTime: 5 * 60 * 1000, // Cache court pour les récents
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Hook pour la recherche d'articles avec debounce
 */
export function useSearchArticles(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.articles.search(query),
    queryFn: async () => {
      try {
        const response = await articleService.searchArticles(query);
        return { posts: response.data, meta: response.meta };
      } catch (error) {
        console.warn('Search service failed:', error);
        // Fallback vers l'API existante
        return getPosts({
          filters: {
            $or: [
              { title: { $containsi: query } },
              { excerpt: { $containsi: query } },
              { body: { $containsi: query } }
            ]
          },
          pageSize: 50,
        });
      }
    },
    enabled: enabled && query.length > 2, // Active seulement si query > 2 caractères
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook pour précharger un article (utile au hover des liens)
 */
export function usePrefetchArticle() {
  const queryClient = useQueryClient();

  return (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.articles.detail(slug),
      queryFn: () => articleService.getArticleBySlug(slug),
      staleTime: 10 * 60 * 1000,
    });
  };
}

/**
 * Hook pour créer un nouvel article (mock pour démo)
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postData: Partial<Post>) => {
      // Simulation d'une API
      console.log('Creating post:', postData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...postData, id: Date.now().toString() } as Post;
    },
    onSuccess: () => {
      // Invalide tous les caches des articles
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error) => {
      console.error('Failed to create post:', error);
    },
  });
}

/**
 * Hook pour supprimer un article (mock pour démo)
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Simulation d'une API
      console.log('Deleting post:', id);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      // Invalide tous les caches des articles
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}