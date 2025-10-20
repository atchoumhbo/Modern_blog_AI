import type { Route } from "./+types/home";
import { Link, useLoaderData } from "react-router";
import { ArrowRight, BookOpen, Code, Zap, Users } from "lucide-react";
import { config, generateMetaTags, getResponsiveAttrs } from "~/lib/utils";
import { useI18n } from "~/i18n";
import { getPosts, getProjects } from "~/lib/api";
import { usePosts, useProjects } from "~/hooks/useApi";
import type { Post, Project } from "~/lib/types";
import { QuickNav } from "~/components/QuickNav";

export function meta({}: Route.MetaArgs) {
  return generateMetaTags({
    title: "Modern Blog Leader - AI-Powered Content & Cutting-Edge Design",
    description: "Experience the future of blogging with our AI-powered platform featuring modern design, dark mode, and exceptional performance.",
  });
}

export function headers(_: Route.HeadersArgs) {
  // Short-lived caching for homepage data; CDN/browser can re-use for 60s
  return {
    "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  };
}

export async function loader() {
  try {
    const [{ posts }, { projects }] = await Promise.all([
      getPosts({ page: 1, pageSize: 3 }),
      getProjects({ page: 1, pageSize: 3 }),
    ]);
    return { posts, projects };
  } catch {
    return { posts: [], projects: [] };
  }
}

// Use stable keys to resolve i18n strings reliably
const features = [
  {
    key: "lightning",
    icon: Zap,
    defaultTitle: "Lightning Fast",
    defaultDesc: "Built with React Router v7 and optimized for speed. Sub-second loading times guaranteed.",
  },
  {
    key: "ai",
    icon: BookOpen,
    defaultTitle: "AI-Powered Content",
    defaultDesc: "Intelligent content generation and curation powered by advanced AI algorithms.",
  },
  {
    key: "stack",
    icon: Code,
    defaultTitle: "Modern Tech Stack",
    defaultDesc: "Built with the latest technologies: React Router v7, TypeScript, Tailwind CSS, and Strapi.",
  },
  {
    key: "community",
    icon: Users,
    defaultTitle: "Community Driven",
    defaultDesc: "Join thousands of developers and writers in our growing community.",
  },
];

const stats = [
  { key: "activeUsers", labelDefault: "Active Users", value: "50K+" },
  { key: "articlesPublished", labelDefault: "Articles Published", value: "10K+" },
  { key: "communityMembers", labelDefault: "Community Members", value: "25K+" },
  { key: "countriesReached", labelDefault: "Countries Reached", value: "100+" },
];

export default function Home() {
  const { t, locale } = useI18n();
  const loaderData = useLoaderData<typeof loader>();
  const base = config.siteUrl.replace(/\/$/, "");
  
  // Utiliser les hooks côté client pour le filtrage par langue
  const { data: postsData } = usePosts({ page: 1, pageSize: 3, language: locale });
  const { data: projectsData } = useProjects({ page: 1, pageSize: 3, language: locale });
  
  // Utiliser les données filtrées par langue ou fallback sur loader
  const posts = postsData?.posts || loaderData.posts;
  const projects = projectsData?.projects || loaderData.projects;
  
  // Organization structured data
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.siteName,
    url: base,
    logo: `${base}/favicon.ico`,
    description: config.siteDescription,
    sameAs: [
      // Add your social media URLs here
      // 'https://twitter.com/youraccount',
      // 'https://github.com/youraccount',
    ],
  };

  // Website structured data
  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.siteName,
    url: base,
    description: config.siteDescription,
    publisher: {
      '@type': 'Organization',
      name: config.siteName,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${base}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  // Breadcrumb structured data
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: t('common.home', 'Home'),
        item: base,
      },
    ],
  };

  // Collection of articles for homepage
  const articlesLd = posts.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('home.latestPosts', 'Latest posts'),
    numberOfItems: posts.length,
    itemListElement: posts.map((post, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Article',
        headline: post.title,
        description: post.excerpt,
        url: post.slug ? `${base}/blog/${post.slug}` : `${base}/blog/post?id=${post.documentId || post.id}`,
        image: post.image,
        author: post.author?.name ? {
          '@type': 'Person',
          name: post.author.name,
        } : undefined,
        datePublished: post.date,
      },
    })),
  } : null;
  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {articlesLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articlesLd) }} />}
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-fade-in">
            {/* Page indicator */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
              </svg>
              {t("common.home", "Home")}
            </div>

            <QuickNav />
            
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6 mt-8">
              {t("home.heroTitle1", "The Future of")}
              <span className="text-gradient block sm:inline sm:ml-4">{t("home.heroTitle2", "Blogging")}</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              {t("home.heroDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* Latest Blog Posts */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {t("home.latestPosts")}
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('home.freshContentTitle', 'Fresh content regularly')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
              {t("home.latestPostsSubtitle")}
            </p>
            <Link to="/blog" className="btn-primary inline-flex items-center gap-2">
              {t("home.viewAllArticles")}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </Link>
          </div>
          
          {posts.length === 0 ? (
            <div className="card text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
              </svg>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t("home.noPostsTitle")}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t("home.noPostsDesc")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((p: Post, index) => (
                <article 
                  key={p.id} 
                  className="card group flex flex-col h-full"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Image (toujours présente) */}
                  <div className="relative overflow-hidden rounded-lg mb-4">
                    {p.image ? (
                      <img 
                        {...getResponsiveAttrs((p as any).featured_image || (p as any).og_image || { url: p.image })}
                        alt={p.title}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy" decoding="async"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  
                  {/* Contenu - flex-grow pour pousser le bouton vers le bas */}
                  <div className="flex-grow flex flex-col">
                    <h3 className="post-title text-lg mb-3">
                      {p.slug ? (
                        <Link to={`/blog/${p.slug}`}>{p.title}</Link>
                      ) : (
                        <Link to={`/blog/post?id=${p.documentId || p.id}`}>{p.title}</Link>
                      )}
                    </h3>
                    
                    {p.excerpt && (
                      <p className="post-excerpt mb-4 flex-grow">
                        {p.excerpt.length > 120 ? `${p.excerpt.slice(0, 120)}...` : p.excerpt}
                      </p>
                    )}
                    
                    {p.tags && p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {p.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="tag text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Bouton toujours en bas */}
                    <div className="mt-auto pt-4">
                      {p.slug ? (
                        <Link to={`/blog/${p.slug}`} className="read-more-btn text-sm">
                          Lire la suite
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                          </svg>
                        </Link>
                      ) : (
                        <Link to={`/blog/post?id=${p.documentId || p.id}`} className="read-more-btn text-sm">
                          Lire la suite
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t("home.featuresTitle", "Why Choose Our Platform?")}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t("home.featuresSubtitle", "We've built the most advanced blogging platform with features that matter.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={feature.key}
                  className="card text-center hover:scale-105 transition-transform duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {t(`home.features.${feature.key}.title`, feature.defaultTitle)}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t(`home.features.${feature.key}.desc`, feature.defaultDesc)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={stat.key}
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  {t(`home.stats.${stat.key}`, stat.labelDefault)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Projects */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M19 3H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM9 17H5a2 2 0 01-2-2v-6h6v8zm10-2a2 2 0 01-2 2h-6V9h8v6z"/>
              </svg>
              {t("home.latestProjects")}
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t("home.latestProjectsTitle")}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
              {t("home.latestProjectsDesc")}
            </p>
            <Link to="/projects" className="btn-primary inline-flex items-center gap-2">
              {t("home.viewAllProjects")}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </Link>
          </div>
          
          {projects.length === 0 ? (
            <div className="card text-center py-12">{t("home.noProjectsDesc")}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((p: Project, index) => (
                <article
                  key={p.id}
                  className="card group flex flex-col h-full"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Image section with hover effect or placeholder */}
                  <div className="relative overflow-hidden rounded-lg mb-4">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.title}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  {/* Content */}
                  <div className="flex-grow flex flex-col">
                    <h3 className="post-title text-lg mb-3">
                      <Link to={`/projects/${p.slug || p.documentId || p.id}`}>{p.title}</Link>
                    </h3>

                    {p.description && (
                      <p className="post-excerpt mb-4 flex-grow">
                        {p.description.length > 120 ? `${p.description.slice(0, 120)}...` : p.description}
                      </p>
                    )}

                    {p.tags && p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {p.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="tag text-xs">#{tag}</span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto pt-4">
                      <Link to={`/projects/${p.slug || p.documentId || p.id}`} className="read-more-btn text-sm">
                        {t("common.readMore", "Lire la suite")}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            {t("home.ctaTitle")}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            {t("home.ctaDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/blog" className="btn-primary inline-flex items-center group">
              {t("home.ctaPrimary")}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/contact" className="btn-secondary">
              {t("home.ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
