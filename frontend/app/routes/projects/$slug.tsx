import { useLoaderData, Link } from "react-router";
import { config, generateMetaTags, formatDate, getResponsiveAttrs } from "~/lib/utils";
import { useI18n } from "~/i18n";
import { getProjectBySlug, getProjects } from "~/lib/api";
import { renderMarkdown } from "~/lib/markdown.server";
import { normalizeContent } from "~/lib/content.server";
import { MarkdownRenderer } from "~/components/MarkdownRenderer";
import type { Route } from "./+types/$slug";
import type { Project } from "~/lib/types";

export async function loader({ params }: Route.LoaderArgs) {
  const project = await getProjectBySlug(params.slug);
  if (!project) throw new Response("Not Found", { status: 404 });
  const normalizedContent = normalizeContent(project.content);
  const md = normalizedContent ? await renderMarkdown(normalizedContent) : { html: '', toc: [] };
  // Prev/Next projects by start_date
  let prev: any = null;
  let next: any = null;
  if (project.start_date) {
    const newer = await getProjects({ page: 1, pageSize: 1, sort: { start_date: 'asc' }, filters: { start_date: { $gt: project.start_date } } });
    const older = await getProjects({ page: 1, pageSize: 1, sort: { start_date: 'desc' }, filters: { start_date: { $lt: project.start_date } } });
    next = newer.projects?.[0] || null;
    prev = older.projects?.[0] || null;
  }
  return { project, html: md.html, toc: md.toc, prev, next };
}

export function meta({ data }: Route.MetaArgs) {
  const p = data?.project;
  const title = p?.seo?.metaTitle || p?.title || "Project";
  const description = p?.seo?.metaDescription || p?.description || "";
  const image = p?.featured_image;
  const url = p?.slug ? `${config.siteUrl}/projects/${p.slug}` : config.siteUrl;
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
  return {
    "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
  };
}

export default function ProjectPage() {
  const { t } = useI18n();
  const { project, html, toc, prev, next } = useLoaderData<{ project: Project; html: string; toc: any[]; prev?: any; next?: any }>();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.description || '',
    image: project.featured_image ? [project.featured_image] : undefined,
    url: `${config.siteUrl}/projects/${project.slug}`,
    datePublished: project.start_date,
    author: project.author?.name ? {
      '@type': 'Person',
      name: project.author.name,
    } : undefined,
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
        name: 'Projets',
        item: `${config.siteUrl}/projects`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: project.title,
        item: `${config.siteUrl}/projects/${project.slug}`,
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
            <Link to="/projects" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Projets
            </Link>
            <span>›</span>
            <span className="text-gray-900 dark:text-white">{project.title}</span>
          </nav>

          {/* Back to projects button */}
          <div className="mb-4">
            <Link to="/projects" className="btn-secondary inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t("projects.backToProjects")}
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {project.title}
            </h1>
          </div>
          
          {project.description && (
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              {project.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
            {project.author?.name && (
              <span>Par {project.author.name}</span>
            )}
            {project.start_date && (
              <span>{formatDate(project.start_date)}</span>
            )}
            {project.status_at && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                project.status_at === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                project.status_at === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
              }`}>
                {project.status_at}
              </span>
            )}
          </div>

          {/* Tags et liens */}
          <div className="mt-6 flex flex-wrap gap-4">
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag: string) => (
                  <span key={tag} className="tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            
            <div className="flex gap-3 ml-auto">
              {project.github_url && (
                <a 
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
              )}
              {project.demo_url && (
                <a 
                  href={project.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                  View Demo
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Image principale */}
        {project.featured_image && (
          <div className="mb-8">
            <img 
              {...getResponsiveAttrs((project as any).featured_image || (project as any).og_image || { url: project.featured_image })}
              alt={project.title}
              className="w-full h-64 md:h-80 object-cover rounded-xl shadow-lg"
              loading="lazy" decoding="async"
            />
          </div>
        )}
        
        {/* Contenu Markdown avec table des matières (SSR) */}
        <MarkdownRenderer content={project.content || ''} html={html} toc={toc} showToc={true} />

        {/* Prev/Next navigation */}
        {(prev || next) && (
          <div className="mt-12 border-t pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {prev ? (
              <Link to={`/projects/${prev.slug || prev.documentId || prev.id}`} className="btn-secondary">
                ← Projet précédent
              </Link>
            ) : <span />}
            {next && (
              <Link to={`/projects/${next.slug || next.documentId || next.id}`} className="btn-secondary">
                Projet suivant →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
