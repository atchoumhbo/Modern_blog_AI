import type { Route } from "./+types/index";
import { Link, useLoaderData, useSearchParams } from "react-router";
import { config, generateMetaTags, formatDate, getReadingTime, getResponsiveAttrs } from "~/lib/utils";
import { useI18n } from "~/i18n";
import type { Post } from "~/lib/types";
import { getPosts } from "~/lib/api";
import { QuickNav } from "~/components/QuickNav";
import { usePosts } from "~/hooks/useApi";
import { useEffect } from "react";

export function meta({ data }: Route.MetaArgs) {
  const base = `${config.siteUrl}/blog`;
  const page = data?.meta?.pagination?.page || 1;
  const pageCount = data?.meta?.pagination?.pageCount || 1;
  const canonicalURL = page > 1 ? `${base}?page=${page}` : base;
  const tags = generateMetaTags({
    title: "Blog - Modern Blog Leader",
    description: "Discover the latest insights, tutorials, and thoughts on modern web development and technology.",
    canonicalURL,
    keywords: "blog, articles, tutorials, web development, javascript, react"
  });
  const extra: any[] = [];
  if (page > 1) extra.push({ rel: 'prev', href: `${base}?page=${page - 1}` });
  if (page < pageCount) extra.push({ rel: 'next', href: `${base}?page=${page + 1}` });
  return [...tags, ...extra];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = 10;
  const { posts, meta } = await getPosts({ page, pageSize });
  return { posts, meta };
}

export default function BlogIndex() {
  const { t, locale } = useI18n();
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  
  // Utilisation hybride : loader pour SSR, TanStack Query pour client-side
  const { 
    data: queryData, 
    isLoading,
    error 
  } = usePosts({ 
    page: currentPage, 
    pageSize: 10,
    language: locale // Filtrer par langue actuelle
  });

  // Utiliser les données de TanStack Query si disponibles, sinon fallback sur loader
  const posts = queryData?.posts || loaderData.posts;
  const meta = queryData?.meta || loaderData.meta;
  const page = meta?.pagination?.page || currentPage;
  const pageCount = meta?.pagination?.pageCount || 1;
  
  // Premier post comme featured
  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-fade-in">
            {/* Page indicator with TanStack Query status */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-6">
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              )}
              {t("common.blog", "Blog")}
              {queryData && (
                <span className="ml-1 text-xs opacity-75">⚡</span>
              )}
            </div>

            <QuickNav />
            
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6 mt-8">
              {t("blog.title").split(' ')[0]} <span className="text-gradient">{t("blog.title").split(' ')[1]}</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              {t("blog.subtitle", "Discover the latest articles, tutorials, and insights on modern web development")}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">

      {posts.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t("blog.noneTitle")}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t("blog.noneDesc")}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Featured Post - Grand format */}
          {featuredPost && (
            <article className="card card-featured">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  {featuredPost.image && (
                    <img 
                      {...getResponsiveAttrs((featuredPost as any).featured_image || (featuredPost as any).og_image || { url: featuredPost.image })}
                      alt={featuredPost.title}
                      className="w-full h-80 object-cover rounded-lg shadow-lg"
                      loading="lazy" decoding="async"
                    />
                  )}
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full mb-4">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    {t("blog.featuredArticle")}
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                    {featuredPost.slug ? (
                      <Link to={`/blog/${featuredPost.slug}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {featuredPost.title}
                      </Link>
                    ) : (
                      <Link to={`/blog/post?id=${featuredPost.documentId || featuredPost.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {featuredPost.title}
                      </Link>
                    )}
                  </h2>
                  <div className="post-meta">
                    {featuredPost.author?.name && (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                        </svg>
                        {featuredPost.author.name}
                      </span>
                    )}
                    {featuredPost.date && (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                        </svg>
                        {formatDate(featuredPost.date)}
                      </span>
                    )}
                    {featuredPost.body && (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                        </svg>
                        {getReadingTime(featuredPost.body)} {t("blog.minutes", "min")}
                      </span>
                    )}
                  </div>
                  {featuredPost.excerpt && (
                    <p className="post-excerpt text-lg">
                      {featuredPost.excerpt}
                    </p>
                  )}
                  {featuredPost.tags && featuredPost.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {featuredPost.tags.map((tag) => (
                        <span key={tag} className="tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-4">
                    {featuredPost.slug ? (
                      <Link to={`/blog/${featuredPost.slug}`} className="btn-primary">
                        Lire l'article
                      </Link>
                    ) : (
                      <Link to={`/blog/post?id=${featuredPost.documentId || featuredPost.id}`} className="btn-primary">
                        Lire l'article
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* Autres articles - Grid */}
          {remainingPosts.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">{t("blog.more")}</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {remainingPosts.map((post: Post) => (
                  <article key={post.id} className="card group">
                    {post.image && (
                      <div className="relative overflow-hidden rounded-lg mb-4">
                        <img 
                          {...getResponsiveAttrs((post as any).featured_image || (post as any).og_image || { url: post.image })}
                          alt={post.title}
                          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy" decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    )}
                    <h2 className="post-title">
                      {post.slug ? (
                        <Link to={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      ) : (
                        <Link to={`/blog/post?id=${post.documentId || post.id}`}>
                          {post.title}
                        </Link>
                      )}
                    </h2>
                    <div className="post-meta text-xs">
                      {post.author?.name && <span>By {post.author.name}</span>}
                      {post.date && <span>• {formatDate(post.date)}</span>}
                      {post.body && <span>• {getReadingTime(post.body)} min</span>}
                    </div>
                    {post.excerpt && (
                      <p className="post-excerpt">
                        {post.excerpt.length > 120 ? `${post.excerpt.slice(0, 120)}...` : post.excerpt}
                      </p>
                    )}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="tag text-xs">
                            #{tag}
                          </span>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="text-xs text-gray-400">+{post.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                    <div>
                      {post.slug ? (
                        <Link to={`/blog/${post.slug}`} className="read-more-btn">
                          Lire la suite
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                          </svg>
                        </Link>
                      ) : (
                        <Link to={`/blog/post?id=${post.documentId || post.id}`} className="read-more-btn">
                          Lire la suite
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                          </svg>
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>
              {/* Pagination controls */}
              <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
                <Link
                  to={`?page=1`}
                  className={`btn-secondary ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                  aria-disabled={page <= 1}
                >
                  Première
                </Link>
                <Link
                  to={`?page=${Math.max(1, page - 1)}`}
                  className={`btn-secondary ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                  aria-disabled={page <= 1}
                >
                  Précédent
                </Link>
                <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} / {pageCount}</span>
                <Link
                  to={`?page=${Math.min(pageCount, page + 1)}`}
                  className={`btn-secondary ${page >= pageCount ? 'pointer-events-none opacity-50' : ''}`}
                  aria-disabled={page >= pageCount}
                >
                  Suivant
                </Link>
                <Link
                  to={`?page=${pageCount}`}
                  className={`btn-secondary ${page >= pageCount ? 'pointer-events-none opacity-50' : ''}`}
                  aria-disabled={page >= pageCount}
                >
                  Dernière
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
        </div>
      </section>
    </div>
  );
}

export function headers(_: Route.HeadersArgs) {
  // Cache list pages briefly; vary by URL (includes ?page). React Router handles that via route instance
  return {
    "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  };
}