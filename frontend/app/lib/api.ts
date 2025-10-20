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
  const image = item.featuredImage?.url || item.featuredImage;
  const authorName = item.author?.name || item.author?.email;
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
      keywords: item.keywords,
      canonicalURL: item.canonicalUrl,
    },
  };
}

export async function getPosts({ page = 1, pageSize = 10, sort, filters, language }: { page?: number; pageSize?: number; sort?: any; filters?: any; language?: string } = {}) {
  // MERN backend support
  if (config.backendType === 'mern') {
    const params: Record<string, any> = {
      page,
      limit: pageSize,
      sort: sort?.publishedAt ? 'publishedAt' : (sort?.createdAt ? 'createdAt' : 'publishedAt'),
      order: (typeof sort?.publishedAt === 'string' ? sort.publishedAt : 'desc'),
    };

    // Add filters if present
    if (filters) {
      if (filters.title?.$contains) params.search = filters.title.$contains;
      if (filters.category?.id) params.category = filters.category.id;
      if (filters.slug?.$eq) params.slug = filters.slug.$eq;
      if (language) params.language = language;
    } else if (language) {
      params.language = language;
    }

    const data = await fetchMern<{ data: any[]; meta: any }>("/articles", params);
    const posts = (data.data || []).map(mapMernPost);
    return { posts, meta: data.meta };
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
    const params = { slug };
    const data = await fetchMern<{ data: any[] }>("/articles", params);
    const item = data.data?.[0];
    return item ? mapMernPost(item) : null;
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
  const image = item.featuredImage?.url || item.featuredImage;
  const authorName = item.author?.name || item.author?.email;
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
    featured: item.status === "featured",
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
      keywords: item.keywords,
      canonicalURL: item.canonicalUrl,
    },
  };
}

export async function getProjects({ page = 1, pageSize = 12, sort, filters, language }: { page?: number; pageSize?: number; sort?: any; filters?: any; language?: string } = {}) {
  // MERN backend support
  if (config.backendType === 'mern') {
    const params: Record<string, any> = {
      page,
      limit: pageSize,
      sort: sort?.publishedAt ? 'publishedAt' : (sort?.createdAt ? 'createdAt' : 'createdAt'),
      order: (typeof sort?.publishedAt === 'string' ? sort.publishedAt : 'desc'),
    };

    // Add filters if present
    if (filters) {
      if (filters.title?.$contains) params.search = filters.title.$contains;
      if (filters.category?.id) params.category = filters.category.id;
      if (filters.slug?.$eq) params.slug = filters.slug.$eq;
      if (filters.status) params.status = filters.status;
      if (language) params.language = language;
    } else if (language) {
      params.language = language;
    }

    const data = await fetchMern<{ data: any[]; meta: any }>("/projects", params);
    const projects = (data.data || []).map(mapMernProject);
    return { projects, meta: data.meta };
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
    const params = { slug };
    const data = await fetchMern<{ data: any[] }>("/projects", params);
    const item = data.data?.[0];
    return item ? mapMernProject(item) : null;
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
