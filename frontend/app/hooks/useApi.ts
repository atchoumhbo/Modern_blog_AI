import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import {
  getPosts,
  getPostBySlug,
  getProjects,
  getProjectBySlug,
} from '~/lib/api';
import type { Post, Project } from '~/lib/types';

interface PostsParams {
  page?: number;
  pageSize?: number;
  sort?: any;
  filters?: any;
  language?: string;
}

interface ProjectsParams {
  page?: number;
  pageSize?: number;
  sort?: any;
  filters?: any;
  language?: string;
}

const articleKeys = {
  list: (params: PostsParams = {}) => ['articles', params] as const,
  detail: (slug: string) => ['article', slug] as const,
  popular: (limit: number) => ['articles', 'popular', limit] as const,
  recent: (limit: number) => ['articles', 'recent', limit] as const,
  search: (query: string) => ['articles', 'search', query] as const,
  infinite: ['articles', 'infinite'] as const,
};

const postKeys = {
  list: (params: any = {}) => ['posts', params] as const,
  search: (query: string) => ['posts', 'search', query] as const,
  popular: (limit: number) => ['posts', 'popular', limit] as const,
  recent: (limit: number) => ['posts', 'recent', limit] as const,
};

const projectKeys = {
  list: (params: ProjectsParams = {}) => ['projects', params] as const,
  detail: (slug: string) => ['project', slug] as const,
};

export function useArticles(params: PostsParams = {}) {
  return useQuery({
    queryKey: articleKeys.list(params),
    queryFn: () => getPosts(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    placeholderData: { posts: [], meta: null },
  });
}

export function usePosts(params: { page?: number; pageSize?: number; language?: string } = {}) {
  return useQuery({
    queryKey: postKeys.list(params),
    queryFn: () => getPosts(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    placeholderData: { posts: [], meta: null },
  });
}

export function useArticle(slug: string) {
  return useQuery({
    queryKey: articleKeys.detail(slug),
    queryFn: () => getPostBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useProjects(params: ProjectsParams = {}) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => getProjects(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useProject(slug: string) {
  return useQuery({
    queryKey: projectKeys.detail(slug),
    queryFn: () => getProjectBySlug(slug),
    enabled: !!slug,
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export function useSearchPosts(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: postKeys.search(query),
    queryFn: () =>
      getPosts({
        filters: {
          $or: [
            { title: { $containsi: query } },
            { excerpt: { $containsi: query } },
            { content: { $containsi: query } },
          ],
        },
        pageSize: 50,
      }),
    enabled: enabled && query.length > 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function usePopularPosts(limit: number = 5) {
  return useQuery({
    queryKey: postKeys.popular(limit),
    queryFn: () =>
      getPosts({
        sort: ['viewCount:desc', 'publishedAt:desc'],
        pageSize: limit,
      }),
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useRecentPosts(limit: number = 5) {
  return useQuery({
    queryKey: postKeys.recent(limit),
    queryFn: () =>
      getPosts({
        sort: ['publishedAt:desc'],
        pageSize: limit,
      }),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useInfinitePosts(pageSize: number = 10) {
  return useInfiniteQuery({
    queryKey: articleKeys.infinite,
    queryFn: ({ pageParam = 1 }) =>
      getPosts({
        page: pageParam,
        pageSize,
        sort: ['publishedAt:desc'],
      }),
    getNextPageParam: (lastPage, pages) => {
      const nextPage = pages.length + 1;
      const totalPages = lastPage.meta?.pagination?.pageCount || 1;
      return nextPage <= totalPages ? nextPage : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function usePrefetchArticle() {
  const queryClient = useQueryClient();

  return (slug: string) => {
    if (!slug) return;
    queryClient.prefetchQuery({
      queryKey: articleKeys.detail(slug),
      queryFn: () => getPostBySlug(slug),
      staleTime: 10 * 60 * 1000,
    });
  };
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postData: Partial<Post>) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { ...postData, id: Date.now().toString() } as Post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error) => {
      console.error('Failed to create post:', error);
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
