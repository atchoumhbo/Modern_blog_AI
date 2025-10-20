import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date for display
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Calculate reading time
export function getReadingTime(text: string): number {
  const wordsPerMinute = 200
  const words = text.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}

// Truncate text
export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text
  return text.substring(0, length).replace(/\s+\S*$/, '') + '...'
}

// Get image URL with fallback
export function getImageUrl(image: any, format: string = 'medium'): string {
  if (!image) return '/images/placeholder.jpg'
  
  if (typeof image === 'string') return image
  
  if (image.formats && image.formats[format]) {
    const url = image.formats[format].url
    return url.startsWith('/') ? `${config.strapiPublicUrl}${url}` : url
  }
  
  const url = image.url || '/images/placeholder.jpg'
  return url.startsWith('/') ? `${config.strapiPublicUrl}${url}` : url
}

// Build responsive image attributes (src, srcSet, sizes) from Strapi formats when available
export function getResponsiveAttrs(image: any, defaultFormat: string = 'medium') {
  const toAbs = (u: string) => (u?.startsWith('/') ? `${config.strapiPublicUrl}${u}` : u);
  if (!image) return {} as { src?: string; srcSet?: string; sizes?: string };
  if (typeof image === 'string') return { src: image } as const;

  const formats = (image && image.formats) || {};
  const variants: Array<{ url: string; width?: number }> = [];
  for (const key of Object.keys(formats)) {
    const f = (formats as any)[key];
    if (f?.url) variants.push({ url: toAbs(f.url), width: typeof f.width === 'number' ? f.width : undefined });
  }
  if (image.url) variants.push({ url: toAbs(image.url), width: typeof (image as any).width === 'number' ? (image as any).width : undefined });

  const withWidths = variants.filter(v => typeof v.width === 'number') as Array<{ url: string; width: number }>;
  const srcSet = withWidths.length ? withWidths.sort((a,b)=>a.width-b.width).map(v => `${v.url} ${v.width}w`).join(', ') : undefined;

  let src: string | undefined = undefined;
  if (formats && (formats as any)[defaultFormat]?.url) src = toAbs((formats as any)[defaultFormat].url);
  if (!src && withWidths.length) src = withWidths.sort((a,b)=>b.width-a.width)[0].url;
  if (!src && image.url) src = toAbs(image.url);
  if (!src) src = '/images/placeholder.jpg';

  // Generic sizes; safe defaults that don't alter layout
  const sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px';
  return { src, srcSet, sizes };
}

// Environment configuration
const ENV = (import.meta as any).env || {};

// Detect backend type (strapi or mern)
const BACKEND_TYPE = ENV.VITE_BACKEND_TYPE || 'mern';

// For SSR (server-side rendering inside Docker), we need to use the internal Docker service name
// For client-side (browser), we use the external URL via Nginx
const isServer = import.meta.env.SSR;

// Backend URLs based on type
let BACKEND_URL_SERVER: string;
let BACKEND_URL_CLIENT: string;

if (BACKEND_TYPE === 'mern') {
  // MERN backend URLs
  BACKEND_URL_SERVER = ENV.VITE_BACKEND_URL_SERVER || 'http://blog-backend:3000'; // Internal Docker
  BACKEND_URL_CLIENT = ENV.VITE_API_URL?.replace('/api', '') || 'https://blog.bh-systems.be'; // External via Nginx
} else {
  // Strapi backend URLs (legacy)
  BACKEND_URL_SERVER = ENV.VITE_STRAPI_URL_SERVER || 'http://strapi:1337';
  BACKEND_URL_CLIENT = ENV.VITE_STRAPI_URL || 'http://localhost:1337';
}

// API URL: Use server URL in SSR, client URL in browser
const BACKEND_URL = isServer ? BACKEND_URL_SERVER : BACKEND_URL_CLIENT;

// PUBLIC URL: Always use client URL for images, CSS, etc. (loaded by browser)
const BACKEND_PUBLIC_URL = BACKEND_URL_CLIENT;

// Build API_URL
const API_URL = BACKEND_TYPE === 'mern' 
  ? `${BACKEND_URL}/api`  // MERN uses /api prefix
  : `${BACKEND_URL}/api`; // Strapi also uses /api

const TWITTER_HANDLE = ENV.VITE_TWITTER_HANDLE || undefined;
// i18n config (minimal): read locales and default from env; fallback to single 'fr'
// Try dynamic discovery fallback if available via Vite (kept lazy to avoid import cycle)
const RAW_LOCALES = (ENV.VITE_LOCALES || 'fr').toString();
const LOCALES = RAW_LOCALES.split(',').map((s: string) => s.trim()).filter(Boolean);
const DEFAULT_LOCALE = (ENV.VITE_DEFAULT_LOCALE || LOCALES[0] || 'fr').toString();

export const config = {
  backendType: BACKEND_TYPE,
  strapiUrl: BACKEND_URL, // For API requests (SSR-aware) - kept name for compatibility
  strapiPublicUrl: BACKEND_PUBLIC_URL, // For images, CSS, etc. - kept name for compatibility
  apiUrl: API_URL,
  siteUrl: ENV.VITE_SITE_URL || 'http://localhost:5190',
  siteName: 'Modern Blog Leader',
  siteDescription: 'The ultimate modern blog with AI-powered content and cutting-edge design',
  siteTwitter: TWITTER_HANDLE,
  locales: LOCALES as string[],
  defaultLocale: DEFAULT_LOCALE as string,
}

// SEO helpers
export function generateMetaTags(data: {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
  canonicalURL?: string
  keywords?: string
}) {
  const {
    title = config.siteName,
    description = config.siteDescription,
    image = `${config.siteUrl}/images/og-default.jpg`,
    url = config.siteUrl,
    type = 'website',
    canonicalURL,
    keywords,
  } = data

  const canonical = canonicalURL || url;

  // Build hreflang alternates (minimal: same URL for each locale pathless; future: prefix paths)
  const alternates: Array<{ rel: 'alternate'; hrefLang: string; href: string }> = [];
  if (canonical) {
    // For now we don't have locale-prefixed routes, so use same canonical URL for each available locale
    for (const locale of config.locales) {
      alternates.push({ rel: 'alternate', hrefLang: locale, href: canonical });
    }
    // x-default to canonical as well
    alternates.push({ rel: 'alternate', hrefLang: 'x-default', href: canonical });
  }

  return [
    { title },
    { name: 'description', content: description },
    ...(keywords ? [{ name: 'keywords', content: keywords }] : []),
    ...(canonical ? [{ rel: 'canonical', href: canonical } as any] : []),
    ...alternates,
    { property: 'og:site_name', content: config.siteName },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:url', content: url },
    { property: 'og:type', content: type },
    { name: 'twitter:card', content: 'summary_large_image' },
    ...(config.siteTwitter ? [{ name: 'twitter:site', content: config.siteTwitter }] : []),
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
  ]
}

// Analytics helpers (for future implementation)
export function trackEvent(event: string, properties?: Record<string, any>) {
  // Integration with analytics service will be added later
  if ((import.meta as any).env?.DEV) {
    console.log('Analytics Event:', event, properties)
  }
}

// Performance helpers
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Local storage helpers with error handling
export const storage = {
  get: (key: string, defaultValue: any = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error)
    }
  }
}