import type { Route } from "./+types/index";
import { Link, useLoaderData } from "react-router";
import { config, generateMetaTags, formatDate, getResponsiveAttrs } from "~/lib/utils";
import { useI18n } from "~/i18n";
import { getProjects } from "~/lib/api";
import type { Project } from "~/lib/types";
import { QuickNav } from "~/components/QuickNav";

export function meta({ data }: Route.MetaArgs) {
  const base = `${config.siteUrl}/projects`;
  const page = data?.meta?.pagination?.page || 1;
  const pageCount = data?.meta?.pagination?.pageCount || 1;
  const canonicalURL = page > 1 ? `${base}?page=${page}` : base;
  const tags = generateMetaTags({
    title: "Projects - Modern Blog Leader",
    description: "Explore our portfolio of cutting-edge projects and innovations.",
    canonicalURL,
    keywords: "projects, portfolio, case studies, web apps, open-source"
  });
  const extra: any[] = [];
  if (page > 1) extra.push({ rel: 'prev', href: `${base}?page=${page - 1}` });
  if (page < pageCount) extra.push({ rel: 'next', href: `${base}?page=${page + 1}` });
  return [...tags, ...extra];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = 12;
  const { projects, meta } = await getProjects({ page, pageSize });
  return { projects, meta };
}

export default function ProjectsIndex() {
  const { t } = useI18n();
  const { projects, meta } = useLoaderData<typeof loader>();
  const page = meta?.pagination?.page || 1;
  const pageCount = meta?.pagination?.pageCount || 1;
  // Featured + grid layout (homogène avec blog)
  const featuredProject = projects[0];
  const remaining = projects.slice(1);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-fade-in">
            {/* Page indicator */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h5l5-5V5a2 2 0 00-2-2H5z" />
              </svg>
              {t("common.projects", "Projets")}
            </div>

            <QuickNav />
            
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6 mt-8">
              {t("projects.title").split(' ')[0]} <span className="text-gradient">{t("projects.title").split(' ')[1]}</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              {t("projects.subtitle", "A selection of recent projects with stack, demos and code.")}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">

      {projects.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t("projects.noneTitle")}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t("projects.noneDesc")}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Featured Project */}
          {featuredProject && (
            <article className="card card-featured">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  {featuredProject.image && (
                    <img
                      {...getResponsiveAttrs((featuredProject as any).featured_image || (featuredProject as any).og_image || { url: featuredProject.image })}
                      alt={featuredProject.title}
                      className="w-full h-80 object-cover rounded-lg shadow-lg"
                      loading="lazy" decoding="async"
                    />
                  )}
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full mb-4">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 8l4 4 6-6" />
                    </svg>
                    {t("projects.featuredProject")}
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                    <Link to={`/projects/${featuredProject.slug || featuredProject.documentId || featuredProject.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {featuredProject.title}
                    </Link>
                  </h2>
                  <div className="post-meta">
                    {featuredProject.author?.name && <span>Par {featuredProject.author.name}</span>}
                    {featuredProject.date && <span>{formatDate(featuredProject.date)}</span>}
                  </div>
                  {featuredProject.description && (
                    <p className="post-excerpt text-lg">{featuredProject.description}</p>
                  )}
                  {(featuredProject.tags?.length || featuredProject.technologies?.length) && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {featuredProject.tags?.map((tag) => (
                        <span key={`tag-${tag}`} className="tag">#{tag}</span>
                      ))}
                      {featuredProject.technologies?.map((tech) => (
                        <span key={`tech-${tech}`} className="tag">{tech}</span>
                      ))}
                    </div>
                  )}
                    <div className="flex gap-3">
                    <Link to={`/projects/${featuredProject.slug || featuredProject.documentId || featuredProject.id}`} className="btn-primary">Lire la suite</Link>
                    {featuredProject.github_url && (
                      <a href={featuredProject.github_url} target="_blank" rel="noopener noreferrer" className="btn-secondary">GitHub</a>
                    )}
                    {featuredProject.demo_url && (
                      <a href={featuredProject.demo_url} target="_blank" rel="noopener noreferrer" className="btn-secondary">Demo</a>
                    )}
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* Grid Projects */}
          {remaining.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">{t("projects.more")}</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {remaining.map((p: Project) => (
                  <article key={p.id} className="card group flex flex-col">
                    {p.image && (
                      <div className="relative overflow-hidden rounded-lg mb-4">
                        <img
                          {...getResponsiveAttrs((p as any).featured_image || (p as any).og_image || { url: p.image })}
                          alt={p.title}
                          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy" decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    )}
                    <h2 className="post-title">
                      <Link to={`/projects/${p.slug || p.documentId || p.id}`}>{p.title}</Link>
                    </h2>
                    <div className="post-meta text-xs">
                      {p.author?.name && <span>By {p.author.name}</span>}
                      {p.date && <span>• {formatDate(p.date)}</span>}
                    </div>
                    {p.description && (
                      <p className="post-excerpt">
                        {p.description.length > 120 ? `${p.description.slice(0, 120)}...` : p.description}
                      </p>
                    )}
                    {(p.tags?.length || p.technologies?.length) && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {p.tags?.slice(0, 3).map((tag) => (
                          <span key={`tag-${tag}`} className="tag text-xs">#{tag}</span>
                        ))}
                        {p.technologies?.slice(0, 2).map((tech) => (
                          <span key={`tech-${tech}`} className="tag text-xs">{tech}</span>
                        ))}
                        {p.tags && p.tags.length > 3 && (
                          <span className="text-xs text-gray-400">+{p.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                    <div className="mt-auto">
                      <Link to={`/projects/${p.slug || p.documentId || p.id}`} className="read-more-btn">
                        Lire la suite
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
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
  return {
    "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  };
}