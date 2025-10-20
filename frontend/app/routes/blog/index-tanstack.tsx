import type { Route } from "./+types/index";
import { Link, useSearchParams } from "react-router";
import { config, generateMetaTags, formatDate, getReadingTime, getResponsiveAttrs } from "~/lib/utils";
import { useI18n } from "~/i18n";
import { usePosts } from "~/hooks/useApi";
import { QuickNav } from "~/components/QuickNav";
import { motion } from "framer-motion";
import { Suspense } from "react";
import type { Post } from "~/lib/types";

export function meta({ data }: Route.MetaArgs) {
  const base = `${config.siteUrl}/blog`;
  const page = data?.page || 1;
  const canonicalURL = page > 1 ? `${base}?page=${page}` : base;
  const tags = generateMetaTags({
    title: "Blog - Modern Blog Leader",
    description: "Discover the latest insights, tutorials, and thoughts on modern web development and technology.",
    canonicalURL,
    keywords: "blog, articles, tutorials, web development, javascript, react"
  });
  
  return tags;
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  return { page };
}

function BlogContent() {
  const { t, locale } = useI18n();
  const [searchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = 10;

  const { 
    data: response,
    isLoading,
    error,
    isError
  } = usePosts({
    page,
    pageSize,
    language: locale
  });

  const posts = response?.posts || [];
  const meta = response?.meta;
  const pageCount = meta?.pagination?.pageCount || 1;
  
  // Premier post comme featured
  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError || !posts.length) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {isError ? 'Erreur de chargement' : 'Aucun article trouvé'}
          </h2>
          {isError && error && (
            <p className="text-red-600 dark:text-red-400 mb-4">
              {error.message || 'Une erreur est survenue lors du chargement des articles.'}
            </p>
          )}
          <Link 
            to="/" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Page indicator */}
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium mb-4">
              <span className="h-2 w-2 bg-blue-600 rounded-full mr-2"></span>
              {t('blog.title')}
              {page > 1 && (
                <>
                  <span className="mx-2">•</span>
                  Page {page}
                </>
              )}
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              {t('blog.heroTitle')}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              {t('blog.heroDescription')}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-6 text-gray-600 dark:text-gray-300">
              <div className="flex items-center">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                {posts.length} {t('blog.articlesAvailable')}
              </div>
              <div className="flex items-center">
                <span className="h-2 w-2 bg-blue-500 rounded-full mr-2"></span>
                {meta?.pagination?.total || 0} {t('blog.totalArticles')}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Featured Post */}
        {featuredPost && (
          <motion.section 
            className="py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="mb-8">
              <div className="flex items-center">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-600"></span>
                <span className="px-6 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {t('blog.featuredArticle')}
                </span>
                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-600"></span>
              </div>
            </div>

            <article className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <Link to={`/blog/${featuredPost.slug}`}>
                <div className="lg:flex">
                  {/* Image */}
                  {featuredPost.image && (
                    <div className="lg:w-1/2">
                      <div className="aspect-w-16 aspect-h-9 lg:aspect-none lg:h-full">
                        <img
                          src={featuredPost.image}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className={`p-8 ${featuredPost.image ? 'lg:w-1/2' : 'w-full'} flex flex-col justify-center`}>
                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <time dateTime={featuredPost.date}>
                        {formatDate(featuredPost.date)}
                      </time>
                      <span>•</span>
                      <span>{getReadingTime(featuredPost.body || '')} min</span>
                      {featuredPost.category && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600 dark:text-blue-400">
                            {featuredPost.category}
                          </span>
                        </>
                      )}
                    </div>

                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {featuredPost.title}
                    </h2>

                    {featuredPost.excerpt && (
                      <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                        {featuredPost.excerpt}
                      </p>
                    )}

                    {/* Tags */}
                    {featuredPost.tags && featuredPost.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {featuredPost.tags.slice(0, 3).map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </article>
          </motion.section>
        )}

        {/* Articles Grid */}
        {remainingPosts.length > 0 && (
          <motion.section 
            className="py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="mb-12">
              <div className="flex items-center">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-600"></span>
                <span className="px-6 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {t('blog.recentArticles')}
                </span>
                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-600"></span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {remainingPosts.map((post: Post, index: number) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <Link to={`/blog/${post.slug}`}>
                    {/* Image */}
                    {post.image && (
                      <div className="aspect-w-16 aspect-h-9">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <div className="p-6">
                      {/* Meta */}
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <time dateTime={post.date}>
                          {formatDate(post.date)}
                        </time>
                        <span>•</span>
                        <span>{getReadingTime(post.body || '')} min</span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {post.title}
                      </h3>

                      {post.excerpt && (
                        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}

                      {/* Category */}
                      {post.category && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {post.category}
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          </motion.section>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <motion.nav 
            className="py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="flex justify-center items-center space-x-4">
              {page > 1 && (
                <Link
                  to={`/blog?page=${page - 1}`}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  ← {t('blog.previousPage')}
                </Link>
              )}

              <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Page {page} {t('blog.of')} {pageCount}
              </span>

              {page < pageCount && (
                <Link
                  to={`/blog?page=${page + 1}`}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  {t('blog.nextPage')} →
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </div>

      {/* QuickNav */}
      <QuickNav />
    </div>
  );
}

export default function BlogIndex() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <BlogContent />
    </Suspense>
  );
}