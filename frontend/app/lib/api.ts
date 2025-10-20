import { config, getImageUrl } from "~/lib/utils";
import type { Post, StrapiPost, Project, StrapiProject } from "~/lib/types";

// Simple querystring builder supporting nested keys like filters[slug][$eq]
function toQuery(params: Record<string, any>): string {
  const parts: string[] = [];
  const encode = encodeURIComponent;

  const build = (key: string, value: any) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      // For Strapi, arrays are typically comma-separated for populate, but for filters arrays we can repeat
      if (key === "populate") {
        parts.push(`${encode(key)}=${encode(value.join(","))}`);
      } else {
        // Include numeric indices for arrays (e.g., filters[$or][0][field])
        value.forEach((v, i) => build(`${key}[${i}]`, v));
      }
    } else if (typeof value === "object") {
      Object.entries(value).forEach(([k, v]) => build(`${key}[${k}]`, v));
    } else {
      parts.push(`${encode(key)}=${encode(String(value))}`);
    }
  };

  Object.entries(params).forEach(([key, value]) => build(key, value));
  return parts.join("&");
}

// Simple in-memory cache for GET requests
type CacheEntry = { expires: number; data: any };
const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 60 * 1000; // 60s

async function fetchStrapi<T>(path: string, params?: Record<string, any>, { ttlMs = DEFAULT_TTL_MS }: { ttlMs?: number } = {}): Promise<T> {
  const qs = params ? `?${toQuery(params)}` : "";
  const url = `${config.apiUrl}${path}${qs}`;

  // Serve from cache if available and not expired
  const now = Date.now();
  const entry = cache.get(url);
  if (entry && entry.expires > now) {
    return entry.data as T;
  }

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    // credentials: 'include', // enable if using auth/cookies later
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Strapi request failed ${res.status}: ${text || res.statusText}`);
  }
  const json = (await res.json()) as T;
  // Store in cache
  cache.set(url, { data: json, expires: now + ttlMs });
  return json;
}

// Fetch function for MERN backend (simple REST with query params)
async function fetchMern<T>(path: string, params?: Record<string, any>, { ttlMs = DEFAULT_TTL_MS }: { ttlMs?: number } = {}): Promise<T> {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }
  
  const qs = queryParams.toString();
  const url = `${config.apiUrl}${path}${qs ? `?${qs}` : ''}`;

  // Serve from cache if available and not expired
  const now = Date.now();
  const entry = cache.get(url);
  if (entry && entry.expires > now) {
    return entry.data as T;
  }

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`MERN API request failed ${res.status}: ${text || res.statusText}`);
  }
  const json = (await res.json()) as T;
  // Store in cache
  cache.set(url, { data: json, expires: now + ttlMs });
  return json;
}

type SortInput = string | string[] | Record<string, string> | undefined;

function normalizeSort(sort: SortInput, defaultField: string) {
  if (!sort) {
    return { field: defaultField, order: 'desc' as const };
  }

  if (Array.isArray(sort) && sort.length > 0) {
    const [first] = sort;
    if (typeof first === 'string' && first.includes(':')) {
      const [field, direction] = first.split(':');
      return { field, order: (direction?.toLowerCase() === 'asc' ? 'asc' : 'desc') as const };
    }
  }

  if (typeof sort === 'string') {
    if (sort.includes(':')) {
      const [field, direction] = sort.split(':');
      return { field, order: (direction?.toLowerCase() === 'asc' ? 'asc' : 'desc') as const };
    }
    return { field: sort, order: 'desc' as const };
  }

  if (typeof sort === 'object') {
    const [field, direction] = Object.entries(sort)[0] || [defaultField, 'desc'];
    return { field, order: (typeof direction === 'string' && direction.toLowerCase() === 'asc' ? 'asc' : 'desc') as const };
  }

  return { field: defaultField, order: 'desc' as const };
}

function toStrapiMeta(meta: any | undefined, fallbackPage: number, fallbackSize: number, totalCount: number) {
  const page = Number(meta?.page ?? fallbackPage);
  const pageSize = Number(meta?.limit ?? fallbackSize);
  const total = Number(meta?.total ?? totalCount);
  const pageCount = Number(meta?.totalPages ?? (pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1));

  return {
    pagination: {
      page,
      pageSize,
      pageCount,
      total,
    },
  };
}

function extractSearchFromFilters(filters: any): string | undefined {
  if (!filters) return undefined;

  if (filters.title?.$contains) return filters.title.$contains;
  if (filters.title?.$containsi) return filters.title.$containsi;

  if (filters.$or && Array.isArray(filters.$or)) {
    for (const clause of filters.$or) {
      if (clause?.title?.$contains) return clause.title.$contains;
      if (clause?.title?.$containsi) return clause.title.$containsi;
      if (clause?.excerpt?.$contains) return clause.excerpt.$contains;
      if (clause?.excerpt?.$containsi) return clause.excerpt.$containsi;
      if (clause?.body?.$contains) return clause.body.$contains;
      if (clause?.body?.$containsi) return clause.body.$containsi;
      if (clause?.content?.$contains) return clause.content.$contains;
      if (clause?.content?.$containsi) return clause.content.$containsi;
    }
  }

  return undefined;
}

function extractArticleFilterParams(filters: any = {}): Record<string, string> {
  const params: Record<string, string> = {};

  const search = extractSearchFromFilters(filters);
  if (search) {
    params.search = search;
  }

  const categoryId = filters.category?.id || filters.category?.documentId;
  if (categoryId) {
    params.category = String(categoryId);
  }

  const categorySlug = filters.category?.slug?.$eq || filters.category?.slug;
  if (categorySlug) {
    params.categorySlug = String(categorySlug);
  }

  const slug = filters.slug?.$eq || filters.slug;
  if (slug) {
    params.slug = String(slug);
  }

  const tagId = filters.tags?.id || filters.tags?.documentId;
  if (tagId) {
    params.tag = String(tagId);
  }

  const tagSlug = filters.tags?.slug?.$eq;
  if (tagSlug) {
    params.tagSlug = String(tagSlug);
  }

  const status = filters.status?.$eq || filters.status;
  if (status) {
    params.status = String(status);
  }

  const publishedAfter = filters.publishedAt?.$gt || filters.publishedAt?.$gte;
  if (publishedAfter) {
    params.publishedAfter = new Date(publishedAfter).toISOString();
  }

  const publishedBefore = filters.publishedAt?.$lt || filters.publishedAt?.$lte;
  if (publishedBefore) {
    params.publishedBefore = new Date(publishedBefore).toISOString();
  }

  return params;
}

function extractProjectFilterParams(filters: any = {}): Record<string, string> {
  const params: Record<string, string> = {};

  const search = extractSearchFromFilters(filters);
  if (search) {
    params.search = search;
  }

  const categoryId = filters.category?.id || filters.category?.documentId;
  if (categoryId) {
    params.category = String(categoryId);
  }

  const categorySlug = filters.category?.slug?.$eq || filters.category?.slug;
  if (categorySlug) {
    params.categorySlug = String(categorySlug);
  }

  const status = filters.status?.$eq || filters.status;
  if (status) {
    params.status = String(status);
  }

  const tagId = filters.tags?.id || filters.tags?.documentId;
  if (tagId) {
    params.tag = String(tagId);
  }

  return params;
}

// Map Strapi post to frontend Post
function mapStrapiPost(item: any): Post {
  // Strapi v5 returns flat attributes at top-level by default (not attributes wrapper)
  const p: StrapiPost = item;

  const image = p.seo?.ogImage
    ? getImageUrl(p.seo.ogImage as any, "medium")
    : p.featured_image
    ? getImageUrl(p.featured_image, "medium")
    : undefined;
  const authorName = p.author?.username || p.author?.email;  // Users plugin utilise username et email
  const authorAvatar = p.author?.avatar ? getImageUrl(p.author.avatar, "thumbnail") : undefined;
  const tags = p.tags?.map((t) => t.name) || [];
  const category = p.category?.name;  // Single category maintenant

  return {
    id: String(p.id),
    documentId: String(p.documentId || p.id),
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt || "",
    body: p.content || "",
    date: p.publishedAt || p.createdAt || "",  // Nouveau nom de champ
    image,
    author: authorName ? { name: authorName, avatar: authorAvatar } : undefined,
    tags,
    category,
    seo: {
      metaTitle: p.seo?.metaTitle || p.title,  // Accès via le composant SEO
      metaDescription: p.seo?.metaDescription,
      keywords: p.seo?.keywords,
      canonicalURL: p.seo?.canonicalUrl,
    },
  };
}

// Map MERN post to frontend Post
function mapMernPost(item: any): Post {
  const image = item.coverImage || item.featuredImage?.url || item.featuredImage;
  const authorName = item.author?.username || item.author?.email || [item.author?.firstName, item.author?.lastName].filter(Boolean).join(' ').trim();
  const authorAvatar = item.author?.avatar?.url || item.author?.avatar;
  const tags = item.tags?.map((t: any) => t.name || t) || [];
  const category = item.category?.name || item.category;

  return {
    id: String(item.id),
    documentId: String(item.id),
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt || "",
    body: item.content || "",
    date: item.publishedAt || item.createdAt || "",
    image,
    author: authorName ? { name: authorName, avatar: authorAvatar } : undefined,
    tags,
    category,
    seo: {
      metaTitle: item.metaTitle || item.title,
      metaDescription: item.metaDescription,
      keywords: item.metaKeywords,
      canonicalURL: item.canonicalUrl,
    },
  };
}

export async function getPosts({ page = 1, pageSize = 10, sort, filters, language }: { page?: number; pageSize?: number; sort?: any; filters?: any; language?: string } = {}) {
  // MERN backend support
  if (config.backendType === 'mern') {
    const { field, order } = normalizeSort(sort, 'publishedAt');
    const params: Record<string, any> = {
      page,
      limit: pageSize,
      sort: field,
      order,
      status: 'published',
      ...extractArticleFilterParams(filters),
    };

    if (language) {
      params.language = language;
    }

    const data = await fetchMern<{ data?: any[]; meta?: any }>("/articles", params);
    const items = Array.isArray((data as any)?.data) ? ((data as any).data as any[]) : [];
    const posts = items.map(mapMernPost);
    const total = (data as any)?.meta?.total ?? posts.length;
    const meta = toStrapiMeta((data as any)?.meta, page, pageSize, total);
    return { posts, meta };
  }

  // Strapi backend (original code)
  const combinedFilters = {
    ...(filters || {}),
    ...(language ? { language: { $eq: language } } : {})
  };

  const params = {
    populate: { 
      author: true, 
      category: true,  // Changé de categories à category
      tags: true, 
      featured_image: true, 
      seo: { populate: { ogImage: true, twitterImage: true } }  // Changé og_image vers seo.ogImage
    },
    sort: sort || { publishedAt: "desc" },  // Changé de published_att à publishedAt
    pagination: { page, pageSize },
    publicationState: "live",
    ...(Object.keys(combinedFilters).length > 0 ? { filters: combinedFilters } : {}),
  };

  const data = await fetchStrapi<{ data: any[]; meta: any }>("/articles", params);  // Changé de /posts à /articles
  const posts = (data.data || []).map(mapStrapiPost);
  return { posts, meta: data.meta };
}

export async function getPostBySlug(slug: string) {
  // MERN backend support
  if (config.backendType === 'mern') {
    const data = await fetchMern<any>(`/articles/slug/${encodeURIComponent(slug)}`);
    if (!data) return null;
    return mapMernPost(data);
  }

  // Strapi backend (original code)
  const params = {
    populate: { 
      author: true, 
      category: true,  // Changé de categories à category
      tags: true, 
      featured_image: true, 
      seo: { populate: { ogImage: true, twitterImage: true } }  // Changé og_image vers seo.ogImage
    },
    filters: { slug: { $eq: slug } },
    publicationState: "live",
  };

  const data = await fetchStrapi<{ data: any[] }>("/articles", params);  // Changé de /posts à /articles
  const item = data.data?.[0];
  return item ? mapStrapiPost(item) : null;
}

export async function getPostById(id: string | number) {
  const idStr = String(id);
  const isNumeric = /^\d+$/.test(idStr);
  if (config.backendType === 'mern') {
    const data = await fetchMern<any>(`/articles/${encodeURIComponent(idStr)}`);
    return data ? mapMernPost(data) : null;
  }
  const orConds: any[] = [{ documentId: { $eq: idStr } }];
  if (isNumeric) {
    orConds.unshift({ id: { $eq: Number(idStr) } });
  }
  const params = {
    populate: { author: true, categories: true, tags: true, featured_image: true, og_image: true },
    filters: { $or: orConds },
    publicationState: "live",
  };
  const data = await fetchStrapi<{ data: any[] }>(`/posts`, params);
  const item = data?.data?.[0];
  return item ? mapStrapiPost(item) : null;
}

// Map Strapi project
function mapStrapiProject(item: any): Project {
  const p: StrapiProject = item;
  const image = p.seo?.ogImage
    ? getImageUrl(p.seo.ogImage as any, "medium")
    : p.featured_image
    ? getImageUrl(p.featured_image, "medium")
    : undefined;
  const technologies: string[] = Array.isArray(p.technologies)
    ? (p.technologies as any[]).map((t) => (typeof t === "string" ? t : t?.name || ""))
    : typeof p.technologies === "string"
    ? p.technologies.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const authorName = p.author?.username || p.author?.email;

  return {
    id: String(p.id),
    documentId: String(p.documentId || p.id),
    title: p.title,
    description: p.description || p.excerpt || "",
    content: p.description || "",
    slug: p.slug,
    url: p.live_url || p.demo_url || "",  // Nouveau champs
    date: p.publishedAt || p.completion_date || "",  // Nouveau champs
    status_at: p.status,  // Nouveau enum
    start_date: p.completion_date,
    end_date: p.completion_date,
    category: p.category?.name || "",
    featured: p.status === "featured",  // Nouveau statut
    image,
    featured_image: image,
    technologies,
    github: p.github_url || "",
    github_url: p.github_url || "",
    demo: p.demo_url || "",
    demo_url: p.demo_url || "",
    tags: p.tags?.map((t) => t.name) || [],
    author: authorName ? {
      name: authorName,
      avatar: p.author?.avatar ? getImageUrl(p.author.avatar, "thumbnail") : undefined,
    } : undefined,
    seo: {
      metaTitle: p.seo?.metaTitle || p.title,  // Nouveau composant SEO
      metaDescription: p.seo?.metaDescription,
      keywords: p.seo?.keywords,
      canonicalURL: p.seo?.canonicalUrl,
    },
  };
}

// Map MERN project to frontend Project
function mapMernProject(item: any): Project {
  const image = item.coverImage || item.featuredImage?.url || item.featuredImage;
  const authorName = item.author?.username || item.author?.email || [item.author?.firstName, item.author?.lastName].filter(Boolean).join(' ').trim();
  const authorAvatar = item.author?.avatar?.url || item.author?.avatar;
  const technologies: string[] = Array.isArray(item.technologies)
    ? item.technologies.map((t: any) => (typeof t === "string" ? t : t?.name || ""))
    : typeof item.technologies === "string"
    ? item.technologies.split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];
  const tags = item.tags?.map((t: any) => t.name || t) || [];

  return {
    id: String(item.id),
    documentId: String(item.id),
    title: item.title,
    description: item.description || item.excerpt || "",
    content: item.content || item.description || "",
    slug: item.slug,
    url: item.liveUrl || item.demoUrl || "",
    date: item.createdAt || "",
    status_at: item.status,
    start_date: item.startDate,
    end_date: item.endDate,
    category: item.category?.name || item.category || "",
    featured: item.status === "featured" || item.isPublished === true,
    image,
    featured_image: image,
    technologies,
    github: item.githubUrl || "",
    github_url: item.githubUrl || "",
    demo: item.demoUrl || "",
    demo_url: item.demoUrl || "",
    tags,
    author: authorName ? {
      name: authorName,
      avatar: authorAvatar,
    } : undefined,
    seo: {
      metaTitle: item.metaTitle || item.title,
      metaDescription: item.metaDescription,
      keywords: item.metaKeywords,
      canonicalURL: item.canonicalUrl,
    },
  };
}

export async function getProjects({ page = 1, pageSize = 12, sort, filters, language }: { page?: number; pageSize?: number; sort?: any; filters?: any; language?: string } = {}) {
  // MERN backend support
  if (config.backendType === 'mern') {
    const { field, order } = normalizeSort(sort, 'createdAt');
    const params: Record<string, any> = {
      page,
      limit: pageSize,
      sort: field,
      order,
      status: 'published',
      ...extractProjectFilterParams(filters),
    };

    if (language) {
      params.language = language;
    }

    const data = await fetchMern<{ data?: any[]; meta?: any }>("/projects", params);
    const items = Array.isArray((data as any)?.data) ? ((data as any).data as any[]) : [];
    const projects = items.map(mapMernProject);
    const total = (data as any)?.meta?.total ?? projects.length;
    const meta = toStrapiMeta((data as any)?.meta, page, pageSize, total);
    return { projects, meta };
  }

  // Strapi backend (original code)
  const combinedFilters = {
    ...(filters || {}),
    ...(language ? { language: { $eq: language } } : {})
  };

  const params = {
    populate: { 
      author: true, 
      category: true, 
      tags: true, 
      featured_image: true, 
      gallery: true,
      seo: { populate: { ogImage: true, twitterImage: true } }
    },
    sort: sort || { publishedAt: "desc" },  // Changé de start_date à publishedAt
    pagination: { page, pageSize },
    publicationState: "live",
    ...(Object.keys(combinedFilters).length > 0 ? { filters: combinedFilters } : {}),
  };
  const data = await fetchStrapi<{ data: any[]; meta: any }>("/projects", params);
  const projects = (data.data || []).map(mapStrapiProject);
  return { projects, meta: data.meta };
}

export async function getProjectBySlug(slug: string) {
  // MERN backend support
  if (config.backendType === 'mern') {
    const data = await fetchMern<any>(`/projects/slug/${encodeURIComponent(slug)}`);
    if (!data) return null;
    return mapMernProject(data);
  }

  // Strapi backend (original code)
  const params = {
    populate: { 
      author: true, 
      category: true, 
      tags: true, 
      featured_image: true, 
      gallery: true,
      seo: { populate: { ogImage: true, twitterImage: true } }
    },
    filters: { slug: { $eq: slug } },
    publicationState: "live",
  };
  const data = await fetchStrapi<{ data: any[] }>("/projects", params);
  const item = data.data?.[0];
  return item ? mapStrapiProject(item) : null;
}
