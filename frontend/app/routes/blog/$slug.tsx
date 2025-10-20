import { useLoaderData, Link } from "react-router";
import { config, generateMetaTags, formatDate, getResponsiveAttrs } from "~/lib/utils";
import { useI18n } from "~/i18n";
import { getPostBySlug, getPosts } from "~/lib/api";
import { MarkdownRenderer } from "~/components/MarkdownRenderer";
import { renderMarkdown } from "~/lib/markdown.server";
import { normalizeContent } from "~/lib/content.server";
import { useArticleAnalytics } from "~/hooks/useAnalytics";
import SocialShare from "~/components/SocialShare";

export async function loader({ params }: any) {
  const slug = params.slug as string;
  const post = await getPostBySlug(slug);
  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }
  // Normalize and render markdown server-side when content available
  const normalizedBody = normalizeContent(post.body);
  const md = normalizedBody.trim().length
    ? await renderMarkdown(normalizedBody, 'github-light')
    : { html: '', toc: [] };
  // Prev/Next: find neighbors by date
  let prev: any = null;
  let next: any = null;
  if (post.date) {
    const newer = await getPosts({ page: 1, pageSize: 1, sort: { publishedAt: 'asc' }, filters: { publishedAt: { $gt: post.date } } });
    const older = await getPosts({ page: 1, pageSize: 1, sort: { publishedAt: 'desc' }, filters: { publishedAt: { $lt: post.date } } });
    next = newer.posts?.[0] || null; // next chronologically newer
    prev = older.posts?.[0] || null; // previous older
  }
  return { post, md, prev, next };
}

export function meta({ data }: any) {
  const p = data?.post;
  const title = p?.seo?.metaTitle || p?.title || "Post";
  const description = p?.seo?.metaDescription || p?.excerpt || "";
  const image = p?.image;
  const url = p?.slug ? `${config.siteUrl}/blog/${p.slug}` : config.siteUrl;
  return generateMetaTags({
    title,
    description,
    image,
    url,
    type: "article",
    canonicalURL: p?.seo?.canonicalURL,
    keywords: p?.seo?.keywords,
  });
}

export function headers() {
  // Individual posts can be cached a bit longer since content changes are rarer
  return {
    "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
  };
}

export default function BlogPostSlug() {
  const { t } = useI18n();
  const { post, md, prev, next } = useLoaderData<{ post: any; md: any; prev?: any; next?: any }>();
  
  // Analytics tracking pour cet article
  useArticleAnalytics({
    id: post.documentId || post.id || post.slug,
    title: post.title,
    category: post.category?.name,
    author: post.author?.name,
    readingTime: post.body ? Math.ceil(post.body.length / 1000) : undefined // Estimation simple
  });
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.excerpt || '',
    image: post.image ? [post.image] : undefined,
    author: post.author?.name ? { '@type': 'Person', name: post.author.name } : undefined,
    datePublished: post.date || undefined,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${config.siteUrl}/blog/${post.slug}`,
    },
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: `${config.siteUrl}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${config.siteUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${config.siteUrl}/blog/${post.slug}`,
      },
    ],
  };
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      
      {/* Header avec navigation */}
  <div id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Accueil
            </Link>
            <span>›</span>
            <Link to="/blog" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {t("common.blog", "Blog")}
            </Link>
            <span>›</span>
            <span className="text-gray-900 dark:text-white">{post.title}</span>
          </nav>
          
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {post.title}
            </h1>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
            {post.author?.name && (
              <span>Par {post.author.name}</span>
            )}
            {post.date && (
              <span>{formatDate(post.date)}</span>
            )}
          </div>

          {/* Summary/Excerpt - Affichage élégant */}
          {post.excerpt && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-l-4 border-blue-500">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 uppercase tracking-wide mb-2">
                    En bref
                  </h3>
                  <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
                    {post.excerpt}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Image principale */}
        {post.image && (
          <div className="mb-8">
            <img 
              {...getResponsiveAttrs((post as any).featured_image || (post as any).og_image || { url: post.image })}
              alt={post.title}
              className="w-full h-64 md:h-80 object-cover rounded-xl shadow-lg"
              loading="lazy" decoding="async"
            />
          </div>
        )}
        
        {/* Contenu Markdown avec table des matières (SSR) */}
        <MarkdownRenderer html={md.html} toc={md.toc} showToc={true} />

        {/* Partage social */}
        <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <SocialShare
            url={`${config.siteUrl}/blog/${post.slug}`}
            title={post.title}
            description={post.excerpt}
            articleId={post.documentId || post.id || post.slug}
            className="justify-center"
          />
        </div>

        {/* Prev/Next navigation */}
        {(prev || next) && (
          <div className="mt-12 border-t pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {prev ? (
              <Link to={prev.slug ? `/blog/${prev.slug}` : `/blog/post?id=${prev.documentId || prev.id}`}
                className="btn-secondary">
                ← Article précédent
              </Link>
            ) : <span />}
            {next && (
              <Link to={next.slug ? `/blog/${next.slug}` : `/blog/post?id=${next.documentId || next.id}`}
                className="btn-secondary">
                Article suivant →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
