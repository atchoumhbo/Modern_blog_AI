// Strapi API Response Types
export interface StrapiResponse<T> {
  data: T[]
  meta: {
    pagination: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

export interface StrapiSingleResponse<T> {
  data: T
  meta: {}
}

// Blog Post Types
export interface StrapiPost {
  id: string
  documentId?: string
  title: string
  slug: string
  excerpt?: string
  content?: string
  publishedAt?: string  // Changé de published_att à publishedAt
  createdAt?: string
  readingTime?: number
  viewCount?: number
  status?: 'draft' | 'published' | 'scheduled'
  featured_image?: {
    url: string
    formats?: {
      thumbnail?: { url: string }
      small?: { url: string }
      medium?: { url: string }
      large?: { url: string }
    }
  }
  seo?: {  // Nouveau composant SEO
    metaTitle?: string
    metaDescription?: string
    keywords?: string
    canonicalUrl?: string
    preventIndexing?: boolean
    ogImage?: {
      url: string
      formats?: Record<string, { url: string }>
    }
    twitterImage?: {
      url: string
      formats?: Record<string, { url: string }>
    }
  }
  schema?: {  // Nouveau composant Schema
    type?: 'Article' | 'BlogPosting' | 'NewsArticle'
    headline?: string
    datePublished?: string
    dateModified?: string
    wordCount?: number
  }
  author?: {
    username?: string  // Users plugin
    email?: string
    avatar?: { url: string; formats?: Record<string, { url: string }> }
  }
  tags?: Array<{
    id: string
    name: string
    slug: string
    color?: string
  }>
  category?: {  // Changé de categories (array) à category (single)
    id: string
    name: string
    slug: string
    color?: string
  }
}

export interface Post {
  id: string
  documentId: string
  title: string
  slug: string
  excerpt: string
  body: string
  date: string
  image?: string
  author?: {
    name: string
    avatar?: string
  }
  tags?: string[]
  category?: string
  seo?: {
    metaTitle?: string
    metaDescription?: string
    keywords?: string
    canonicalURL?: string
  }
}

// Project Types
export interface StrapiProject {
  id: string
  documentId?: string
  title: string
  slug: string
  description?: string
  excerpt?: string
  publishedAt?: string
  createdAt?: string
  viewCount?: number
  likes?: number
  status?: 'draft' | 'published' | 'featured'
  project_type?: 'web' | 'mobile' | 'desktop' | 'api' | 'library' | 'other'
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  completion_date?: string
  github_url?: string
  live_url?: string
  demo_url?: string
  technologies?: any // JSON field
  featured_image?: {
    url: string
    formats?: {
      thumbnail?: { url: string }
      small?: { url: string }
      medium?: { url: string }
      large?: { url: string }
    }
  }
  gallery?: Array<{ 
    url: string; 
    formats?: Record<string, { url: string }> 
  }>
  seo?: {  // Composant SEO réutilisable
    metaTitle?: string
    metaDescription?: string
    keywords?: string
    canonicalUrl?: string
    preventIndexing?: boolean
    ogImage?: {
      url: string
      formats?: Record<string, { url: string }>
    }
    twitterImage?: {
      url: string
      formats?: Record<string, { url: string }>
    }
  }
  schema?: {  // Composant Schema
    type?: 'Article' | 'BlogPosting' | 'NewsArticle'
    headline?: string
    datePublished?: string
    dateModified?: string
    wordCount?: number
  }
  author?: { 
    username?: string
    email?: string
    avatar?: { url: string; formats?: Record<string, { url: string }> }
  }
  category?: { 
    id: string
    name: string
    slug: string
    color?: string
  }
  tags?: Array<{ 
    id: string
    name: string
    slug: string
    color?: string
  }>
}

export interface Project {
  id: string
  documentId: string
  title: string
  description: string
  content?: string
  url: string
  date: string
  status_at?: string
  start_date?: string
  end_date?: string
  category: string
  featured: boolean
  image?: string
  featured_image?: string
  technologies?: string[]
  github?: string
  github_url?: string
  demo?: string
  demo_url?: string
  slug?: string
  tags?: string[]
  author?: {
    name: string
    avatar?: string
  }
  seo?: {
    metaTitle?: string
    metaDescription?: string
    keywords?: string
    canonicalURL?: string
  }
}

// Navigation Types
export interface NavItem {
  name: string
  href: string
  icon?: React.ComponentType
  children?: NavItem[]
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system'

// Search Types
export interface SearchResult {
  type: 'post' | 'project'
  id: string
  title: string
  excerpt?: string
  url: string
  image?: string
}

// Analytics Types (pour les futures fonctionnalités)
export interface Analytics {
  views: number
  uniqueVisitors: number
  averageTime: number
  bounceRate: number
  topPages: Array<{
    path: string
    views: number
  }>
}

// Newsletter Types
export interface NewsletterSubscription {
  email: string
  preferences: {
    weekly: boolean
    monthly: boolean
    announcements: boolean
  }
  status: 'active' | 'pending' | 'unsubscribed'
}

// Comment Types (pour les futures fonctionnalités)
export interface Comment {
  id: string
  author: string
  email: string
  content: string
  date: string
  approved: boolean
  parentId?: string
  replies?: Comment[]
}

// AI Content Types (pour l'intégration future)
export interface AIContentSuggestion {
  title: string
  excerpt: string
  tags: string[]
  estimatedReadTime: number
  seoScore: number
}